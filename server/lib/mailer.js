const nodemailer = require("nodemailer");

let warned = false;
let transport = null;

// Every HTML email template below interpolates attacker-controllable strings
// (visitor-submitted name/notes/interests, magic-link emails) — without this,
// something like a fake "<a href=phish>Approve</a>" in a notes field renders
// as a live link/button in the admin's inbox.
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[ch]);
}

// Always ensure dotenv has read the latest file in server/ or root
const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env"), override: true });
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env"), override: true });

function getTransport() {
  // Re-read .env in case it was updated on disk without process restart
  require("dotenv").config({ path: path.join(__dirname, "..", ".env"), override: true });
  require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env"), override: true });

  if (!process.env.SMTP_HOST) {
    if (!warned) {
      console.warn(
        "[mailer] SMTP not configured — emails will be logged to the console instead of sent",
      );
      warned = true;
    }
    return {
      sendMail: async (message) => {
        console.log("[mailer] (fake send) ", {
          to: message.to,
          subject: message.subject,
          text: message.text,
          html: message.html,
        });
        return { messageId: "console-fake" };
      },
    };
  }

  const isGmail = process.env.SMTP_HOST === "smtp.gmail.com" || process.env.SMTP_SERVICE === "gmail";
  const user = (process.env.SMTP_USER || "").trim();
  const pass = (process.env.SMTP_PASS || "").trim().replace(/\s+/g, "");
  // Defaults to real cert validation — only skip it when a host is known to
  // intercept outbound SMTP (see server/README.md) and the operator opts in explicitly.
  const rejectUnauthorized = process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== "false";

  if (isGmail) {
    return nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // Use SSL on 465 to prevent hosting port 587 hijacking
      auth: { user, pass },
      tls: { rejectUnauthorized },
    });
  }

  const transportOptions = {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: user ? { user, pass } : undefined,
    tls: { rejectUnauthorized },
  };

  return nodemailer.createTransport(transportOptions);
}

// SMTP_FROM can already be a full "Name <email>" string (kept for back-compat) —
// only wrap it with SMTP_FROM_NAME when SMTP_FROM is a bare address.
function getFromHeader() {
  const raw = process.env.SMTP_FROM || "no-reply@togglenow.com";
  const name = process.env.SMTP_FROM_NAME;
  if (!name || raw.includes("<")) return raw;
  return `${name} <${raw}>`;
}

function formatDuration(hours) {
  if (hours % 24 === 0 && hours >= 24) {
    const days = hours / 24;
    return `${days} day${days === 1 ? "" : "s"}`;
  }
  return `${hours} hour${hours === 1 ? "" : "s"}`;
}

async function sendInviteEmail({ to, loginUrl, securityCode, durationHours = 24, singleUse = true, usageLimit = null }) {
  const duration = formatDuration(durationHours);
  const usageNote = singleUse
    ? "can only be used once"
    : usageLimit
      ? `can be used up to ${usageLimit} time${usageLimit === 1 ? "" : "s"} until then`
      : `can be used as many times as needed until then`;
  const subject = "Your ToggleNow Experience Center login link";
  const text = `Sign in to your ToggleNow Experience Center: ${loginUrl}\n\nYour security code: ${securityCode}\nYou'll need to enter this code on the sign-in page to continue.\n\nThis link and code expire in ${duration} and ${usageNote}.`;
  const html = `
  <div style="background:#f1f5f9;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;font-weight:600;">
        ToggleNow Experience Center
      </p>
      <h1 style="margin:0 0 16px;font-size:20px;color:#0f172a;">You're invited to sign in</h1>
      <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#334155;">
        Click the button below, then enter your security code to sign in to your personalized
        ToggleNow Experience Center.
      </p>
      <p style="text-align:center;margin:0 0 24px;">
        <a href="${loginUrl}" style="display:inline-block;background:#2054E3;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 28px;border-radius:10px;">
          Sign in
        </a>
      </p>
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.06em;text-transform:uppercase;color:#64748b;font-weight:600;text-align:center;">
        Your security code
      </p>
      <p style="margin:0 0 24px;font-size:28px;font-weight:700;letter-spacing:0.15em;color:#0f172a;text-align:center;font-family:monospace;">
        ${securityCode}
      </p>
      <p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8;">
        This link and code expire in ${duration} and ${usageNote}. If you didn't request this, you can ignore this email.
      </p>
    </div>
  </div>`;

  const from = getFromHeader();
  return getTransport().sendMail({ from, to, subject, text, html });
}

// `allProducts` — every product this invite has touched so far, e.g.
// [{ slug: "secops", percent: 65 }, { slug: "fftrust", percent: 20 }] — sent
// alongside the specific product that just crossed the 40% threshold, so the
// admin gets full credit for engagement across every product, not just the one
// that triggered this email.
async function sendAdminProgressNotification({ adminEmail, userEmail, productSlug, progressPercent, allProducts = [] }) {
  const subject = `User Progress Alert: 40% Completed (${productSlug.toUpperCase()})`;
  const otherProducts = allProducts.filter((p) => p.slug !== productSlug);

  const text = [
    `User ${userEmail} has reached ${progressPercent}% progress in the ${productSlug} experience.`,
    otherProducts.length
      ? `Progress across their other explored products: ${otherProducts
          .map((p) => `${p.slug} ${p.percent}%`)
          .join(", ")}.`
      : null,
  ]
    .filter(Boolean)
    .join(" ");

  const otherProductsHtml = otherProducts.length
    ? `
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.06em;text-transform:uppercase;color:#94a3b8;font-weight:600;">
        Also explored
      </p>
      <table style="width:100%;border-collapse:collapse;margin:0 0 24px;">
        ${otherProducts
          .map(
            (p) => `
          <tr>
            <td style="padding:6px 0;font-size:14px;color:#334155;text-transform:uppercase;">${escapeHtml(p.slug)}</td>
            <td style="padding:6px 0;font-size:14px;color:#0f172a;font-weight:600;text-align:right;">${p.percent}%</td>
          </tr>`,
          )
          .join("")}
      </table>`
    : "";

  const html = `
  <div style="background:#f1f5f9;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#3b82f6;font-weight:600;">
        Experience Center Notification
      </p>
      <h1 style="margin:0 0 16px;font-size:20px;color:#0f172a;">User Progress Reached 40%+</h1>
      <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#334155;">
        <strong>User Email:</strong> ${escapeHtml(userEmail)}
      </p>
      <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#334155;">
        <strong>Product:</strong> ${escapeHtml(productSlug.toUpperCase())}
      </p>
      <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#334155;">
        <strong>Current Progress:</strong> ${progressPercent}%
      </p>
      ${otherProductsHtml}
      <hr style="border:0;border-top:1px solid #e2e8f0;margin:0 0 24px;" />
      <p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8;">
        This is an automated notification. You can view full engagement details in the Admin Panel.
      </p>
    </div>
  </div>`;

  const from = getFromHeader();
  return getTransport().sendMail({ from, to: adminEmail, subject, text, html });
}

async function sendAdminProductAccessRequest({ adminEmail, userEmail, productSlug }) {
  const subject = `Product access requested: ${productSlug.toUpperCase()}`;
  const text = `${userEmail} has requested access to ${productSlug}, which isn't included in their current invite. Approve it from the invite's details page in the Admin Panel.`;
  const html = `
  <div style="background:#f1f5f9;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#3b82f6;font-weight:600;">
        Experience Center Notification
      </p>
      <h1 style="margin:0 0 16px;font-size:20px;color:#0f172a;">Product access requested</h1>
      <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#334155;">
        <strong>User Email:</strong> ${escapeHtml(userEmail)}
      </p>
      <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#334155;">
        <strong>Requested Product:</strong> ${escapeHtml(productSlug.toUpperCase())}
      </p>
      <hr style="border:0;border-top:1px solid #e2e8f0;margin:0 0 24px;" />
      <p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8;">
        Approve this from the invite's details page in the Admin Panel (Send Invite → the invite → Product access requests).
      </p>
    </div>
  </div>`;

  const from = getFromHeader();
  return getTransport().sendMail({ from, to: adminEmail, subject, text, html });
}

// `loginUrl`/`securityCode` are optional — only passed when the approval flow
// also rotated the invite's credentials (see the /product-access/:slug/approve
// route). Included so the customer doesn't have to dig up their original
// invite email to get back in; shown the same way the original invite was.
async function sendProductAccessApprovedEmail({ userEmail, productSlug, frontendUrl, loginUrl, securityCode }) {
  const productName = productSlug.toUpperCase();
  const link = frontendUrl || process.env.FRONTEND_URL || "http://localhost:5173";
  const subject = `Access granted: you now have access to ${productName}`;
  const text = loginUrl
    ? `Access was granted for you — your request for access to ${productName} has been approved.\n\nSign in: ${loginUrl}\nYour security code: ${securityCode}`
    : `Your request for access to ${productName} has been approved. Go back to your ToggleNow Experience Center session (${link}/experience) to explore it.`;
  const html = `
  <div style="background:#f1f5f9;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#3b82f6;font-weight:600;">
        ToggleNow Experience Center
      </p>
      <h1 style="margin:0 0 16px;font-size:20px;color:#0f172a;">Access granted: ${productName}</h1>
      <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#334155;">
        Access was granted for you — your request for access to <strong>${productName}</strong> has
        been approved.
      </p>
      ${
        loginUrl
          ? `
      <p style="text-align:center;margin:0 0 24px;">
        <a href="${loginUrl}" style="display:inline-block;background:#2054E3;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 28px;border-radius:10px;">
          Sign in
        </a>
      </p>
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.06em;text-transform:uppercase;color:#64748b;font-weight:600;text-align:center;">
        Your security code
      </p>
      <p style="margin:0 0 24px;font-size:28px;font-weight:700;letter-spacing:0.15em;color:#0f172a;text-align:center;font-family:monospace;">
        ${escapeHtml(securityCode)}
      </p>`
          : `
      <a href="${link}/experience" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 20px;border-radius:10px;">
        Open Experience Center
      </a>`
      }
    </div>
  </div>`;

  const from = getFromHeader();
  return getTransport().sendMail({ from, to: userEmail, subject, text, html });
}

// Device-lock case: the customer's invite link only works from the device that
// first opened it — this fires when someone else (or the same person on a new
// device) hits that wall and asks to be let in.
const REASON_COPY = {
  expired: { subject: "Access requested for expired invite", explanation: "Their invite link had already expired.", text: "had expired" },
  revoked: { subject: "Access requested for revoked invite", explanation: "Their invite link had been revoked.", text: "had been revoked" },
  used: { subject: "Access requested for a used-up invite", explanation: "Their invite link hit its usage limit.", text: "reached its usage limit" },
  device: { subject: "Device access requested", explanation: "Their invite link was opened on a different device than the one it's locked to.", text: "was opened from a different device than the one it's locked to" },
};

async function sendAdminDeviceAccessRequest({ adminEmail, userEmail, reason = "device" }) {
  const copy = REASON_COPY[reason] || REASON_COPY.device;
  const subject = copy.subject;
  const explanation = `${copy.explanation} Grant access to re-enable it.`;
  const text = `${userEmail}'s invite link ${copy.text}. They've asked for it to be re-enabled — approve it from the invite's details page in the Admin Panel.`;
  const html = `
  <div style="background:#f1f5f9;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#3b82f6;font-weight:600;">
        Experience Center Notification
      </p>
      <h1 style="margin:0 0 16px;font-size:20px;color:#0f172a;">${subject}</h1>
      <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#334155;">
        <strong>User Email:</strong> ${escapeHtml(userEmail)}
      </p>
      <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#334155;">
        ${explanation}
      </p>
      <hr style="border:0;border-top:1px solid #e2e8f0;margin:0 0 24px;" />
      <p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8;">
        Approve this from the invite's details page in the Admin Panel (Send Invite → the invite →
        Grant Access), or from the new Grant Access tab.
      </p>
    </div>
  </div>`;

  const from = getFromHeader();
  return getTransport().sendMail({ from, to: adminEmail, subject, text, html });
}

// `loginUrl`/`securityCode` are optional — the invite's original credentials
// still work once the device lock is cleared, so grant-access no longer
// rotates them. Only pass these when a flow actually did rotate credentials.
async function sendDeviceAccessApprovedEmail({ userEmail, loginUrl, securityCode }) {
  const subject = "Access granted — you can sign back in now";
  const text = loginUrl
    ? `Access was granted for you. Sign in: ${loginUrl}\nYour security code: ${securityCode}`
    : "Access was granted for you. Go back to your original invite link and sign in as before.";
  const html = `
  <div style="background:#f1f5f9;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#3b82f6;font-weight:600;">
        ToggleNow Experience Center
      </p>
      <h1 style="margin:0 0 16px;font-size:20px;color:#0f172a;">Access granted</h1>
      <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#334155;">
        ${
          loginUrl
            ? "Access was granted for you. Use the button below and the security code to sign back in from this device."
            : "Access was granted for you. Your original invite link and security code still work — go back to the link from your first invite email to sign back in from this device."
        }
      </p>
      ${
        loginUrl
          ? `
      <p style="text-align:center;margin:0 0 24px;">
        <a href="${loginUrl}" style="display:inline-block;background:#2054E3;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 28px;border-radius:10px;">
          Sign in
        </a>
      </p>
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.06em;text-transform:uppercase;color:#64748b;font-weight:600;text-align:center;">
        Your security code
      </p>
      <p style="margin:0;font-size:28px;font-weight:700;letter-spacing:0.15em;color:#0f172a;text-align:center;font-family:monospace;">
        ${escapeHtml(securityCode)}
      </p>`
          : ""
      }
    </div>
  </div>`;

  const from = getFromHeader();
  return getTransport().sendMail({ from, to: userEmail, subject, text, html });
}

// "Notify me" for a genuinely not-yet-built product (status "coming") — a lead
// capture, not an access grant, so there's nothing for the admin to approve
// later; this is a one-way heads-up email only.
async function sendNotifyMeRequest({ adminEmail, userEmail, userName, productSlug }) {
  const subject = `Notify-me request: ${productSlug.toUpperCase()}`;
  const text = `${userName} (${userEmail}) asked to be notified when ${productSlug} launches.`;
  const html = `
  <div style="background:#f1f5f9;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#3b82f6;font-weight:600;">
        Experience Center Notification
      </p>
      <h1 style="margin:0 0 16px;font-size:20px;color:#0f172a;">Notify-me request</h1>
      <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#334155;">
        <strong>${escapeHtml(userName)}</strong> (${escapeHtml(userEmail)}) wants to be notified when
        <strong>${escapeHtml(productSlug.toUpperCase())}</strong> launches.
      </p>
    </div>
  </div>`;

  const from = getFromHeader();
  return getTransport().sendMail({ from, to: adminEmail, subject, text, html });
}

// Fires once, when an admin flips a product's status from "coming" to
// "available" — to everyone who clicked Notify Me on it while it was still
// coming soon. Tells them to go back to their invite and request access if it
// doesn't show up as available for them automatically (their invite may still
// be scoped to other products).
async function sendProductNowAvailableEmail({ userEmail, userName, productSlug, frontendUrl }) {
  const productName = productSlug.toUpperCase();
  const link = frontendUrl || process.env.FRONTEND_URL || "http://localhost:5173";
  const subject = `${productName} is now available`;
  const text = `Good news, ${userName} — ${productName} just launched. Go back to your ToggleNow Experience Center session (${link}/experience) to explore it. If it doesn't show up as available yet, use "Request Access" on its card.`;
  const html = `
  <div style="background:#f1f5f9;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#3b82f6;font-weight:600;">
        ToggleNow Experience Center
      </p>
      <h1 style="margin:0 0 16px;font-size:20px;color:#0f172a;">${escapeHtml(productName)} is now available</h1>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#334155;">
        Good news, ${escapeHtml(userName)} — <strong>${escapeHtml(productName)}</strong> just launched. Head back to your
        Experience Center session to explore it.
      </p>
      <a href="${link}/experience" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 20px;border-radius:10px;">
        Open Experience Center
      </a>
      <p style="margin:20px 0 0;font-size:12px;line-height:1.6;color:#94a3b8;">
        If it doesn't show up as available right away, use "Request Access" on its card and we'll unlock
        it for you.
      </p>
    </div>
  </div>`;

  const from = getFromHeader();
  return getTransport().sendMail({ from, to: userEmail, subject, text, html });
}

async function sendWorkshopRequestNotification({ adminEmail, userEmail, userName, productSlug, interests, notes }) {
  const subject = `Workshop request: ${userName} — ${productSlug.toUpperCase()}`;
  const interestsLine = interests?.length ? interests.join(", ") : "Not specified";
  const text = `${userName} (${userEmail}) filled out the Book Workshop form for ${productSlug}.\nInterested in: ${interestsLine}\nFocus notes: ${notes || "—"}\n\nThey're being sent to the scheduler now — this is a heads-up in case they don't complete the booking.`;
  const html = `
  <div style="background:#f1f5f9;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#3b82f6;font-weight:600;">
        Experience Center Notification
      </p>
      <h1 style="margin:0 0 16px;font-size:20px;color:#0f172a;">Workshop request</h1>
      <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#334155;">
        <strong>${escapeHtml(userName)}</strong> (${escapeHtml(userEmail)}) filled out the Book Workshop form for
        <strong>${escapeHtml(productSlug.toUpperCase())}</strong>.
      </p>
      <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#334155;">
        <strong>Interested in:</strong> ${escapeHtml(interestsLine)}
      </p>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#334155;">
        <strong>Focus notes:</strong> ${escapeHtml(notes || "—")}
      </p>
      <hr style="border:0;border-top:1px solid #e2e8f0;margin:0 0 20px;" />
      <p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8;">
        They're being sent to the scheduler now — this is a heads-up in case they don't finish booking a
        slot.
      </p>
    </div>
  </div>`;

  const from = getFromHeader();
  return getTransport().sendMail({ from, to: adminEmail, subject, text, html });
}

// `answers` is the array of { dim, question, answer, flag } built client-side
// (see src/pages/experience/Assessment.jsx) — the backend has no copy of the
// question bank, so the frontend sends the readable text directly rather than
// just option indexes.
async function sendAssessmentCompletedNotification({
  adminEmail,
  userEmail,
  userName,
  productSlug,
  score,
  maxScore,
  tierName,
  answers,
}) {
  const subject = `Assessment completed: ${userName} — ${productSlug.toUpperCase()} (${tierName})`;
  const answersText = answers
    .map((a, i) => `${i + 1}. [${a.dim}] ${a.question}\n   → ${a.answer}`)
    .join("\n\n");
  const text = `${userName} (${userEmail}) completed the ${productSlug.toUpperCase()} engagement fit assessment.\nScore: ${score} / ${maxScore} — recommended: ${tierName}\n\n${answersText}`;
  const answersHtml = answers
    .map(
      (a, i) => `
      <div style="padding:12px 0;${i > 0 ? "border-top:1px solid #e2e8f0;" : ""}">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:#3b82f6;">
          ${escapeHtml(a.dim)}
        </p>
        <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#0f172a;">${escapeHtml(a.question)}</p>
        <p style="margin:0;font-size:13px;color:#334155;">→ ${escapeHtml(a.answer)}</p>
      </div>`,
    )
    .join("");
  const html = `
  <div style="background:#f1f5f9;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#3b82f6;font-weight:600;">
        Experience Center Notification
      </p>
      <h1 style="margin:0 0 16px;font-size:20px;color:#0f172a;">Assessment completed</h1>
      <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#334155;">
        <strong>${escapeHtml(userName)}</strong> (${escapeHtml(userEmail)}) completed the
        <strong>${escapeHtml(productSlug.toUpperCase())}</strong> engagement fit assessment.
      </p>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#334155;">
        <strong>Score:</strong> ${score} / ${maxScore} — <strong>Recommended:</strong> ${escapeHtml(tierName)}
      </p>
      <hr style="border:0;border-top:1px solid #e2e8f0;margin:0 0 12px;" />
      ${answersHtml}
    </div>
  </div>`;

  const from = getFromHeader();
  return getTransport().sendMail({ from, to: adminEmail, subject, text, html });
}

const CURRENCY_SYMBOLS = { USD: "$", EUR: "€", GBP: "£", INR: "₹" };
function formatMoney(amount, currencyCode) {
  const symbol = CURRENCY_SYMBOLS[currencyCode] || "$";
  const rounded = Math.round(Number(amount) || 0);
  return `${symbol}${rounded.toLocaleString(currencyCode === "INR" ? "en-IN" : "en-US")}`;
}

// Sent when a customer clicks "Calculate" on the recommendation page (client
// already did the math — see the `roi` useMemo in
// src/pages/experience/Recommendation.jsx). This is the FULL report: quiz
// Q&A, the recommended model writeup, exposure flags, and the complete ROI
// breakdown — everything shown on that page — in one email, not split across
// several partial ones.
async function sendRoiReportNotification({
  adminEmail,
  userEmail,
  userName,
  productSlug,
  answers,
  config,
  results,
}) {
  const currency = config.currency || "USD";
  const tier = results.tier || null;
  const exposureFlags = results.exposureFlags || [];
  const tierName = tier?.tag || tier?.name || null;

  const subject = `Full report: ${userName} — ${productSlug.toUpperCase()}${tierName ? ` (${tierName})` : ""}`;

  const answersText = answers?.length
    ? answers.map((a, i) => `${i + 1}. [${a.dim}] ${a.question}\n   → ${a.answer}`).join("\n\n")
    : "(Assessment quiz not completed)";

  const exposureText = exposureFlags.length
    ? exposureFlags.map((f) => `- [${f.dim}] ${f.text}`).join("\n")
    : "None identified.";

  const tierText = tier
    ? `Recommended model: ${tier.name} — ${tier.tag}
${tier.subtitle}

${tier.description}

Why this fits: ${tier.whyFits}

Included in this model:
${(tier.features || []).map((f) => `- ${f}`).join("\n")}

Ideal for: ${tier.recommendedFor}`
    : "(No recommendation on file — quiz not completed)";

  const text = `${userName} (${userEmail}) generated a full report for ${productSlug.toUpperCase()}.

${results.score != null ? `Readiness score: ${results.score} / ${results.maxScore}\n` : ""}
${tierText}

Exposure flags identified (${exposureFlags.length}):
${exposureText}

Labor & cost assumptions:
- Currency: ${currency}
- Fully loaded cost per FTE / year: ${formatMoney(config.costPerFte, currency)}
- Productive hours / FTE / month: ${config.productiveHoursMonth}
- Derived cost per hour: ${formatMoney(results.hourlyRate, currency)}

ROI results:
- Total monthly tickets: ${results.totalTickets}
- Manual effort: ${Math.round(results.totalMonthlyManualHours)}h/mo — With platform: ${Math.round(results.totalMonthlySecOpsHours)}h/mo
- FTEs released: ${Number(results.ftesReleased).toFixed(2)}
- Monthly savings: ${formatMoney(results.monthlySavings, currency)}
- Estimated annual savings: ${formatMoney(results.annualSavings, currency)}
- Overall effort reduction: ${results.overallPctReduction}%
- Manual cost / year: ${formatMoney(results.annualCostManual, currency)} — With platform: ${formatMoney(results.annualCostSecOps, currency)}

Task breakdown:
${(config.tasks || [])
  .map((t) => `- ${t.name}: ${t.ticketsPerMonth}/mo, ${t.minManual}min manual → ${t.minSecOps}min via platform`)
  .join("\n")}

Assessment answers:
${answersText}`;

  const taskRowsHtml = (config.tasks || [])
    .map(
      (t) => `
      <tr>
        <td style="padding:6px 8px;font-size:12px;color:#0f172a;border-bottom:1px solid #e2e8f0;">${escapeHtml(t.name)}</td>
        <td style="padding:6px 8px;font-size:12px;color:#334155;text-align:right;border-bottom:1px solid #e2e8f0;">${t.ticketsPerMonth}</td>
        <td style="padding:6px 8px;font-size:12px;color:#334155;text-align:right;border-bottom:1px solid #e2e8f0;">${t.minManual}m</td>
        <td style="padding:6px 8px;font-size:12px;color:#334155;text-align:right;border-bottom:1px solid #e2e8f0;">${t.minSecOps}m</td>
      </tr>`,
    )
    .join("");

  const answersHtml = answers?.length
    ? answers
        .map(
          (a, i) => `
          <div style="padding:10px 0;${i > 0 ? "border-top:1px solid #e2e8f0;" : ""}">
            <p style="margin:0 0 3px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:#3b82f6;">${escapeHtml(a.dim)}</p>
            <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#0f172a;">${escapeHtml(a.question)}</p>
            <p style="margin:0;font-size:12px;color:#334155;">→ ${escapeHtml(a.answer)}</p>
          </div>`,
        )
        .join("")
    : `<p style="margin:0;font-size:12px;color:#94a3b8;">Assessment quiz not completed.</p>`;

  const exposureHtml = exposureFlags.length
    ? exposureFlags
        .map(
          (f) => `
          <div style="padding:8px 10px;background:#fff4f2;border:1px solid #fecaca;border-radius:8px;margin-bottom:6px;">
            <p style="margin:0;font-size:10px;font-weight:700;color:#b91c1c;text-transform:uppercase;">${escapeHtml(f.dim)}</p>
            <p style="margin:2px 0 0;font-size:12px;color:#334155;">${escapeHtml(f.text)}</p>
          </div>`,
        )
        .join("")
    : `<p style="margin:0;font-size:12px;color:#0e9f8e;">No zero-maturity gaps identified.</p>`;

  const tierHtml = tier
    ? `
      <div style="margin:16px 0;padding:16px;background:#f8fafc;border-radius:12px;">
        <p style="margin:0 0 4px;font-size:10px;font-weight:700;text-transform:uppercase;color:#3b82f6;">${escapeHtml(tier.name)} · ${escapeHtml(tier.tag)}</p>
        <p style="margin:0 0 8px;font-size:16px;font-weight:800;color:#0f172a;">${escapeHtml(tier.subtitle)}</p>
        <p style="margin:0 0 10px;font-size:13px;line-height:1.6;color:#334155;">${escapeHtml(tier.description)}</p>
        <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#334155;"><strong>Why this fits:</strong> ${escapeHtml(tier.whyFits)}</p>
        <p style="margin:0 0 6px;font-size:11px;font-weight:700;text-transform:uppercase;color:#64748b;">Included in this model</p>
        <ul style="margin:0 0 10px;padding-left:18px;">
          ${(tier.features || []).map((f) => `<li style="font-size:12px;color:#334155;margin-bottom:2px;">${escapeHtml(f)}</li>`).join("")}
        </ul>
        <p style="margin:0;font-size:12px;color:#64748b;"><strong>Ideal for:</strong> ${escapeHtml(tier.recommendedFor)}</p>
      </div>`
    : `<p style="margin:16px 0;font-size:12px;color:#94a3b8;">No recommendation on file — quiz not completed.</p>`;

  const html = `
  <div style="background:#f1f5f9;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#3b82f6;font-weight:600;">
        Experience Center Notification
      </p>
      <h1 style="margin:0 0 4px;font-size:20px;color:#0f172a;">Full report generated</h1>
      <p style="margin:0 0 4px;font-size:14px;line-height:1.6;color:#334155;">
        <strong>${escapeHtml(userName)}</strong> (${escapeHtml(userEmail)}) — <strong>${escapeHtml(productSlug.toUpperCase())}</strong>
        ${results.score != null ? ` · Readiness score <strong>${results.score} / ${results.maxScore}</strong>` : ""}
      </p>

      <p style="margin:16px 0 6px;font-size:12px;font-weight:700;text-transform:uppercase;color:#64748b;">Recommended model</p>
      ${tierHtml}

      <p style="margin:16px 0 6px;font-size:12px;font-weight:700;text-transform:uppercase;color:#64748b;">Exposure flags (${exposureFlags.length})</p>
      <div style="margin-bottom:16px;">${exposureHtml}</div>

      <div style="margin:16px 0;padding:16px;background:#f8fafc;border-radius:12px;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;color:#64748b;">Estimated annual saving</p>
        <p style="margin:0;font-size:28px;font-weight:800;color:#2563eb;">${formatMoney(results.annualSavings, currency)}</p>
        <p style="margin:4px 0 0;font-size:12px;color:#0e9f8e;font-weight:600;">
          ${Number(results.ftesReleased).toFixed(1)} FTE released · ${Math.round(results.monthlyHoursSaved)}h removed / month ·
          ${results.overallPctReduction}% effort reduction
        </p>
      </div>

      <p style="margin:0 0 8px;font-size:12px;font-weight:700;text-transform:uppercase;color:#64748b;">Labor & cost assumptions</p>
      <p style="margin:0 0 16px;font-size:13px;line-height:1.6;color:#334155;">
        Currency: <strong>${currency}</strong> · Cost per FTE/yr: <strong>${formatMoney(config.costPerFte, currency)}</strong> ·
        Productive hours/mo: <strong>${config.productiveHoursMonth}</strong> · Cost/hr: <strong>${formatMoney(results.hourlyRate, currency)}</strong>
      </p>

      <p style="margin:0 0 8px;font-size:12px;font-weight:700;text-transform:uppercase;color:#64748b;">Manual vs. platform (annual)</p>
      <p style="margin:0 0 16px;font-size:13px;line-height:1.6;color:#334155;">
        Manual: <strong>${formatMoney(results.annualCostManual, currency)}</strong> ·
        With platform: <strong>${formatMoney(results.annualCostSecOps, currency)}</strong> ·
        Saved: <strong style="color:#0e9f8e;">${formatMoney(results.annualSavings, currency)}</strong>
      </p>

      <p style="margin:0 0 8px;font-size:12px;font-weight:700;text-transform:uppercase;color:#64748b;">Task breakdown</p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
        <thead>
          <tr>
            <th style="text-align:left;padding:6px 8px;font-size:10px;color:#64748b;text-transform:uppercase;">Task</th>
            <th style="text-align:right;padding:6px 8px;font-size:10px;color:#64748b;text-transform:uppercase;">Tickets/mo</th>
            <th style="text-align:right;padding:6px 8px;font-size:10px;color:#64748b;text-transform:uppercase;">Manual</th>
            <th style="text-align:right;padding:6px 8px;font-size:10px;color:#64748b;text-transform:uppercase;">Platform</th>
          </tr>
        </thead>
        <tbody>${taskRowsHtml}</tbody>
      </table>

      <hr style="border:0;border-top:1px solid #e2e8f0;margin:0 0 12px;" />
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;text-transform:uppercase;color:#64748b;">Assessment answers</p>
      ${answersHtml}
    </div>
  </div>`;

  const from = getFromHeader();
  return getTransport().sendMail({ from, to: adminEmail, subject, text, html });
}

async function sendSupportTicketEmails({ adminEmail, clientEmail, clientName, subject: ticketSubject, message }) {
  const from = getFromHeader();
  
  // 1. Email to Admin
  const adminSubject = `New Support Ticket: ${ticketSubject}`;
  const adminText = `A new support ticket has been raised by ${clientName} (${clientEmail}).\n\nSubject: ${ticketSubject}\nMessage: ${message}`;
  const adminHtml = `
  <div style="background:#f1f5f9;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#3b82f6;font-weight:600;">
        Experience Center Notification
      </p>
      <h1 style="margin:0 0 16px;font-size:20px;color:#0f172a;">New Support Ticket</h1>
      <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#334155;">
        <strong>Client Name:</strong> ${escapeHtml(clientName)}
      </p>
      <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#334155;">
        <strong>Client Email:</strong> ${escapeHtml(clientEmail)}
      </p>
      <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#334155;">
        <strong>Subject:</strong> ${escapeHtml(ticketSubject)}
      </p>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#334155;">
        <strong>Message:</strong> ${escapeHtml(message)}
      </p>
    </div>
  </div>`;
  
  // 2. Email to Client/User
  const clientSubject = `We have received your request: ${ticketSubject}`;
  const clientText = `Hello ${clientName},\n\nThank you for reaching out to us. We have received your support ticket regarding "${ticketSubject}" and will be responding to you shortly.\n\nBest regards,\nThe ToggleNow Team`;
  const clientHtml = `
  <div style="background:#f1f5f9;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#2054E3;font-weight:600;">
        ToggleNow Support
      </p>
      <h1 style="margin:0 0 16px;font-size:20px;color:#0f172a;">Ticket Confirmation</h1>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#334155;">
        Hello ${escapeHtml(clientName)},
      </p>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#334155;">
        Thank you for contacting us. We have successfully received your support ticket regarding <strong>"${escapeHtml(ticketSubject)}"</strong>. Our team is reviewing your query and we will be responding to you shortly.
      </p>
      <hr style="border:0;border-top:1px solid #e2e8f0;margin:0 0 20px;" />
      <p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8;">
        Best regards,<br/>The ToggleNow Team
      </p>
    </div>
  </div>`;

  try {
    await getTransport().sendMail({ from, to: adminEmail, subject: adminSubject, text: adminText, html: adminHtml });
  } catch (err) {
    console.error("[mailer] Failed to send support ticket email to admin:", err.message);
  }

  try {
    await getTransport().sendMail({ from, to: clientEmail, subject: clientSubject, text: clientText, html: clientHtml });
  } catch (err) {
    console.error("[mailer] Failed to send support ticket email to client:", err.message);
  }
}

module.exports = {
  getTransport,
  sendInviteEmail,
  sendAdminProgressNotification,
  sendAdminProductAccessRequest,
  sendProductAccessApprovedEmail,
  sendAdminDeviceAccessRequest,
  sendDeviceAccessApprovedEmail,
  sendNotifyMeRequest,
  sendProductNowAvailableEmail,
  sendWorkshopRequestNotification,
  sendAssessmentCompletedNotification,
  sendRoiReportNotification,
  sendSupportTicketEmails,
};
