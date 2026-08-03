const nodemailer = require("nodemailer");

let warned = false;
let transport = null;

function getTransport() {
  if (transport) return transport;

  if (!process.env.SMTP_HOST) {
    if (!warned) {
      console.warn(
        "[mailer] SMTP not configured — emails will be logged to the console instead of sent",
      );
      warned = true;
    }
    transport = {
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
    return transport;
  }

  transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  return transport;
}

function formatDuration(hours) {
  if (hours % 24 === 0 && hours >= 24) {
    const days = hours / 24;
    return `${days} day${days === 1 ? "" : "s"}`;
  }
  return `${hours} hour${hours === 1 ? "" : "s"}`;
}

async function sendInviteEmail({ to, loginUrl, securityCode, durationHours = 24, singleUse = true }) {
  const duration = formatDuration(durationHours);
  const usageNote = singleUse
    ? "can only be used once"
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

  const from = process.env.SMTP_FROM || "ToggleNow Experience Center <no-reply@togglenow.com>";
  return getTransport().sendMail({ from, to, subject, text, html });
}

async function sendAdminProgressNotification({ adminEmail, userEmail, productSlug, progressPercent }) {
  const subject = `User Progress Alert: 40% Completed (${productSlug.toUpperCase()})`;
  const text = `User ${userEmail} has reached ${progressPercent}% progress in the ${productSlug} experience.`;
  const html = `
  <div style="background:#f1f5f9;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#3b82f6;font-weight:600;">
        Experience Center Notification
      </p>
      <h1 style="margin:0 0 16px;font-size:20px;color:#0f172a;">User Progress Reached 40%+</h1>
      <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#334155;">
        <strong>User Email:</strong> ${userEmail}
      </p>
      <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#334155;">
        <strong>Product:</strong> ${productSlug.toUpperCase()}
      </p>
      <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#334155;">
        <strong>Current Progress:</strong> ${progressPercent}%
      </p>
      <hr style="border:0;border-top:1px solid #e2e8f0;margin:0 0 24px;" />
      <p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8;">
        This is an automated notification. You can view full engagement details in the Admin Panel.
      </p>
    </div>
  </div>`;

  const from = process.env.SMTP_FROM || "ToggleNow Experience Center <no-reply@togglenow.com>";
  return getTransport().sendMail({ from, to: adminEmail, subject, text, html });
}

module.exports = { getTransport, sendInviteEmail, sendAdminProgressNotification };
