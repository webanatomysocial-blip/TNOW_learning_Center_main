const express = require("express");
const crypto = require("node:crypto");
const db = require("../db");
const { requireAdmin } = require("../middleware/auth");
const { sendInviteEmail, sendAdminProgressNotification } = require("../lib/mailer");

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_TTL_HOURS = 24;
const MIN_TTL_HOURS = 1;
const MAX_TTL_HOURS = 24 * 30; // 30 days
const MAX_CODE_ATTEMPTS = 5;
// A customer pinging the progress endpoint within this window is treated as
// "currently in the experience right now", surfaced as an "active" status.
const ACTIVE_WINDOW_MS = 5 * 60 * 1000;

// Unambiguous, URL-safe alphabet — no 0/O, 1/I/L, so the masked link is easy to read/type.
const URL_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function parseEmails(raw) {
  return String(raw || "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
}

function clampHours(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return DEFAULT_TTL_HOURS;
  return Math.min(MAX_TTL_HOURS, Math.max(MIN_TTL_HOURS, Math.round(n)));
}

function hash(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function generateUrlCode(length = 8) {
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += URL_CODE_ALPHABET[bytes[i] % URL_CODE_ALPHABET.length];
  }
  return out;
}

function generateSecurityCode() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

function buildLoginUrl(urlCode) {
  const base = process.env.FRONTEND_URL || "http://localhost:5173";
  return `${base}/login/${urlCode}`;
}

// The DB only ever stores "pending" / "used" / "revoked" — expiry is a function of
// time, not a stored state — so compute the display status the same way
// validityCheck() would, rather than letting an expired link show as "Pending" forever.
function effectiveStatus(row) {
  if (row.status === "pending" && new Date(row.expires_at) <= new Date()) {
    return "expired";
  }
  if (
    (row.status === "pending" || row.status === "used") &&
    row.progress_updated_at &&
    Date.now() - new Date(row.progress_updated_at).getTime() < ACTIVE_WINDOW_MS
  ) {
    return "active";
  }
  return row.status;
}

function parseProgressSteps(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseAllowedProductSlugs(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeProductSlugs(value) {
  const arr = Array.isArray(value) ? value : [];
  return [...new Set(arr.map((s) => String(s).trim()).filter(Boolean))];
}

function publicInvite(row) {
  if (!row) return row;
  const { token_hash, device_fingerprint, security_code_hash, code_attempts, ...rest } = row;
  return {
    ...rest,
    status: effectiveStatus(row),
    ...(rest.progress_steps !== undefined
      ? { progress_steps: parseProgressSteps(rest.progress_steps) }
      : {}),
    ...(rest.allowed_product_slugs !== undefined
      ? { allowed_product_slugs: parseAllowedProductSlugs(rest.allowed_product_slugs) }
      : {}),
  };
}

async function createOneInvite({ email, duration_hours, device_lock, single_use, allowed_product_slugs }) {
  const urlCode = generateUrlCode();
  const securityCode = generateSecurityCode();
  const now = new Date();
  const expires_at = new Date(now.getTime() + duration_hours * 60 * 60 * 1000);

  const [id] = await db("email_invites").insert({
    email,
    token_hash: hash(urlCode),
    security_code_hash: hash(securityCode),
    code_attempts: 0,
    status: "pending",
    device_lock,
    single_use,
    use_count: 0,
    duration_hours,
    allowed_product_slugs: allowed_product_slugs?.length
      ? JSON.stringify(allowed_product_slugs)
      : null,
    sent_at: now,
    expires_at,
    updated_at: now,
  });

  const loginUrl = buildLoginUrl(urlCode);
  let emailError = null;
  try {
    await sendInviteEmail({
      to: email,
      loginUrl,
      securityCode,
      durationHours: duration_hours,
      singleUse: single_use,
    });
  } catch (err) {
    // The invite row above is already committed and its link is already valid —
    // a mail-server hiccup (bad credentials, rate limit, etc.) shouldn't make that
    // invite invisible to the admin. Surface the failure but still return the
    // link/code so it can be copied and sent manually.
    console.error(`[email-invites] Failed to send invite email to ${email}:`, err.message);
    emailError = err.message || "Failed to send the email.";
  }

  const row = await db("email_invites")
    .where({ id: id ?? undefined })
    .first();
  return { ...publicInvite(row), loginUrl, securityCode, emailError };
}

// ---------- Admin routes ----------

router.post("/api/admin/email-invites", requireAdmin, async (req, res) => {
  const body = req.body || {};
  const emails = parseEmails(body.emails ?? body.email);
  if (!emails.length) {
    return res.status(400).json({ message: "At least one email is required" });
  }

  const valid = emails.filter((e) => EMAIL_RE.test(e));
  const invalid = emails.filter((e) => !EMAIL_RE.test(e));
  if (!valid.length) {
    return res.status(400).json({ message: "No valid email addresses were given", invalid });
  }

  const duration_hours = clampHours(body.expiresInHours);
  const device_lock = body.deviceLock !== false;
  const single_use = body.singleUse !== false;
  const allowed_product_slugs = normalizeProductSlugs(body.productSlugs);

  try {
    const created = [];
    for (const email of valid) {
      created.push(
        await createOneInvite({ email, duration_hours, device_lock, single_use, allowed_product_slugs }),
      );
    }
    res.status(201).json({ created, invalid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create invite(s)" });
  }
});

router.get("/api/admin/email-invites", requireAdmin, async (req, res) => {
  try {
    const rows = await db("email_invites")
      .select(
        "id",
        "email",
        "status",
        "sent_at",
        "expires_at",
        "used_at",
        "created_at",
        "device_lock",
        "duration_hours",
        "single_use",
        "use_count",
        "filled_name",
        "progress_percent",
        "progress_steps",
        "progress_updated_at",
        "videos_watched",
        "videos_total",
        "product_slug",
        "allowed_product_slugs",
      )
      .orderBy("created_at", "desc");
    res.json(
      rows.map((row) => ({
        ...row,
        status: effectiveStatus(row),
        progress_steps: parseProgressSteps(row.progress_steps),
        allowed_product_slugs: parseAllowedProductSlugs(row.allowed_product_slugs),
      })),
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch invites" });
  }
});

router.post("/api/admin/email-invites/:id/resend", requireAdmin, async (req, res) => {
  try {
    const existing = await db("email_invites").where({ id: req.params.id }).first();
    if (!existing) return res.status(404).json({ message: "Not found" });

    const urlCode = generateUrlCode();
    const securityCode = generateSecurityCode();
    const now = new Date();
    const duration_hours = clampHours(existing.duration_hours);
    const expires_at = new Date(now.getTime() + duration_hours * 60 * 60 * 1000);

    await db("email_invites")
      .where({ id: req.params.id })
      .update({
        token_hash: hash(urlCode),
        security_code_hash: hash(securityCode),
        code_attempts: 0,
        status: "pending",
        expires_at,
        device_fingerprint: null,
        used_at: null,
        use_count: 0,
        filled_name: null,
        sent_at: now,
        updated_at: now,
      });

    const loginUrl = buildLoginUrl(urlCode);
    let emailError = null;
    try {
      await sendInviteEmail({
        to: existing.email,
        loginUrl,
        securityCode,
        durationHours: duration_hours,
        singleUse: existing.single_use,
      });
    } catch (err) {
      console.error(`[email-invites] Failed to resend invite email to ${existing.email}:`, err.message);
      emailError = err.message || "Failed to send the email.";
    }

    const updated = await db("email_invites").where({ id: req.params.id }).first();
    res.json({ ...publicInvite(updated), loginUrl, securityCode, emailError });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to resend invite" });
  }
});

router.delete("/api/admin/email-invites/:id", requireAdmin, async (req, res) => {
  try {
    const existing = await db("email_invites").where({ id: req.params.id }).first();
    if (!existing) return res.status(404).json({ message: "Not found" });

    await db("email_invites")
      .where({ id: req.params.id })
      .update({ status: "revoked", updated_at: new Date() });

    const updated = await db("email_invites").where({ id: req.params.id }).first();
    res.status(200).json(publicInvite(updated));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to revoke invite" });
  }
});

// Permanent delete — removes the row entirely (unlike revoke, which keeps history
// but disables the link). Used when the admin wants it gone from the list for good.
router.delete("/api/admin/email-invites/:id/permanent", requireAdmin, async (req, res) => {
  try {
    const count = await db("email_invites").where({ id: req.params.id }).del();
    if (!count) return res.status(404).json({ message: "Not found" });
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete invite" });
  }
});

// ---------- Public masked login-link routes ----------

async function loadInvite(urlCode) {
  return db("email_invites").where({ token_hash: hash(urlCode) }).first();
}

function validityCheck(invite) {
  if (!invite) return { ok: false, code: 404, message: "This link is invalid." };
  if (invite.status === "used") {
    return { ok: false, code: 410, message: "This link has already been used." };
  }
  if (invite.status === "revoked") {
    return { ok: false, code: 410, message: "This link is no longer available." };
  }
  if (new Date(invite.expires_at) <= new Date()) {
    return { ok: false, code: 410, message: "This link has expired." };
  }
  if (invite.status !== "pending") {
    return { ok: false, code: 410, message: "This link is invalid." };
  }
  return { ok: true };
}

// Safe to call repeatedly (e.g. email-scanner prefetching) — never consumes, never
// reveals whose invite this is. Just confirms the link itself is still alive so the
// frontend can show the security-code entry form.
router.get("/api/magic/:code", async (req, res) => {
  try {
    const invite = await loadInvite(req.params.code);
    const check = validityCheck(invite);
    if (!check.ok) return res.status(check.code).json({ message: check.message });

    const deviceId = req.query.deviceId;
    if (invite.device_lock && deviceId && !invite.device_fingerprint) {
      await db("email_invites")
        .where({ id: invite.id })
        .update({ device_fingerprint: deviceId, updated_at: new Date() });
    }

    res.json({ valid: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to look up link" });
  }
});

// Checked as soon as the customer types their email (before they ever reach the
// security-code step) — a wrong email must not be allowed to proceed. Doesn't touch
// code_attempts (email isn't the secret, the security code is).
router.post("/api/magic/:code/check-email", async (req, res) => {
  try {
    const invite = await loadInvite(req.params.code);
    const check = validityCheck(invite);
    if (!check.ok) return res.status(check.code).json({ message: check.message });

    const submittedEmail = String((req.body || {}).email || "").trim().toLowerCase();
    const matches = !!submittedEmail && submittedEmail === invite.email.trim().toLowerCase();
    res.json({ matches });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to verify email" });
  }
});

// Requires the security code sent in the same email — the link alone is not enough.
router.post("/api/magic/:code/consume", async (req, res) => {
  try {
    const invite = await loadInvite(req.params.code);
    const check = validityCheck(invite);
    if (!check.ok) return res.status(check.code).json({ message: check.message });

    const deviceId = (req.body || {}).deviceId;
    if (invite.device_lock && invite.device_fingerprint && invite.device_fingerprint !== deviceId) {
      return res.status(403).json({
        message: "This link was opened on a different device and can no longer be used here.",
      });
    }

    const submittedEmail = String((req.body || {}).email || "").trim().toLowerCase();
    if (!submittedEmail || submittedEmail !== invite.email.trim().toLowerCase()) {
      return res.status(400).json({ message: "This invite wasn't sent to that email address." });
    }

    const securityCode = String((req.body || {}).securityCode || "").trim();
    if (!securityCode || hash(securityCode) !== invite.security_code_hash) {
      const attempts = invite.code_attempts + 1;
      if (attempts >= MAX_CODE_ATTEMPTS) {
        await db("email_invites")
          .where({ id: invite.id })
          .update({ status: "revoked", code_attempts: attempts, updated_at: new Date() });
        return res.status(410).json({
          message: "Too many incorrect attempts. This link has been disabled — request a new one.",
        });
      }
      await db("email_invites")
        .where({ id: invite.id })
        .update({ code_attempts: attempts, updated_at: new Date() });
      return res.status(401).json({
        message: `Incorrect security code. ${MAX_CODE_ATTEMPTS - attempts} attempt${
          MAX_CODE_ATTEMPTS - attempts === 1 ? "" : "s"
        } remaining.`,
      });
    }

    const filledName = String((req.body || {}).name || "").trim();
    const now = new Date();
    await db("email_invites")
      .where({ id: invite.id })
      .update({
        status: invite.single_use ? "used" : "pending",
        used_at: now,
        use_count: invite.use_count + 1,
        filled_name: filledName || invite.filled_name,
        device_fingerprint: invite.device_lock ? invite.device_fingerprint || deviceId || null : null,
        updated_at: now,
      });

    res.json({ email: invite.email, inviteId: invite.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to complete login" });
  }
});

// Reports how far the customer has gotten through the experience flow (Welcome →
// Why → Product Tour → Customer Stories → AI Expert → Book Workshop), so the admin
// can see engagement in the Sent Emails list without the customer needing to finish
// anything or come back through the link again. Deliberately doesn't check link
// validity/expiry — a session that's already logged in should keep reporting progress
// even after its single-use link has been consumed or later expires. Protected only
// by requiring the email to match (progress data isn't sensitive; this just stops a
// stranger from overwriting someone else's invite's progress by guessing an id).
router.post("/api/invites/:id/progress", async (req, res) => {
  try {
    const invite = await db("email_invites").where({ id: req.params.id }).first();
    if (!invite) return res.status(404).json({ message: "Not found" });

    const submittedEmail = String((req.body || {}).email || "").trim().toLowerCase();
    if (!submittedEmail || submittedEmail !== invite.email.trim().toLowerCase()) {
      return res.status(403).json({ message: "Email does not match this invite." });
    }

    const pct = Math.max(0, Math.min(100, Math.round(Number((req.body || {}).pct) || 0)));
    const steps = Array.isArray((req.body || {}).steps) ? (req.body || {}).steps : [];
    const videosWatched = Math.max(0, Math.round(Number((req.body || {}).videosWatched) || 0));
    const videosTotal = Math.max(0, Math.round(Number((req.body || {}).videosTotal) || 0));
    const productSlug = (req.body || {}).productSlug ? String(req.body.productSlug).trim() : null;

    // Progress only ever moves forward — a stale/out-of-order request (e.g. from a
    // background tab) shouldn't regress what's already been recorded.
    const newPct = Math.max(pct, invite.progress_percent);
    const newProductSlug = productSlug || invite.product_slug;

    if (pct < invite.progress_percent && videosWatched <= invite.videos_watched) {
      return res.json({ ok: true, progress_percent: invite.progress_percent });
    }

    let shouldNotify = false;
    if (newPct >= 40 && !invite.admin_notified) {
      shouldNotify = true;
    }

    await db("email_invites")
      .where({ id: invite.id })
      .update({
        progress_percent: newPct,
        progress_steps: JSON.stringify(steps),
        progress_updated_at: new Date(),
        videos_watched: Math.max(videosWatched, invite.videos_watched),
        videos_total: videosTotal || invite.videos_total,
        product_slug: newProductSlug,
        admin_notified: shouldNotify ? 1 : invite.admin_notified,
      });

    if (shouldNotify) {
      const adminEmail =
        process.env.ADMIN_NOTIFICATION_EMAIL ||
        process.env.ADMIN_EMAIL ||
        "webanatomysocial@gmail.com";
      sendAdminProgressNotification({
        adminEmail,
        userEmail: invite.email,
        productSlug: newProductSlug || "unknown",
        progressPercent: newPct,
      }).catch((e) => {
        console.error("[mailer] Failed to send admin progress notification:", e.message);
      });
    }

    res.json({ ok: true, progress_percent: newPct });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to record progress" });
  }
});

// Public — read by ProductSelection.jsx after login to restrict which products a
// customer sees. Only ever returns the slug list, nothing sensitive; the id alone
// (no email/security-code check) is enough since there's nothing to protect here.
router.get("/api/invites/:id/allowed-products", async (req, res) => {
  try {
    const invite = await db("email_invites")
      .where({ id: req.params.id })
      .select("allowed_product_slugs")
      .first();
    if (!invite) return res.status(404).json({ message: "Not found" });
    res.json({ allowed_product_slugs: parseAllowedProductSlugs(invite.allowed_product_slugs) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch allowed products" });
  }
});

module.exports = router;
