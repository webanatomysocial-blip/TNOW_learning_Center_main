const express = require("express");
const crypto = require("node:crypto");
const db = require("../db");
const { requireAdmin } = require("../middleware/auth");
const {
  sendInviteEmail,
  sendAdminProgressNotification,
  sendAdminProductAccessRequest,
  sendProductAccessApprovedEmail,
  sendAdminDeviceAccessRequest,
  sendDeviceAccessApprovedEmail,
  sendNotifyMeRequest,
  sendWorkshopRequestNotification,
  sendAssessmentCompletedNotification,
  sendRoiReportNotification,
  sendSupportTicketEmails,
} = require("../lib/mailer");

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

// null means unlimited (the existing "multiple, until it expires" behavior) — only
// a positive integer turns it into a real cap.
function normalizeUsageLimit(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return null;
  return Math.round(n);
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

function resolveAdminEmail(type) {
  if (type === "secops" || type === "quiz" || type === "assessment" || type === "roi") {
    return process.env.SECOPS_NOTIFICATION_EMAIL || process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || "sales@togglenow.com";
  }
  return process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || "sales@togglenow.com";
}

// The DB only ever stores "pending" / "used" / "revoked" — expiry is a function of
// time, not a stored state — so compute the display status the same way
// validityCheck() would, rather than letting an expired link show as "Pending" forever.
function effectiveStatus(row) {
  if (row.status === "revoked") {
    return "revoked";
  }
  // A used/single-use invite stays "used" forever, even once its expires_at
  // passes — expiry only matters for links nobody has completed yet.
  if (row.status === "used") {
    return "used";
  }
  if (new Date(row.expires_at) <= new Date()) {
    return "expired";
  }
  // If the link has been clicked/used, it's considered active, not pending.
  if (row.use_count > 0 || row.used_at) {
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

async function createOneInvite({ email, duration_hours, device_lock, single_use, usage_limit, allowed_product_slugs }) {
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
    usage_limit,
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
      usageLimit: usage_limit,
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
  // A custom cap only makes sense for a multi-use link — single-use already caps at 1.
  const usage_limit = single_use ? null : normalizeUsageLimit(body.usageLimit);
  const allowed_product_slugs = normalizeProductSlugs(body.productSlugs);

  try {
    // An email already in the Sent Emails list gets Resend, not a second invite
    // row — otherwise the same person accumulates duplicate links/rows over time.
    const existingRows = await db("email_invites")
      .whereIn(
        db.raw("LOWER(email)"),
        valid.map((e) => e.toLowerCase()),
      )
      .select("email");
    const existingEmails = new Set(existingRows.map((r) => r.email.toLowerCase()));
    const duplicate = valid.filter((e) => existingEmails.has(e.toLowerCase()));
    const toCreate = valid.filter((e) => !existingEmails.has(e.toLowerCase()));

    const created = [];
    for (const email of toCreate) {
      created.push(
        await createOneInvite({ email, duration_hours, device_lock, single_use, usage_limit, allowed_product_slugs }),
      );
    }
    res.status(201).json({ created, invalid, duplicate });
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
        "usage_limit",
        "use_count",
        "filled_name",
        "progress_percent",
        "progress_steps",
        "progress_updated_at",
        "videos_watched",
        "videos_total",
        "product_slug",
        "allowed_product_slugs",
        "access_requested_at",
      )
      .orderBy("created_at", "desc");

    const progressRows = rows.length
      ? await db("invite_product_progress").whereIn(
          "invite_id",
          rows.map((r) => r.id),
        )
      : [];
    const progressByInvite = {};
    for (const p of progressRows) {
      (progressByInvite[p.invite_id] ??= []).push({
        product_slug: p.product_slug,
        progress_percent: p.progress_percent,
        progress_steps: parseProgressSteps(p.progress_steps),
        videos_watched: p.videos_watched,
        videos_total: p.videos_total,
        admin_notified: !!p.admin_notified,
        updated_at: p.updated_at,
      });
    }
    for (const list of Object.values(progressByInvite)) {
      list.sort((a, b) => b.progress_percent - a.progress_percent);
    }

    const accessRequestRows = rows.length
      ? await db("invite_product_access_requests")
          .whereIn("invite_id", rows.map((r) => r.id))
          .where({ status: "pending" })
      : [];
    const accessRequestsByInvite = {};
    for (const r of accessRequestRows) {
      (accessRequestsByInvite[r.invite_id] ??= []).push({
        product_slug: r.product_slug,
        requested_at: r.requested_at,
      });
    }

    const consentRows = rows.length
      ? await db("cookie_consents")
          .whereIn("email", rows.map((r) => r.email))
          .orderBy("consented_at", "desc")
      : [];
    const consentsByEmail = {};
    for (const c of consentRows) {
      (consentsByEmail[c.email] ??= []).push({
        id: c.id,
        device_id: c.device_id,
        user_agent: c.user_agent,
        ip: c.ip,
        consented_at: c.consented_at,
      });
    }

    const assessmentRows = rows.length
      ? await db("invite_assessment_results").whereIn(
          "invite_id",
          rows.map((r) => r.id),
        )
      : [];
    const assessmentsByInvite = {};
    for (const a of assessmentRows) {
      (assessmentsByInvite[a.invite_id] ??= []).push({
        product_slug: a.product_slug,
        score: a.score,
        tier_id: a.tier_id,
        tier_name: a.tier_name,
        answers: JSON.parse(a.answers || "[]"),
        roi_config: a.roi_config ? JSON.parse(a.roi_config) : null,
        roi_results: a.roi_results ? JSON.parse(a.roi_results) : null,
        roi_updated_at: a.roi_updated_at,
        updated_at: a.updated_at,
      });
    }

    res.json(
      rows.map((row) => ({
        ...row,
        status: effectiveStatus(row),
        progress_steps: parseProgressSteps(row.progress_steps),
        allowed_product_slugs: parseAllowedProductSlugs(row.allowed_product_slugs),
        product_progress: progressByInvite[row.id] || [],
        pending_product_requests: accessRequestsByInvite[row.id] || [],
        sessions: consentsByEmail[row.email] || [],
        assessment_results: assessmentsByInvite[row.id] || [],
      })),
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch invites" });
  }
});

// Unlocks a device-locked invite so it can be opened from a new device, and sends
// the newly generated login link and security code to the user.
router.post("/api/admin/email-invites/:id/grant-access", requireAdmin, async (req, res) => {
  try {
    const existing = await db("email_invites").where({ id: req.params.id }).first();
    if (!existing) return res.status(404).json({ message: "Not found" });

    const urlCode = generateUrlCode();
    const securityCode = generateSecurityCode();
    const loginUrl = buildLoginUrl(urlCode);

    const now = new Date();
    const duration_hours = clampHours(existing.duration_hours);
    const expires_at =
      new Date(existing.expires_at) > now
        ? existing.expires_at
        : new Date(now.getTime() + duration_hours * 60 * 60 * 1000);

    await db("email_invites")
      .where({ id: req.params.id })
      .update({
        status: "pending",
        token_hash: hash(urlCode),
        security_code_hash: hash(securityCode),
        code_attempts: 0,
        // Fresh credentials means a fresh usage window too — otherwise a usage-capped
        // invite that already hit its limit re-exhausts on the very next login.
        use_count: 0,
        device_fingerprint: null,
        access_requested_at: null,
        expires_at,
        updated_at: now,
      });

    sendDeviceAccessApprovedEmail({
      userEmail: existing.email,
      loginUrl,
      securityCode
    }).catch((e) => {
      console.error("[mailer] Failed to send device access approved email:", e.message);
    });

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to grant access" });
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
        sent_at: now,
        used_at: null,
        use_count: 0,
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
        usageLimit: existing.usage_limit,
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
  if (!invite) return { ok: false, code: 404, message: "This link is invalid.", reason: "invalid" };
  if (invite.status === "used") {
    return { ok: false, code: 410, message: "This link has already been used.", reason: "used" };
  }
  if (invite.status === "revoked") {
    return { ok: false, code: 410, message: "This link is no longer available.", reason: "revoked" };
  }
  if (new Date(invite.expires_at) <= new Date()) {
    return { ok: false, code: 410, message: "This link has expired.", reason: "expired" };
  }
  if (invite.status !== "pending") {
    return { ok: false, code: 410, message: "This link is invalid.", reason: "invalid" };
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
    if (!check.ok) return res.status(check.code).json({ message: check.message, reason: check.reason });

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

// Requires the security code sent in the same email — the link alone is not enough.
// The visitor never re-types their email: the code was only ever sent to
// invite.email, so successfully entering it already proves that inbox access —
// asking for the email again on top of that is redundant friction, not extra
// security.
router.post("/api/magic/:code/consume", async (req, res) => {
  try {
    const invite = await loadInvite(req.params.code);
    const check = validityCheck(invite);
    if (!check.ok) return res.status(check.code).json({ message: check.message });

    const deviceId = (req.body || {}).deviceId;
    if (invite.device_lock && invite.device_fingerprint && invite.device_fingerprint !== deviceId) {
      return res.status(403).json({
        message: "This link was opened on a different device and can no longer be used here.",
        deviceLocked: true,
      });
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
    // Row-locked read-modify-write — without this, two concurrent /consume calls
    // on the same multi-use invite (e.g. two tabs) can both read the same
    // use_count and both write the same increment, letting the invite exceed
    // its usage_limit (same race the /progress endpoint above guards against).
    await db.transaction(async (trx) => {
      const locked = await trx("email_invites").where({ id: invite.id }).forUpdate().first();
      const newUseCount = locked.use_count + 1;
      const exhausted = locked.single_use || (locked.usage_limit != null && newUseCount >= locked.usage_limit);
      await trx("email_invites")
        .where({ id: invite.id })
        .update({
          status: exhausted ? "used" : "pending",
          used_at: now,
          use_count: newUseCount,
          filled_name: filledName || locked.filled_name,
          device_fingerprint: locked.device_lock ? locked.device_fingerprint || deviceId || null : null,
          updated_at: now,
        });
      return exhausted;
    });

    // The cookie-consent banner (on this same /login page) never collects an email —
    // by the time it's shown, login hasn't happened yet. Now that we know who this
    // device belongs to, attach it retroactively to any consent rows still missing one.
    if (deviceId) {
      await db("cookie_consents")
        .where({ device_id: deviceId })
        .whereNull("email")
        .update({ email: invite.email });
    }

    res.json({ email: invite.email, inviteId: invite.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to complete login" });
  }
});

// Called from the "this link was opened on a different device" dead end — flags the
// invite so the admin can grant access from a new device instead of the customer
// being stuck. Doesn't unlock anything itself, just records the ask.
router.post("/api/magic/:code/request-access", async (req, res) => {
  try {
    const invite = await loadInvite(req.params.code);
    if (!invite) return res.status(404).json({ message: "This link is invalid." });
    await db("email_invites")
      .where({ id: invite.id })
      .update({ access_requested_at: new Date(), updated_at: new Date() });

    const requestedReason = (req.body || {}).reason;
    const reason = ["expired", "revoked", "used"].includes(requestedReason) ? requestedReason : "device";
    const adminEmail = resolveAdminEmail();
    sendAdminDeviceAccessRequest({ adminEmail, userEmail: invite.email, reason }).catch((e) => {
      console.error("[mailer] Failed to send device access request notification:", e.message);
    });

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send request" });
  }
});

// Polled periodically by an already-logged-in session (see ExperienceLayout) so an
// admin revoking the invite kicks the customer out instead of leaving their tab
// working until they close it. Just the status, not the full invite.
router.get("/api/invites/:id/status", async (req, res) => {
  try {
    const invite = await db("email_invites").where({ id: req.params.id }).first();
    if (!invite) return res.status(404).json({ status: "revoked" });
    res.json({ status: effectiveStatus(invite) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to check invite status" });
  }
});

// Endpoint for revoked users to request access back. Keyed by the raw numeric id
// (unlike /api/magic/:code/request-access, which is keyed by the secret code) —
// requiring the email to match, same as /progress above, stops anyone from
// enumerating ids to flip access_requested_at and spam the admin inbox for
// invites that aren't theirs.
router.post("/api/invites/:id/request-access", async (req, res) => {
  try {
    const invite = await db("email_invites").where({ id: req.params.id }).first();
    if (!invite) return res.status(404).json({ message: "Not found" });

    const submittedEmail = String((req.body || {}).email || "").trim().toLowerCase();
    if (!submittedEmail || submittedEmail !== invite.email.trim().toLowerCase()) {
      return res.status(403).json({ message: "Email does not match this invite." });
    }

    await db("email_invites")
      .where({ id: invite.id })
      .update({ access_requested_at: new Date(), updated_at: new Date() });

    const adminEmail = resolveAdminEmail();
    sendAdminDeviceAccessRequest({ adminEmail, userEmail: invite.email, reason: "revoked" }).catch((e) => {
      console.error("[mailer] Failed to send device access request notification:", e.message);
    });

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to request access" });
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
    // Falls back to whatever was last recorded only for old clients that predate
    // per-product tracking — the current frontend always sends its productSlug.
    const productSlug = (req.body || {}).productSlug
      ? String(req.body.productSlug).trim()
      : invite.product_slug;
    if (!productSlug) return res.status(400).json({ message: "productSlug is required" });

    // Read-modify-write across two tables (per-product progress + the mirrored
    // headline on email_invites) — wrapped in a transaction with a row lock on the
    // existing progress row so two concurrent requests for the same invite/product
    // (e.g. two open tabs) can't interleave and clobber each other's newPct.
    const { newPct, allProgress, shouldNotify } = await db.transaction(async (trx) => {
      const existing = await trx("invite_product_progress")
        .where({ invite_id: invite.id, product_slug: productSlug })
        .forUpdate()
        .first();

      // Progress only ever moves forward — a stale/out-of-order request (e.g. from a
      // background tab) shouldn't regress what's already been recorded for THIS product.
      const priorPct = existing?.progress_percent ?? 0;
      const priorVideos = existing?.videos_watched ?? 0;
      if (pct < priorPct && videosWatched <= priorVideos) {
        return { newPct: priorPct, allProgress: null, shouldNotify: false };
      }
      const newPct = Math.max(pct, priorPct);

      const shouldNotify = newPct >= 40 && !existing?.admin_notified;

      const row = {
        progress_percent: newPct,
        progress_steps: JSON.stringify(steps),
        videos_watched: Math.max(videosWatched, priorVideos),
        videos_total: videosTotal || existing?.videos_total || 0,
        admin_notified: shouldNotify ? true : existing?.admin_notified || false,
        updated_at: new Date(),
      };

      if (existing) {
        await trx("invite_product_progress").where({ id: existing.id }).update(row);
      } else {
        await trx("invite_product_progress").insert({ invite_id: invite.id, product_slug: productSlug, ...row });
      }

      // Mirror a simple headline number onto the invite itself — the product with the
      // single highest progress — so anything still reading the flat columns (the
      // compact list view) keeps working without needing to join the detail table.
      const allProgress = await trx("invite_product_progress")
        .where({ invite_id: invite.id })
        .orderBy("progress_percent", "desc");
      const headline = allProgress[0];
      await trx("email_invites")
        .where({ id: invite.id })
        .update({
          progress_percent: headline.progress_percent,
          product_slug: headline.product_slug,
          progress_steps: headline.progress_steps,
          progress_updated_at: new Date(),
          videos_watched: headline.videos_watched,
          videos_total: headline.videos_total,
        });

      return { newPct, allProgress, shouldNotify };
    });

    if (!allProgress) {
      return res.json({ ok: true, progress_percent: newPct });
    }

    if (shouldNotify) {
      const adminEmail = resolveAdminEmail();
      sendAdminProgressNotification({
        adminEmail,
        userEmail: invite.email,
        productSlug,
        progressPercent: newPct,
        allProducts: allProgress.map((p) => ({ slug: p.product_slug, percent: p.progress_percent })),
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
    const pending = await db("invite_product_access_requests")
      .where({ invite_id: req.params.id, status: "pending" })
      .select("product_slug");
    res.json({
      allowed_product_slugs: parseAllowedProductSlugs(invite.allowed_product_slugs),
      pending_product_requests: pending.map((p) => p.product_slug),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch allowed products" });
  }
});

// Public — a customer asking for a product that's available but not in their
// invite's allowed_product_slugs. Distinct from the device-lock request-access
// flow above: that one is "same product, new device", this one is "different
// product entirely".
router.post("/api/invites/:id/request-product-access", async (req, res) => {
  try {
    const invite = await db("email_invites").where({ id: req.params.id }).first();
    if (!invite) return res.status(404).json({ message: "Not found" });

    const submittedEmail = String((req.body || {}).email || "").trim().toLowerCase();
    if (!submittedEmail || submittedEmail !== invite.email.trim().toLowerCase()) {
      return res.status(403).json({ message: "Email does not match this invite." });
    }

    const productSlug = String((req.body || {}).productSlug || "").trim();
    if (!productSlug) return res.status(400).json({ message: "productSlug is required" });

    const product = await db("products").where({ slug: productSlug }).first();
    if (!product) return res.status(404).json({ message: "Unknown product." });

    const existing = await db("invite_product_access_requests")
      .where({ invite_id: invite.id, product_slug: productSlug })
      .first();
    if (existing) {
      return res.json({ ok: true, status: existing.status });
    }

    await db("invite_product_access_requests").insert({
      invite_id: invite.id,
      product_slug: productSlug,
      status: "pending",
    });

    const adminEmail = resolveAdminEmail();
    sendAdminProductAccessRequest({ adminEmail, userEmail: invite.email, productSlug }).catch((e) => {
      console.error("[mailer] Failed to send product access request notification:", e.message);
    });

    res.json({ ok: true, status: "pending" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send request" });
  }
});

// Admin — grants the product by merging it into allowed_product_slugs (an empty
// list there means "all products", so approving is a no-op in that case — the
// customer already had access), resolves the request, and emails the customer.
router.post("/api/admin/email-invites/:id/product-access/:slug/approve", requireAdmin, async (req, res) => {
  try {
    const invite = await db("email_invites").where({ id: req.params.id }).first();
    if (!invite) return res.status(404).json({ message: "Not found" });

    const productSlug = req.params.slug;
    const current = parseAllowedProductSlugs(invite.allowed_product_slugs);
    if (current.length && !current.includes(productSlug)) {
      const next = [...current, productSlug];
      await db("email_invites")
        .where({ id: invite.id })
        .update({ allowed_product_slugs: JSON.stringify(next), updated_at: new Date() });
    }

    await db("invite_product_access_requests")
      .where({ invite_id: invite.id, product_slug: productSlug })
      .update({ status: "approved", resolved_at: new Date() });

    // Adding a product to allowed_product_slugs doesn't require new credentials —
    // the customer's original invite link still works. Rotating them here used to
    // silently break the link they already had.
    sendProductAccessApprovedEmail({ userEmail: invite.email, productSlug }).catch((e) => {
      console.error("[mailer] Failed to send product access approved email:", e.message);
    });

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to approve access" });
  }
});

// Public — "notify me when this launches" for a genuinely not-yet-built product
// (status "coming"). Unlike request-product-access above, there's nothing to
// approve later — it's a one-way lead-capture email, so it doesn't validate the
// email against an invite the way the access-gating endpoints do.
router.post("/api/notify-me", async (req, res) => {
  try {
    const email = String((req.body || {}).email || "").trim();
    const name = String((req.body || {}).name || "").trim() || "Someone";
    const productSlug = String((req.body || {}).productSlug || "").trim();
    if (!EMAIL_RE.test(email)) return res.status(400).json({ message: "A valid email is required" });
    if (!productSlug) return res.status(400).json({ message: "productSlug is required" });

    const product = await db("products").where({ slug: productSlug }).first();
    if (!product) return res.status(404).json({ message: "Unknown product." });

    // Remembered so that when this product later goes "available", everyone who
    // asked gets emailed automatically (see the products PUT handler in content.js)
    // — upsert so re-clicking Notify Me doesn't create duplicate rows/emails.
    const existingRequest = await db("product_notify_requests")
      .where({ product_slug: productSlug, email })
      .first();
    if (existingRequest) {
      await db("product_notify_requests")
        .where({ id: existingRequest.id })
        .update({ name, notified_at: null });
    } else {
      await db("product_notify_requests").insert({ product_slug: productSlug, email, name });
    }

    const adminEmail = resolveAdminEmail();
    sendNotifyMeRequest({ adminEmail, userEmail: email, userName: name, productSlug }).catch((e) => {
      console.error("[mailer] Failed to send notify-me request:", e.message);
    });

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send request" });
  }
});

// Public — the Book Workshop form, submitted before the customer is handed off
// to the external scheduler (Calendly/TidyCal). Neither supports a public API
// for pushing custom form data into a booking, so this is the record of what
// was actually asked for, independent of whether the external booking gets
// completed.
router.post("/api/invites/:id/workshop-request", async (req, res) => {
  try {
    const invite = await db("email_invites").where({ id: req.params.id }).first();
    if (!invite) return res.status(404).json({ message: "Not found" });

    const submittedEmail = String((req.body || {}).email || "").trim().toLowerCase();
    if (!submittedEmail || submittedEmail !== invite.email.trim().toLowerCase()) {
      return res.status(403).json({ message: "Email does not match this invite." });
    }

    const name = String((req.body || {}).name || "").trim() || invite.filled_name || "Someone";
    const productSlug = String((req.body || {}).productSlug || "").trim();
    if (!productSlug) return res.status(400).json({ message: "productSlug is required" });
    const interests = Array.isArray((req.body || {}).interests) ? (req.body || {}).interests : [];
    const notes = String((req.body || {}).notes || "").trim();

    await db("workshop_requests").insert({
      invite_id: invite.id,
      product_slug: productSlug,
      interests: JSON.stringify(interests),
      notes: notes || null,
    });

    const adminEmail = resolveAdminEmail();
    sendWorkshopRequestNotification({
      adminEmail,
      userEmail: invite.email,
      userName: name,
      productSlug,
      interests,
      notes,
    }).catch((e) => {
      console.error("[mailer] Failed to send workshop request notification:", e.message);
    });

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to submit request" });
  }
});

// Public, invite-scoped — called once the SecOps engagement fit assessment is
// completed. Stores the readable Q&A (the backend has no copy of the question
// bank, so the frontend sends question/answer text directly, see
// src/pages/experience/Assessment.jsx) and emails the admin a summary.
router.post("/api/invites/:id/assessment-result", async (req, res) => {
  try {
    const invite = await db("email_invites").where({ id: req.params.id }).first();
    if (!invite) return res.status(404).json({ message: "Not found" });

    const submittedEmail = String((req.body || {}).email || "").trim().toLowerCase();
    if (!submittedEmail || submittedEmail !== invite.email.trim().toLowerCase()) {
      return res.status(403).json({ message: "Email does not match this invite." });
    }

    const name = String((req.body || {}).name || "").trim() || invite.filled_name || "Someone";
    const productSlug = String((req.body || {}).productSlug || "").trim();
    if (!productSlug) return res.status(400).json({ message: "productSlug is required" });

    const score = Math.max(0, Math.round(Number((req.body || {}).score) || 0));
    const maxScore = Math.max(1, Math.round(Number((req.body || {}).maxScore) || 24));
    const tierId = String((req.body || {}).tierId || "").trim() || null;
    const tierName = String((req.body || {}).tierName || "").trim() || "Unknown";
    const answers = Array.isArray((req.body || {}).answers)
      ? (req.body || {}).answers
          .filter((a) => a && typeof a === "object")
          .map((a) => ({
            dim: String(a.dim || "").slice(0, 200),
            question: String(a.question || "").slice(0, 1000),
            answer: String(a.answer || "").slice(0, 1000),
            flag: a.flag ? String(a.flag).slice(0, 500) : null,
          }))
      : [];
    if (!answers.length) return res.status(400).json({ message: "answers is required" });

    const row = {
      score,
      tier_id: tierId,
      tier_name: tierName,
      answers: JSON.stringify(answers),
      updated_at: new Date(),
    };

    const existing = await db("invite_assessment_results")
      .where({ invite_id: invite.id, product_slug: productSlug })
      .first();
    if (existing) {
      await db("invite_assessment_results").where({ id: existing.id }).update(row);
    } else {
      await db("invite_assessment_results").insert({ invite_id: invite.id, product_slug: productSlug, ...row });
    }

    const adminEmail = resolveAdminEmail("assessment");
    sendAssessmentCompletedNotification({
      adminEmail,
      userEmail: invite.email,
      userName: name,
      productSlug,
      score,
      maxScore,
      tierName,
      answers,
    }).catch((e) => {
      console.error("[mailer] Failed to send assessment completed notification:", e.message);
    });

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to record assessment result" });
  }
});

// Public, invite-scoped — called when a customer clicks "Calculate" on the ROI
// section of the recommendation page (see src/pages/experience/Recommendation.jsx).
// The client already did the math (see the `roi` useMemo there); this just
// persists the inputs + results it landed on and emails the admin the full
// report — quiz answers (if any) plus the ROI breakdown, not just one or the
// other. Works even if the quiz itself was skipped (creates its own row).
router.post("/api/invites/:id/roi-result", async (req, res) => {
  try {
    const invite = await db("email_invites").where({ id: req.params.id }).first();
    if (!invite) return res.status(404).json({ message: "Not found" });

    const submittedEmail = String((req.body || {}).email || "").trim().toLowerCase();
    if (!submittedEmail || submittedEmail !== invite.email.trim().toLowerCase()) {
      return res.status(403).json({ message: "Email does not match this invite." });
    }

    const name = String((req.body || {}).name || "").trim() || invite.filled_name || "Someone";
    const productSlug = String((req.body || {}).productSlug || "").trim();
    if (!productSlug) return res.status(400).json({ message: "productSlug is required" });

    const config = (req.body || {}).config;
    const results = (req.body || {}).results;
    if (!config || typeof config !== "object" || !results || typeof results !== "object") {
      return res.status(400).json({ message: "config and results are required" });
    }

    const existing = await db("invite_assessment_results")
      .where({ invite_id: invite.id, product_slug: productSlug })
      .first();

    const row = {
      roi_config: JSON.stringify(config).slice(0, 20000),
      roi_results: JSON.stringify(results).slice(0, 20000),
      roi_updated_at: new Date(),
      updated_at: new Date(),
    };

    if (existing) {
      await db("invite_assessment_results").where({ id: existing.id }).update(row);
    } else {
      await db("invite_assessment_results").insert({ invite_id: invite.id, product_slug: productSlug, ...row });
    }

    const adminEmail = resolveAdminEmail("roi");
    sendRoiReportNotification({
      adminEmail,
      userEmail: invite.email,
      userName: name,
      productSlug,
      answers: existing?.answers ? JSON.parse(existing.answers) : [],
      config,
      results,
    }).catch((e) => {
      console.error("[mailer] Failed to send ROI report notification:", e.message);
    });

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to record ROI result" });
  }
});

// Public, invite-scoped — raised support ticket from help center
router.post("/api/invites/:id/ticket", async (req, res) => {
  try {
    const submittedEmail = String((req.body || {}).email || "").trim().toLowerCase();
    if (!submittedEmail) {
      return res.status(400).json({ message: "Email is required." });
    }

    let invite = null;
    if (req.params.id && req.params.id !== "null") {
      invite = await db("email_invites").where({ id: req.params.id }).first();
    }

    if (!invite) {
      // Fallback: look up by submitted email
      invite = await db("email_invites")
        .whereRaw("LOWER(email) = ?", [submittedEmail])
        .orderBy("created_at", "desc")
        .first();
    }

    if (!invite) {
      return res.status(404).json({ message: "No active invite found for this email." });
    }

    if (submittedEmail !== invite.email.trim().toLowerCase()) {
      return res.status(403).json({ message: "Email does not match this invite." });
    }

    const name = String((req.body || {}).name || "").trim() || invite.filled_name || "Someone";
    const subject = String((req.body || {}).subject || "").trim();
    const message = String((req.body || {}).message || "").trim();

    if (!subject || !message) {
      return res.status(400).json({ message: "Subject and Message are required." });
    }

    const adminEmail = resolveAdminEmail();
    sendSupportTicketEmails({
      adminEmail,
      clientEmail: invite.email,
      clientName: name,
      subject,
      message,
    }).catch((e) => {
      console.error("[mailer] Failed to send support ticket emails:", e.message);
    });

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to submit support ticket" });
  }
});

module.exports = router;
