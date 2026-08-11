import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  MoreVertical,
  RotateCcw,
  Send,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";
import { useApiGet } from "@/lib/use-api";
import { apiSend } from "@/lib/api";
import { useAdminStore } from "@/lib/admin-store";
import { useDocumentHead } from "@/lib/use-document-head";
import { formatDate } from "@/lib/utils";

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
  const colorMap = {
    pending: "bg-gray-100 text-gray-600 border-gray-200",
    active: "bg-emerald-50 text-emerald-600 border-emerald-200",
    used: "bg-blue-50 text-blue-600 border-blue-200",
    expired: "bg-red-50 text-red-600 border-red-200",
    revoked: "bg-red-50 text-red-600 border-red-200",
  };
  const dotColorMap = {
    active: "bg-emerald-500",
  };
  const theme = colorMap[status] || colorMap.pending;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${theme}`}>
      {status === "active" && (
        <span className="relative flex h-1.5 w-1.5">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColorMap.active}`}></span>
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dotColorMap.active}`}></span>
        </span>
      )}
      {status}
    </span>
  );
}

export function ProgressCell({ pct }) {
  const value = pct || 0;
  const isComplete = value >= 100;
  
  return (
    <div className="flex items-center gap-3 min-w-32">
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden relative">
        <div 
          className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${isComplete ? 'bg-emerald-500' : 'bg-primary'}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-gray-600 min-w-8">{value}%</span>
    </div>
  );
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
  const navigate = useNavigate();
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
    const itemCount = invite.access_requested_at ? 5 : 4;
    const MENU_HEIGHT = itemCount * 38 + 12; // items + vertical padding, matches .profile-dropdown-menu
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

  async function handleGrantAccess(invite) {
    try {
      await apiSend(`/api/admin/email-invites/${invite.id}/grant-access`, "POST", undefined, token);
      refetch();
    } catch (err) {
      window.alert(err.message || "Failed to grant access.");
    }
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
    <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-screen bg-slate-50/50 font-sans">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Sent Emails</h1>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 mb-8 transition-all">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Send className="size-5 text-primary" />
          Send a magic login link
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="invite-emails" className="block text-sm font-semibold text-gray-700">Email addresses</label>
            <textarea
              id="invite-emails"
              required
              rows={2}
              placeholder="name@company.com, another@company.com"
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              className="w-full rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all p-3 text-[15px] resize-none placeholder:text-gray-400"
            />
            <p className="text-xs text-gray-500">
              Separate multiple addresses with commas — each gets its own link.
            </p>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">Products (optional)</label>
            <div className="flex flex-wrap gap-3">
              {products.map((p) => (
                <label
                  key={p.slug}
                  className={`flex items-center gap-2 text-sm font-medium border rounded-xl px-4 py-2 cursor-pointer transition-all select-none ${
                    productSlugs.includes(p.slug) 
                      ? "bg-blue-50/50 border-primary/40 text-primary shadow-sm" 
                      : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={productSlugs.includes(p.slug)}
                    onChange={() => toggleProduct(p.slug)}
                  />
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    productSlugs.includes(p.slug) ? "bg-primary border-primary" : "border-gray-300"
                  }`}>
                     {productSlugs.includes(p.slug) && <CheckCircle2 className="size-3 text-white" />}
                  </div>
                  {p.name}
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              Select one or more to restrict this invite to those products. Leave all unchecked to show every product.
            </p>
          </div>

          <div className="flex flex-wrap gap-6 items-end bg-gray-50/70 p-6 rounded-2xl border border-gray-100">
            <div className="space-y-2 flex-1 min-w-44">
              <label htmlFor="invite-duration" className="block text-sm font-semibold text-gray-700">Link stays active for</label>
              <select
                id="invite-duration"
                value={expiresInHours}
                onChange={(e) => setExpiresInHours(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all p-3 text-[14px] cursor-pointer shadow-sm"
              >
                {DURATION_OPTIONS.map((opt) => (
                  <option key={opt.hours} value={opt.hours}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 flex-1 min-w-48">
              <label htmlFor="invite-usage" className="block text-sm font-semibold text-gray-700">Link can be opened</label>
              <select
                id="invite-usage"
                value={singleUse ? "single" : "multiple"}
                onChange={(e) => setSingleUse(e.target.value === "single")}
                className="w-full rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all p-3 text-[14px] cursor-pointer shadow-sm"
              >
                <option value="single">A single time</option>
                <option value="multiple">Multiple times (until it expires)</option>
              </select>
            </div>

            <div className="flex-1 min-w-64 pb-3">
              <label className="flex items-center gap-3 text-sm font-semibold text-gray-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={deviceLock}
                  onChange={(e) => setDeviceLock(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                />
                Restrict to the first device that opens it
              </label>
            </div>

            <button
              type="submit"
              disabled={sending || !emails.trim()}
              className="bg-primary hover:bg-blue-700 text-white px-6 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 h-11.5 w-full md:w-auto justify-center shadow-md shadow-blue-900/10"
            >
              {sending ? "Sending…" : (<><Send className="size-4" /> Send Invite</>)}
            </button>
          </div>

          <p className="text-xs text-gray-500 leading-relaxed font-medium">
            {singleUse
              ? "This link stops working the moment it's used once."
              : "This link stays reusable until it expires."}{" "}
            {deviceLock
              ? "Once opened, it can only be completed from that same browser."
              : "Any browser can complete it."}
          </p>
        </form>

        {formError && (
          <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex items-center gap-2">
            <XCircle className="size-4" /> {formError}
          </div>
        )}

        {successInfo && (
          <div className="mt-6 space-y-4">
            {successInfo.created?.length > 0 && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-medium">
                Invite{successInfo.created.length > 1 ? "s" : ""} sent to{" "}
                {successInfo.created.map((c) => c.email).join(", ")}
              </div>
            )}
            {successInfo.invalid?.length > 0 && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
                Skipped invalid address{successInfo.invalid.length > 1 ? "es" : ""}:{" "}
                {successInfo.invalid.join(", ")}
              </div>
            )}
            {successInfo.created?.map((c) => (
              <div key={c.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-2">
                {c.emailError && (
                  <p className="text-red-600 text-xs font-semibold">
                    Couldn't send the email to {c.email} ({c.emailError}) — the link below still
                    works, share it manually.
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                  {!c.emailError && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md font-medium">Dev tip: if SMTP isn't configured, the email is only logged to the server console.</span>}
                  <code className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 text-primary break-all text-xs font-mono shadow-sm">
                    {c.loginUrl}
                  </code>
                  <button
                    type="button"
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors bg-white shadow-sm"
                    onClick={() => copyLink(c.id, c.loginUrl)}
                  >
                    {copiedId === c.id ? "Copied!" : "Copy link"}
                  </button>
                  <span className="text-xs text-gray-400">— security code: <code className="font-mono text-gray-700 bg-gray-200 px-2 py-1 rounded">{c.securityCode}</code></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-4 text-gray-400">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-primary rounded-full animate-spin" />
            <span className="text-sm font-medium">Loading invites…</span>
          </div>
        ) : isError ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-red-500">
            <XCircle size={32} />
            <span className="text-sm font-medium">Couldn't load invites.</span>
          </div>
        ) : invites.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-gray-400">
            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 mb-2">
              <Send size={24} className="text-gray-300" />
            </div>
            <span className="text-sm font-medium">No invites sent yet.</span>
          </div>
        ) : (
          <div className="w-full overflow-x-auto pb-4 pt-1 px-1">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50 rounded-tl-2xl">Email</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50">Product</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50">Allowed Products</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50">Status</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50">Progress</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50">Usage</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50">Device Lock</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50">Sent At</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50">Expires At</th>
                  <th className="px-4 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50 text-center rounded-tr-2xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invites.map((invite) => (
                  <tr key={invite.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-gray-900">{invite.email}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[12px] font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-md uppercase tracking-wide">
                        {invite.product_slug || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[13px] text-gray-500 font-medium">
                        {invite.allowed_product_slugs?.length
                          ? invite.allowed_product_slugs.join(", ")
                          : "All"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={invite.status} />
                      {invite.access_requested_at && (
                        <p style={{ marginTop: 4, fontSize: "0.72rem", fontWeight: 600, color: "var(--error-red)" }}>
                          Access requested
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <ProgressCell pct={invite.progress_percent} />
                      {invite.videos_total > 0 && (
                        <p className="mt-1.5 text-[11px] text-gray-400 font-medium">
                          {invite.videos_watched} / {invite.videos_total} tour videos watched
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[13px] text-gray-500">
                        {invite.single_use ? (
                          "Single-use"
                        ) : (
                          <span className="flex flex-col gap-0.5">
                            Multi-use
                            <span className="text-[11px] text-gray-400">(opened {invite.use_count}x)</span>
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[13px] text-gray-500">
                        {invite.device_lock ? "Locked" : "Any browser"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[13px] text-gray-500">{formatDate(invite.sent_at)}</td>
                    <td className="px-6 py-4 text-[13px] text-gray-500">{formatDate(invite.expires_at)}</td>
                    <td className="px-4 py-4 text-center relative">
                      <button
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                        onClick={(e) => toggleMenu(invite, e)}
                        aria-label="Actions"
                      >
                        <MoreVertical size={18} />
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
              className="bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-gray-100 py-1.5 z-50 flex flex-col"
              style={{ position: "fixed", top: menuPos.top, left: menuPos.left, minWidth: 160 }}
            >
              <button
                className="w-full px-4 py-2 text-left text-[13px] font-medium text-gray-700 hover:bg-gray-50 hover:text-primary flex items-center gap-2 transition-colors"
                onClick={() => {
                  navigate(`/admin/emails/${invite.id}`);
                  setMenuFor(null);
                }}
              >
                <Eye size={15} /> View Details
              </button>
              {invite.access_requested_at && (
                <button
                  className="dropdown-item"
                  onClick={() => {
                    handleGrantAccess(invite);
                    setMenuFor(null);
                  }}
                >
                  <ShieldCheck size={15} /> Grant Access
                </button>
              )}
              <button
                className="w-full px-4 py-2 text-left text-[13px] font-medium text-gray-700 hover:bg-gray-50 hover:text-primary flex items-center gap-2 transition-colors"
                onClick={() => {
                  handleResend(invite);
                  setMenuFor(null);
                }}
              >
                <RotateCcw size={15} /> Resend
              </button>
              <button
                className="w-full px-4 py-2 text-left text-[13px] font-medium text-gray-700 hover:bg-gray-50 hover:text-red-600 flex items-center gap-2 transition-colors"
                onClick={() => {
                  handleRevoke(invite);
                  setMenuFor(null);
                }}
              >
                <XCircle size={15} /> Revoke
              </button>
              <div className="h-px bg-gray-100 my-1 mx-2"></div>
              <button
                className="w-full px-4 py-2 text-left text-[13px] font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
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

    </div>
  );
}

export function InviteDetailsPage() {
  useDocumentHead({ meta: [{ title: "Invite Details — Admin" }] });
  const { id } = useParams();
  const token = useAdminStore((s) => s.token);
  const { data, isLoading, isError, refetch } = useApiGet("/api/admin/email-invites", { token });
  const invite = (data ?? []).find((i) => String(i.id) === id);

  async function handleGrantAccess() {
    try {
      await apiSend(`/api/admin/email-invites/${invite.id}/grant-access`, "POST", undefined, token);
      refetch();
    } catch (err) {
      window.alert(err.message || "Failed to grant access.");
    }
  }

  return (
    <div className="admin-page-wrapper">
      <div className="admin-header-actions">
        <Link to="/admin/emails" className="btn-secondary">
          <ArrowLeft size={16} /> Back to Sent Emails
        </Link>
      </div>

      <div className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.08)] max-w-lg w-full overflow-hidden">
        {isLoading ? (
          <div className="admin-state">
            <div className="admin-spinner" />
            <span>Loading invite…</span>
          </div>
        ) : isError || !invite ? (
          <div className="admin-state is-error">
            <div className="admin-state-icon">
              <XCircle size={20} />
            </div>
            <span>Couldn't find that invite.</span>
          </div>
        ) : (
          <>
            <div className="px-8 py-5 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Invite details</h2>
            </div>

            <dl className="px-8 py-6 grid gap-y-5">
              <DetailRow label="Email invited">{invite.email}</DetailRow>
              <DetailRow label="Name they entered">
                {invite.filled_name || <span className="text-gray-400 italic">not opened yet</span>}
              </DetailRow>
              <DetailRow label="Product">
                <span className="uppercase font-bold text-primary bg-blue-50 px-2 py-0.5 rounded border border-blue-100 text-sm">
                  {invite.product_slug || "—"}
                </span>
              </DetailRow>
              <DetailRow label="Status">
                <StatusBadge status={invite.status} />
              </DetailRow>
              {invite.access_requested_at && (
                <DetailRow label="Access requested">
                  <div className="flex items-center gap-2.5">
                    <span className="text-red-600 font-semibold">
                      {formatDate(invite.access_requested_at)} — opened from a new device
                    </span>
                    <button
                      className="px-4 py-1.5 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 transition"
                      onClick={handleGrantAccess}
                    >
                      Grant Access
                    </button>
                  </div>
                </DetailRow>
              )}
              <DetailRow label="Admin Notified (40% Progress)">
                {invite.admin_notified ? (
                  <span className="text-emerald-600 font-medium flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> Yes (Email sent)
                  </span>
                ) : (
                  "No"
                )}
              </DetailRow>
              <DetailRow label="Product tour progress">
                <ProgressCell pct={invite.progress_percent} />
                {invite.videos_total > 0 && (
                  <p className="mt-2 text-xs text-gray-500 font-medium">
                    {invite.videos_watched} / {invite.videos_total} tour videos
                    watched to completion
                  </p>
                )}
                {invite.progress_steps?.length > 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    <span className="font-semibold text-gray-700">Completed:</span>{" "}
                    {invite.progress_steps.map((s) => STEP_LABELS[s] || s).join(", ")}
                  </p>
                )}
                {invite.progress_updated_at && (
                  <p className="mt-1 text-[11px] text-gray-400">
                    Last active {formatDate(invite.progress_updated_at)}
                  </p>
                )}
              </DetailRow>
              <DetailRow label="Times opened">
                <span className="font-semibold">{invite.use_count}</span>
                <span className="text-gray-500 ml-1">
                  {invite.single_use ? "(single-use link)" : "(multi-use link)"}
                </span>
              </DetailRow>
              <DetailRow label="Device lock">
                {invite.device_lock ? (
                  <span className="text-gray-700 font-medium">
                    Restricted to the first device that opened it
                  </span>
                ) : (
                  <span className="text-gray-500">Any browser can complete it</span>
                )}
              </DetailRow>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <DetailRow label="Sent at">{formatDate(invite.sent_at)}</DetailRow>
                <DetailRow label="Expires at">{formatDate(invite.expires_at)}</DetailRow>
              </div>
              <DetailRow label="Last opened at">{formatDate(invite.used_at)}</DetailRow>
            </dl>
          </>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, children }) {
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
        {label}
      </dt>
      <dd className="text-[15px] text-gray-900 font-medium">{children}</dd>
    </div>
  );
}
