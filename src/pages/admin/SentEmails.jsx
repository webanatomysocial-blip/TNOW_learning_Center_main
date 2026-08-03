import { useEffect, useRef, useState } from "react";
import { Eye, MoreVertical, RotateCcw, Send, Trash2, X, XCircle } from "lucide-react";
import { useApiGet } from "@/lib/use-api";
import { apiSend } from "@/lib/api";
import { useAdminStore } from "@/lib/admin-store";
import { useDocumentHead } from "@/lib/use-document-head";

export const STATUS_COLORS = {
  pending: "var(--slate-500)",
  active: "var(--success-green)",
  used: "var(--primary-blue)",
  expired: "var(--error-red)",
  revoked: "var(--error-red)",
};

// Matches the step ids in src/lib/experience-store.js's STEP_DEFS.
const STEP_LABELS = {
  welcome: "Welcome",
  why: "Why",
  tour: "Product Tour",
  stories: "Customer Stories",
  ai: "AI Expert",
  book: "Book Workshop",
};

export function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] || "var(--slate-500)";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: "0.75rem",
        fontWeight: 600,
        textTransform: "capitalize",
        color,
        background: `${color}1a`,
        border: `1px solid ${color}40`,
      }}
    >
      {status === "active" && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: color,
            animation: "pulse-dot 1.4s ease-in-out infinite",
          }}
        />
      )}
      {status}
    </span>
  );
}

export function ProgressCell({ pct }) {
  const value = pct || 0;
  const color = value >= 100 ? "var(--success-green)" : "var(--primary-blue)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 90 }}>
      <div
        style={{
          flex: 1,
          height: 6,
          borderRadius: 999,
          background: "var(--slate-100)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${value}%`,
            height: "100%",
            borderRadius: 999,
            background: color,
            transition: "width 0.3s ease",
          }}
        />
      </div>
      <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--slate-600)", minWidth: 30 }}>
        {value}%
      </span>
    </div>
  );
}

export function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

const DURATION_OPTIONS = [
  { label: "1 hour", hours: 1 },
  { label: "6 hours", hours: 6 },
  { label: "24 hours", hours: 24 },
  { label: "3 days", hours: 72 },
  { label: "7 days", hours: 168 },
  { label: "30 days", hours: 720 },
];

export function SentEmailsPage() {
  useDocumentHead({ meta: [{ title: "Sent Emails — Admin" }] });
  const token = useAdminStore((s) => s.token);
  const { data, isLoading, isError, refetch } = useApiGet("/api/admin/email-invites", { token });
  const invites = data ?? [];
  const { data: productsData } = useApiGet("/api/products");
  const products = productsData ?? [];

  const [emails, setEmails] = useState("");
  const [expiresInHours, setExpiresInHours] = useState(24);
  const [deviceLock, setDeviceLock] = useState(true);
  const [singleUse, setSingleUse] = useState(true);
  const [productSlugs, setProductSlugs] = useState([]);
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState("");
  const [successInfo, setSuccessInfo] = useState(null); // { created: [...], invalid: [...] }
  const [copiedId, setCopiedId] = useState(null);
  const [detailsInvite, setDetailsInvite] = useState(null);
  const [menuFor, setMenuFor] = useState(null); // invite.id of the row whose action menu is open
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuFor) return;
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuFor(null);
      }
    }
    function handleKeyDown(e) {
      if (e.key === "Escape") setMenuFor(null);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuFor]);

  function toggleMenu(invite, e) {
    if (menuFor === invite.id) {
      setMenuFor(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const MENU_HEIGHT = 4 * 38 + 12; // 4 items + vertical padding, matches .profile-dropdown-menu
    const spaceBelow = window.innerHeight - rect.bottom;
    const top =
      spaceBelow >= MENU_HEIGHT + 6
        ? rect.bottom + 6
        : Math.max(8, rect.top - MENU_HEIGHT - 6);
    const left = Math.max(8, Math.min(rect.right - 180, window.innerWidth - 188));
    setMenuPos({ top, left });
    setMenuFor(invite.id);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!emails.trim()) return;
    setSending(true);
    setFormError("");
    setSuccessInfo(null);
    try {
      const result = await apiSend(
        "/api/admin/email-invites",
        "POST",
        { emails, expiresInHours, deviceLock, singleUse, productSlugs },
        token,
      );
      setSuccessInfo(result);
      setEmails("");
      setProductSlugs([]);
      refetch();
    } catch (err) {
      setFormError(err.message || "Failed to send invite(s).");
    } finally {
      setSending(false);
    }
  }

  function toggleProduct(slug) {
    setProductSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  }

  function copyLink(id, url) {
    navigator.clipboard?.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  async function handleResend(invite) {
    try {
      await apiSend(`/api/admin/email-invites/${invite.id}/resend`, "POST", undefined, token);
      refetch();
    } catch (err) {
      window.alert(err.message || "Failed to resend invite.");
    }
  }

  async function handleRevoke(invite) {
    if (!window.confirm(`Revoke the invite for "${invite.email}"? The link stops working, but it stays in this list.`)) return;
    try {
      await apiSend(`/api/admin/email-invites/${invite.id}`, "DELETE", undefined, token);
      refetch();
    } catch (err) {
      window.alert(err.message || "Failed to revoke invite.");
    }
  }

  async function handleDelete(invite) {
    if (!window.confirm(`Permanently delete the invite for "${invite.email}"? This can't be undone.`)) return;
    try {
      await apiSend(`/api/admin/email-invites/${invite.id}/permanent`, "DELETE", undefined, token);
      refetch();
    } catch (err) {
      window.alert(err.message || "Failed to delete invite.");
    }
  }

  return (
    <div className="admin-page-wrapper">
      <div className="admin-header-actions">
        <h1>Sent Emails</h1>
      </div>

      <div className="admin-card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--slate-800)", marginBottom: 12 }}>
          Send a magic login link
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="invite-emails">Email addresses</label>
            <textarea
              id="invite-emails"
              className="form-control"
              required
              rows={2}
              placeholder="name@company.com, another@company.com"
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
            />
            <p style={{ color: "var(--slate-500)", fontSize: "0.78rem", marginTop: 4 }}>
              Separate multiple addresses with commas — each gets its own link.
            </p>
          </div>

          <div className="form-group">
            <label>Products (optional)</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {products.map((p) => (
                <label
                  key={p.slug}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "var(--slate-700)",
                    border: "1px solid var(--slate-200, #e2e8f0)",
                    borderRadius: 8,
                    padding: "6px 10px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={productSlugs.includes(p.slug)}
                    onChange={() => toggleProduct(p.slug)}
                  />
                  {p.name}
                </label>
              ))}
            </div>
            <p style={{ color: "var(--slate-500)", fontSize: "0.78rem", marginTop: 4 }}>
              Select one or more to restrict this invite to those products. Leave all unchecked to
              show every product.
            </p>
          </div>

          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="invite-duration">Link stays active for</label>
              <select
                id="invite-duration"
                className="form-control"
                value={expiresInHours}
                onChange={(e) => setExpiresInHours(Number(e.target.value))}
              >
                {DURATION_OPTIONS.map((opt) => (
                  <option key={opt.hours} value={opt.hours}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="invite-usage">Link can be opened</label>
              <select
                id="invite-usage"
                className="form-control"
                value={singleUse ? "single" : "multiple"}
                onChange={(e) => setSingleUse(e.target.value === "single")}
              >
                <option value="single">A single time</option>
                <option value="multiple">Multiple times (until it expires)</option>
              </select>
            </div>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--slate-700)",
                marginBottom: 18,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={deviceLock}
                onChange={(e) => setDeviceLock(e.target.checked)}
              />
              Restrict to the first device that opens it
            </label>

            <button
              className="btn-primary"
              type="submit"
              disabled={sending || !emails.trim()}
              style={{ marginBottom: 18 }}
            >
              {sending ? "Sending…" : (<><Send /> Send Invite</>)}
            </button>
          </div>

          <p style={{ color: "var(--slate-500)", fontSize: "0.78rem" }}>
            {singleUse
              ? "This link stops working the moment it's used once."
              : "This link stays reusable until it expires."}{" "}
            {deviceLock
              ? "Once opened, it can only be completed from that same browser."
              : "Any browser can complete it."}
          </p>
        </form>

        {formError && (
          <p style={{ color: "var(--error-red)", fontSize: "0.85rem", marginTop: 10 }}>
            {formError}
          </p>
        )}

        {successInfo && (
          <div style={{ marginTop: 12 }}>
            {successInfo.created?.length > 0 && (
              <p style={{ color: "var(--success-green)", fontSize: "0.9rem", fontWeight: 600 }}>
                Invite{successInfo.created.length > 1 ? "s" : ""} sent to{" "}
                {successInfo.created.map((c) => c.email).join(", ")}
              </p>
            )}
            {successInfo.invalid?.length > 0 && (
              <p style={{ color: "var(--error-red)", fontSize: "0.85rem" }}>
                Skipped invalid address{successInfo.invalid.length > 1 ? "es" : ""}:{" "}
                {successInfo.invalid.join(", ")}
              </p>
            )}
            {successInfo.created?.map((c) => (
              <div key={c.id} style={{ marginTop: 6 }}>
                {c.emailError && (
                  <p style={{ color: "var(--error-red)", fontSize: "0.8rem", fontWeight: 600 }}>
                    Couldn't send the email to {c.email} ({c.emailError}) — the link below still
                    works, share it manually.
                  </p>
                )}
                <p style={{ color: "var(--slate-500)", fontSize: "0.78rem" }}>
                  {!c.emailError && "Dev tip: if SMTP isn't configured, the email is only logged to the server console."}{" "}
                  <code style={{ wordBreak: "break-all" }}>{c.loginUrl}</code>{" "}
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ padding: "2px 10px", fontSize: "0.75rem", marginLeft: 6 }}
                    onClick={() => copyLink(c.id, c.loginUrl)}
                  >
                    {copiedId === c.id ? "Copied!" : "Copy link"}
                  </button>{" "}
                  — security code: <code>{c.securityCode}</code>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="admin-card" style={{ padding: 0 }}>
        {isLoading ? (
          <div className="admin-state">
            <div className="admin-spinner" />
            <span>Loading invites…</span>
          </div>
        ) : isError ? (
          <div className="admin-state is-error">
            <div className="admin-state-icon">
              <XCircle size={20} />
            </div>
            <span>Couldn't load invites.</span>
          </div>
        ) : invites.length === 0 ? (
          <div className="admin-state">
            <div className="admin-state-icon">
              <Send size={20} />
            </div>
            <span>No invites sent yet.</span>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Product</th>
                  <th>Allowed Products</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Usage</th>
                  <th>Device Lock</th>
                  <th>Sent At</th>
                  <th>Expires At</th>
                  <th>Used At</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invites.map((invite) => (
                  <tr key={invite.id}>
                    <td>{invite.email}</td>
                    <td style={{ textTransform: "uppercase", fontSize: "0.85rem", fontWeight: 600, color: "var(--slate-600)" }}>
                      {invite.product_slug || "—"}
                    </td>
                    <td style={{ color: "var(--slate-500)", fontSize: "0.85rem" }}>
                      {invite.allowed_product_slugs?.length
                        ? invite.allowed_product_slugs.join(", ")
                        : "All"}
                    </td>
                    <td>
                      <StatusBadge status={invite.status} />
                    </td>
                    <td>
                      <ProgressCell pct={invite.progress_percent} />
                      {invite.videos_total > 0 && (
                        <p style={{ marginTop: 4, fontSize: "0.72rem", color: "var(--slate-500)" }}>
                          {invite.videos_watched} / {invite.videos_total} tour videos watched
                        </p>
                      )}
                    </td>
                    <td style={{ color: "var(--slate-500)", fontSize: "0.85rem" }}>
                      {invite.single_use
                        ? "Single-use"
                        : `Multi-use (opened ${invite.use_count}x)`}
                    </td>
                    <td style={{ color: "var(--slate-500)", fontSize: "0.85rem" }}>
                      {invite.device_lock ? "Locked" : "Any browser"}
                    </td>
                    <td>{formatDate(invite.sent_at)}</td>
                    <td>{formatDate(invite.expires_at)}</td>
                    <td>{formatDate(invite.used_at)}</td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        className="btn-secondary"
                        style={{ padding: "6px 10px", minHeight: 32 }}
                        onClick={(e) => toggleMenu(invite, e)}
                        aria-label="Actions"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {menuFor &&
        (() => {
          const invite = invites.find((i) => i.id === menuFor);
          if (!invite) return null;
          return (
            <div
              ref={menuRef}
              className="profile-dropdown-menu"
              style={{ position: "fixed", top: menuPos.top, left: menuPos.left, minWidth: 160 }}
            >
              <button
                className="dropdown-item"
                onClick={() => {
                  setDetailsInvite(invite);
                  setMenuFor(null);
                }}
              >
                <Eye size={15} /> View Details
              </button>
              <button
                className="dropdown-item"
                onClick={() => {
                  handleResend(invite);
                  setMenuFor(null);
                }}
              >
                <RotateCcw size={15} /> Resend
              </button>
              <button
                className="dropdown-item"
                onClick={() => {
                  handleRevoke(invite);
                  setMenuFor(null);
                }}
              >
                <XCircle size={15} /> Revoke
              </button>
              <button
                className="dropdown-item logout"
                onClick={() => {
                  handleDelete(invite);
                  setMenuFor(null);
                }}
              >
                <Trash2 size={15} /> Delete
              </button>
            </div>
          );
        })()}

      {detailsInvite && (
        <div
          className="mobile-sidebar-backdrop"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={() => setDetailsInvite(null)}
        >
          <div
            className="admin-login-box"
            style={{ maxWidth: 480, textAlign: "left" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ marginBottom: 0 }}>Invite details</h2>
              <button
                className="dropdown-item"
                style={{ width: "auto", padding: 6 }}
                onClick={() => setDetailsInvite(null)}
                aria-label="Close"
              >
                <X />
              </button>
            </div>

             <dl style={{ marginTop: 20, display: "grid", rowGap: 14 }}>
               <DetailRow label="Email invited">{detailsInvite.email}</DetailRow>
               <DetailRow label="Name they entered">
                 {detailsInvite.filled_name || "— not opened yet —"}
               </DetailRow>
               <DetailRow label="Product">
                 <span style={{ textTransform: "uppercase", fontWeight: 600, color: "var(--slate-700)" }}>
                   {detailsInvite.product_slug || "— not started yet —"}
                 </span>
               </DetailRow>
               <DetailRow label="Status">
                 <StatusBadge status={detailsInvite.status} />
               </DetailRow>
               <DetailRow label="Admin Notified (40% Progress)">
                 {detailsInvite.admin_notified ? "Yes (Email sent)" : "No"}
               </DetailRow>
               <DetailRow label="Product tour progress">
                <ProgressCell pct={detailsInvite.progress_percent} />
                {detailsInvite.videos_total > 0 && (
                  <p style={{ marginTop: 6, fontSize: "0.78rem", color: "var(--slate-500)" }}>
                    {detailsInvite.videos_watched} / {detailsInvite.videos_total} tour videos
                    watched to completion
                  </p>
                )}
                {detailsInvite.progress_steps?.length > 0 && (
                  <p style={{ marginTop: 6, fontSize: "0.78rem", color: "var(--slate-500)" }}>
                    Completed: {detailsInvite.progress_steps.map((s) => STEP_LABELS[s] || s).join(", ")}
                  </p>
                )}
                {detailsInvite.progress_updated_at && (
                  <p style={{ marginTop: 2, fontSize: "0.72rem", color: "var(--slate-400)" }}>
                    Last active {formatDate(detailsInvite.progress_updated_at)}
                  </p>
                )}
              </DetailRow>
              <DetailRow label="Times opened">
                {detailsInvite.use_count}
                {detailsInvite.single_use ? " (single-use link)" : " (multi-use link)"}
              </DetailRow>
              <DetailRow label="Device lock">
                {detailsInvite.device_lock
                  ? "Restricted to the first device that opened it"
                  : "Any browser can complete it"}
              </DetailRow>
              <DetailRow label="Sent at">{formatDate(detailsInvite.sent_at)}</DetailRow>
              <DetailRow label="Expires at">{formatDate(detailsInvite.expires_at)}</DetailRow>
              <DetailRow label="Last opened at">{formatDate(detailsInvite.used_at)}</DetailRow>
            </dl>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <button className="btn-secondary" onClick={() => setDetailsInvite(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, children }) {
  return (
    <div>
      <dt style={{ fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--slate-500)" }}>
        {label}
      </dt>
      <dd style={{ marginTop: 2, fontSize: "0.9rem", color: "var(--slate-800)" }}>{children}</dd>
    </div>
  );
}
