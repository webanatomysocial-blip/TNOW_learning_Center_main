import { useEffect, useRef, useState, useMemo } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Download,
  Eye,
  MoreVertical,
  RotateCcw,
  Send,
  ShieldCheck,
  Search,
  Filter,
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

// Color steps up as progress climbs, so a glance at the bar alone tells you
// roughly where someone is: red (just started) → amber → blue → green (done).
function progressColor(value) {
  if (value >= 100) return "bg-emerald-500";
  if (value >= 70) return "bg-primary";
  if (value >= 40) return "bg-amber-500";
  return "bg-red-400";
}

export function ProgressCell({ pct, label }) {
  const value = pct || 0;

  return (
    <div className="flex items-center gap-3 min-w-32">
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden relative">
        <div
          className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${progressColor(value)}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-gray-600 min-w-8">{value}%</span>
      {label && <span className="text-[11px] font-bold text-gray-400 uppercase">{label}</span>}
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
  useDocumentHead({ meta: [{ title: "Send Invite — Admin" }] });
  const token = useAdminStore((s) => s.token);
  const { data, isLoading, isError, refetch } = useApiGet("/api/admin/email-invites", { token });
  const invites = data ?? [];
  const { data: productsData } = useApiGet("/api/products");
  const products = productsData ?? [];

  const [selectedStatusTab, setSelectedStatusTab] = useState("all");
  const [search, setSearch] = useState("");
  const [productFilter, setProductFilter] = useState("all");

  const uniqueProducts = useMemo(() => {
    const slugs = invites.map((i) => i.product_slug).filter(Boolean);
    return ["all", ...Array.from(new Set(slugs))];
  }, [invites]);

  const filteredInvites = invites.filter((invite) => {
    const matchesStatus = selectedStatusTab === "all" || invite.status === selectedStatusTab;
    const matchesSearch =
      (invite.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (invite.filled_name || "").toLowerCase().includes(search.toLowerCase());
    const matchesProduct = productFilter === "all" || invite.product_slug === productFilter;
    return matchesStatus && matchesSearch && matchesProduct;
  });

  const [emails, setEmails] = useState("");
  const [expiresInHours, setExpiresInHours] = useState(24);
  const [deviceLock, setDeviceLock] = useState(true);
  const [usageMode, setUsageMode] = useState("single"); // single | multiple | custom
  const [customUsageLimit, setCustomUsageLimit] = useState("5");
  const [productSlugs, setProductSlugs] = useState([]);
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState("");
  const [successInfo, setSuccessInfo] = useState(null); // { created: [...], invalid: [...] }
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
    e.stopPropagation();
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
        {
          emails,
          expiresInHours,
          deviceLock,
          singleUse: usageMode === "single",
          usageLimit: usageMode === "custom" ? Number(customUsageLimit) || null : null,
          productSlugs,
        },
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
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Send Invite</h1>
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

          <div className="space-y-5 bg-gray-50/70 p-6 rounded-2xl border border-gray-100">
            <div className="flex flex-wrap gap-6">
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
                  value={usageMode}
                  onChange={(e) => setUsageMode(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all p-3 text-[14px] cursor-pointer shadow-sm"
                >
                  <option value="single">A single time</option>
                  <option value="multiple">Multiple times (until it expires)</option>
                  <option value="custom">A custom number of times</option>
                </select>
                {usageMode === "custom" && (
                  <input
                    type="number"
                    min={1}
                    value={customUsageLimit}
                    onChange={(e) => setCustomUsageLimit(e.target.value)}
                    placeholder="e.g. 5"
                    className="w-full rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all p-3 text-[14px] shadow-sm"
                  />
                )}
              </div>
            </div>

            <label className="flex items-center gap-3 text-sm font-semibold text-gray-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={deviceLock}
                onChange={(e) => setDeviceLock(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
              />
              Restrict to the first device that opens it
            </label>

            <button
              type="submit"
              disabled={sending || !emails.trim()}
              className="bg-primary hover:bg-blue-700 text-white px-6 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 h-11.5 w-full md:w-auto justify-center shadow-md shadow-blue-900/10"
            >
              {sending ? "Sending…" : (<><Send className="size-4" /> Send Invite</>)}
            </button>
          </div>

          <p className="text-xs text-gray-500 leading-relaxed font-medium">
            {usageMode === "single"
              ? "This link stops working the moment it's used once."
              : usageMode === "custom"
                ? `This link stops working after ${customUsageLimit || "N"} uses.`
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
            {successInfo.duplicate?.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 text-sm">
                Already invited — use Resend on the existing row instead of sending a new invite:{" "}
                {successInfo.duplicate.join(", ")}
              </div>
            )}
            {successInfo.created?.some((c) => c.emailError) && (
              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-2">
                {successInfo.created
                  .filter((c) => c.emailError)
                  .map((c) => (
                    <p key={c.id} className="text-red-600 text-xs font-semibold">
                      Couldn't send the email to {c.email} ({c.emailError}) — check SMTP settings
                      and resend.
                    </p>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {invites.length > 0 && (
          <div>
            <div className="flex items-center justify-between px-6 pt-5 pb-1">
              <h2 className="text-sm font-bold text-gray-800">Sent Invites ({invites.length})</h2>
              <button
                onClick={() => downloadInvitesCsv(filteredInvites)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 bg-white text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Download size={14} /> Export CSV
              </button>
            </div>
            
            {/* Status tabs */}
            <div className="px-6 border-b border-gray-100 mt-2">
              <div className="flex flex-wrap gap-1.5 py-3">
                {[
                  { id: "all", label: "All", count: invites.length },
                  { id: "active", label: "Active", count: invites.filter(i => i.status === "active").length },
                  { id: "pending", label: "Pending", count: invites.filter(i => i.status === "pending").length },
                  { id: "used", label: "Used", count: invites.filter(i => i.status === "used").length },
                  { id: "expired", label: "Expired", count: invites.filter(i => i.status === "expired").length },
                  { id: "revoked", label: "Revoked", count: invites.filter(i => i.status === "revoked").length },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedStatusTab(tab.id);
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                      selectedStatusTab === tab.id
                        ? "bg-primary text-white shadow-sm shadow-primary/20"
                        : "bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab.label} <span className="opacity-70 text-[10px] ml-1">{tab.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Search and Product Filters */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/20 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-2.5 size-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by email or name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition bg-white"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                <Filter size={16} className="text-gray-400" />
                <select
                  value={productFilter}
                  onChange={(e) => setProductFilter(e.target.value)}
                  className="pl-4 pr-8 py-2 border border-gray-200 rounded-full text-xs font-bold bg-white focus:outline-none focus:border-primary transition uppercase text-gray-700 appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23475569' stroke-width='2.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='m19.5 8.25-7.5 7.5-7.5-7.5'/%3E%3C/svg%3E")`,
                    backgroundPosition: "right 0.65rem center",
                    backgroundSize: "0.75em 0.75em",
                    backgroundRepeat: "no-repeat",
                    minWidth: "130px"
                  }}
                >
                  {uniqueProducts.map((slug) => (
                    <option key={slug} value={slug}>
                      {slug === "all" ? "All Products" : slug}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
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
        ) : filteredInvites.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-gray-400">
            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 mb-2">
              <Send size={24} className="text-gray-300" />
            </div>
            <span className="text-sm font-medium">No invites matching this status.</span>
          </div>
        ) : (
          <div className="w-full pb-4 pt-1 px-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50 rounded-tl-2xl">Email</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50">Product</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50">Status</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50">Progress</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50">Sent At</th>
                  <th className="px-4 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50 text-center rounded-tr-2xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInvites.map((invite) => (
                  <tr
                    key={invite.id}
                    className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/admin/emails/${invite.id}`)}
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-gray-900">{invite.email}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[12px] font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-md uppercase tracking-wide">
                        {invite.product_slug || "—"}
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
                      <ProgressCell
                        pct={invite.progress_percent}
                        label={invite.product_progress?.length > 1 ? invite.product_slug : null}
                      />
                      {invite.videos_total > 0 && (
                        <p className="mt-1.5 text-[11px] text-gray-400 font-medium">
                          {invite.videos_watched} / {invite.videos_total} tour videos watched
                        </p>
                      )}
                      {invite.product_progress?.length > 1 && (
                        <p className="mt-1 text-[11px] text-gray-400">
                          +{invite.product_progress.length - 1} more product
                          {invite.product_progress.length > 2 ? "s" : ""}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-[13px] text-gray-500">{formatDate(invite.sent_at)}</td>
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
  const navigate = useNavigate();
  const location = useLocation();
  const token = useAdminStore((s) => s.token);
  const { data, isLoading, isError, refetch } = useApiGet("/api/admin/email-invites", { token });
  const invite = (data ?? []).find((i) => String(i.id) === id);
  const { data: productsData } = useApiGet("/api/products");
  const [addProductSlug, setAddProductSlug] = useState("");
  const [addingProduct, setAddingProduct] = useState(false);

  const fromPath = location.state?.from || "/admin/emails";
  const fromLabel = fromPath === "/admin/progress"
    ? "Back to Progress Tracker"
    : fromPath === "/admin"
      ? "Back to Dashboard"
      : "Back to Send Invite";

  async function handleGrantAccess() {
    try {
      await apiSend(`/api/admin/email-invites/${invite.id}/grant-access`, "POST", undefined, token);
      refetch();
    } catch (err) {
      window.alert(err.message || "Failed to grant access.");
    }
  }

  async function handleApproveProductAccess(productSlug) {
    try {
      await apiSend(`/api/admin/email-invites/${invite.id}/product-access/${productSlug}/approve`, "POST", undefined, token);
      refetch();
    } catch (err) {
      window.alert(err.message || "Failed to approve access.");
    }
  }

  // Same endpoint the pending-request "Approve" buttons use — it works fine
  // without a request row already existing, so an admin can grant a product
  // proactively too, not just in response to a customer asking for it.
  async function handleAddProductAccess() {
    if (!addProductSlug) return;
    setAddingProduct(true);
    try {
      await apiSend(
        `/api/admin/email-invites/${invite.id}/product-access/${addProductSlug}/approve`,
        "POST",
        undefined,
        token,
      );
      setAddProductSlug("");
      refetch();
    } catch (err) {
      window.alert(err.message || "Failed to add product access.");
    } finally {
      setAddingProduct(false);
    }
  }

  async function handleResend() {
    try {
      await apiSend(`/api/admin/email-invites/${invite.id}/resend`, "POST", undefined, token);
      refetch();
    } catch (err) {
      window.alert(err.message || "Failed to resend invite.");
    }
  }

  async function handleRevoke() {
    if (!window.confirm(`Revoke the invite for "${invite.email}"? The link stops working, but it stays in this list.`)) return;
    try {
      await apiSend(`/api/admin/email-invites/${invite.id}`, "DELETE", undefined, token);
      refetch();
    } catch (err) {
      window.alert(err.message || "Failed to revoke invite.");
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Permanently delete the invite for "${invite.email}"? This can't be undone.`)) return;
    try {
      await apiSend(`/api/admin/email-invites/${invite.id}/permanent`, "DELETE", undefined, token);
      navigate("/admin/emails");
    } catch (err) {
      window.alert(err.message || "Failed to delete invite.");
    }
  }

  return (
    <div className="admin-page-wrapper">
      <div className="admin-header-actions">
        <Link to={fromPath} className="btn-secondary">
          <ArrowLeft size={16} /> {fromLabel}
        </Link>
        {invite && (
          <div className="flex items-center gap-2">
            <button
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 bg-white text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => downloadInviteDetailCsv(invite)}
            >
              <Download size={14} /> Export CSV
            </button>
            <button
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 bg-white text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={handleResend}
            >
              <RotateCcw size={14} /> Resend
            </button>
            <button
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 bg-white text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={handleRevoke}
            >
              <XCircle size={14} /> Revoke
            </button>
            <button
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-red-200 bg-white text-[13px] font-semibold text-red-600 hover:bg-red-50 transition-colors"
              onClick={handleDelete}
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="admin-card admin-state">
          <div className="admin-spinner" />
          <span>Loading invite…</span>
        </div>
      ) : isError || !invite ? (
        <div className="admin-card admin-state is-error">
          <div className="admin-state-icon">
            <XCircle size={20} />
          </div>
          <span>Couldn't find that invite.</span>
        </div>
      ) : (
        <div className="w-full">
          {invite.access_requested_at && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-6 py-4">
              <div>
                <p className="text-sm font-bold text-red-700">Access requested</p>
                <p className="text-[13px] text-red-600 mt-0.5">
                  Opened from a new device on {formatDate(invite.access_requested_at)} — the original device lock is blocking it.
                </p>
              </div>
              <button
                className="shrink-0 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 transition"
                onClick={handleGrantAccess}
              >
                Grant Access
              </button>
            </div>
          )}

          <div className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.08)] overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-b from-gray-50/80 to-white flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Invite details</p>
                <h1 className="text-2xl font-bold text-gray-900">{invite.email}</h1>
                <p className="mt-1.5 text-sm text-gray-500">
                  {invite.filled_name ? (
                    <>Entered name: <span className="font-semibold text-gray-700">{invite.filled_name}</span></>
                  ) : (
                    "Not opened yet"
                  )}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge status={invite.status} />
                <span className="uppercase font-bold text-primary bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100 text-xs">
                  {invite.product_slug || "Not started yet"}
                </span>
              </div>
            </div>

            {invite.pending_product_requests?.length > 0 && (
              <div className="mx-8 mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4">
                <p className="text-sm font-bold text-amber-800 mb-2">
                  Product access requested ({invite.pending_product_requests.length})
                </p>
                <div className="space-y-2">
                  {invite.pending_product_requests.map((r) => (
                    <div key={r.product_slug} className="flex items-center justify-between gap-3">
                      <span className="text-[13px] text-amber-700">
                        <span className="font-semibold uppercase">{r.product_slug}</span> — requested{" "}
                        {formatDate(r.requested_at)}
                      </span>
                      <button
                        className="shrink-0 px-3.5 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:opacity-90 transition"
                        onClick={() => handleApproveProductAccess(r.product_slug)}
                      >
                        Approve
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {invite.product_progress?.length > 0 && (
              <div className="px-8 py-6 border-t border-gray-100">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-4">
                  Product tour progress
                  {invite.product_progress.length > 1 ? ` (${invite.product_progress.length} products explored)` : ""}
                </p>
                <div className="space-y-5">
                  {invite.product_progress.map((p) => (
                    <div key={p.product_slug} className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <span className="uppercase font-bold text-primary bg-blue-50 px-2 py-0.5 rounded border border-blue-100 text-xs">
                          {p.product_slug}
                        </span>
                        {p.admin_notified && (
                          <span className="text-emerald-600 text-xs font-medium flex items-center gap-1">
                            <CheckCircle2 size={13} /> Admin notified at 40%+
                          </span>
                        )}
                      </div>
                      <ProgressCell pct={p.progress_percent} />
                      {p.videos_total > 0 && (
                        <p className="mt-2 text-xs text-gray-500 font-medium">
                          {p.videos_watched} / {p.videos_total} tour videos watched to completion
                        </p>
                      )}
                      {p.progress_steps?.length > 0 && (
                        <p className="mt-1 text-xs text-gray-500">
                          <span className="font-semibold text-gray-700">Completed:</span>{" "}
                          {p.progress_steps.map((s) => STEP_LABELS[s] || s).join(", ")}
                        </p>
                      )}
                      {p.updated_at && (
                        <p className="mt-1 text-[11px] text-gray-400">Last active {formatDate(p.updated_at)}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {invite.assessment_results?.length > 0 && (
              <div className="px-8 py-6 border-t border-gray-100">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-1.5">
                  <ClipboardList size={13} /> Engagement fit assessment & ROI
                </p>
                <div className="space-y-6">
                  {invite.assessment_results.map((a) => (
                    <div key={a.product_slug} className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <span className="uppercase font-bold text-primary bg-blue-50 px-2 py-0.5 rounded border border-blue-100 text-xs">
                          {a.product_slug}
                        </span>
                        {a.score != null ? (
                          <span className="text-sm text-gray-700">
                            Score <span className="font-bold">{a.score}</span> — recommended{" "}
                            <span className="font-bold">{a.tier_name}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Quiz not completed</span>
                        )}
                        {a.updated_at && (
                          <span className="text-[11px] text-gray-400">Updated {formatDate(a.updated_at)}</span>
                        )}
                      </div>

                      {a.answers?.length > 0 && (
                        <div className="space-y-3">
                          {a.answers.map((qa, i) => (
                            <div key={i} className={i > 0 ? "pt-3 border-t border-gray-200" : ""}>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-0.5">
                                {qa.dim}
                              </p>
                              <p className="text-[13px] font-semibold text-gray-800">{qa.question}</p>
                              <p className="text-[13px] text-gray-600 mt-0.5">→ {qa.answer}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {a.roi_results && (
                        <div className={a.answers?.length > 0 ? "mt-4 pt-4 border-t border-gray-200" : ""}>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-2">
                            Full Report
                            {a.roi_updated_at ? ` · Generated ${formatDate(a.roi_updated_at)}` : ""}
                          </p>

                          {a.roi_results.tier && (
                            <div className="rounded-lg bg-white border border-gray-100 p-3 mb-3">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
                                {a.roi_results.tier.name} · {a.roi_results.tier.tag}
                              </p>
                              <p className="text-sm font-bold text-gray-900 mt-0.5">{a.roi_results.tier.subtitle}</p>
                              <p className="text-[12px] text-gray-600 mt-1.5">{a.roi_results.tier.description}</p>
                              <p className="text-[12px] text-gray-700 mt-1.5">
                                <span className="font-semibold">Why this fits:</span> {a.roi_results.tier.whyFits}
                              </p>
                              {a.roi_results.tier.features?.length > 0 && (
                                <ul className="mt-1.5 list-disc pl-4 space-y-0.5">
                                  {a.roi_results.tier.features.map((f, i) => (
                                    <li key={i} className="text-[12px] text-gray-600">{f}</li>
                                  ))}
                                </ul>
                              )}
                              <p className="text-[11px] text-gray-500 mt-1.5">
                                <span className="font-semibold">Ideal for:</span> {a.roi_results.tier.recommendedFor}
                              </p>
                            </div>
                          )}

                          {a.roi_results.exposureFlags?.length > 0 && (
                            <div className="mb-3">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-red-500 mb-1.5">
                                Exposure Flags ({a.roi_results.exposureFlags.length})
                              </p>
                              <div className="space-y-1.5">
                                {a.roi_results.exposureFlags.map((f, i) => (
                                  <div key={i} className="rounded-lg bg-red-50 border border-red-100 px-2.5 py-1.5">
                                    <p className="text-[10px] font-bold text-red-700 uppercase">{f.dim}</p>
                                    <p className="text-[12px] text-gray-700">{f.text}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                            <RoiStat
                              label="Annual Savings"
                              value={formatMoney(a.roi_results.annualSavings, a.roi_config?.currency)}
                              accent
                            />
                            <RoiStat label="FTEs Released" value={Number(a.roi_results.ftesReleased).toFixed(2)} />
                            <RoiStat label="Effort Reduction" value={`${a.roi_results.overallPctReduction}%`} />
                            <RoiStat
                              label="Cost / Hour"
                              value={formatMoney(a.roi_results.hourlyRate, a.roi_config?.currency)}
                            />
                          </div>
                          <p className="text-[12px] text-gray-600">
                            Currency: <span className="font-semibold">{a.roi_config?.currency}</span> · Cost per
                            FTE/yr:{" "}
                            <span className="font-semibold">
                              {formatMoney(a.roi_config?.costPerFte, a.roi_config?.currency)}
                            </span>{" "}
                            · Productive hrs/mo:{" "}
                            <span className="font-semibold">{a.roi_config?.productiveHoursMonth}</span>
                          </p>
                          {a.roi_config?.tasks?.length > 0 && (
                            <div className="admin-table-wrapper mt-3">
                              <table className="admin-table">
                                <thead>
                                  <tr>
                                    <th>Task</th>
                                    <th>Tickets/mo</th>
                                    <th>Manual</th>
                                    <th>Platform</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {a.roi_config.tasks.map((t) => (
                                    <tr key={t.id}>
                                      <td>{t.name}</td>
                                      <td>{t.ticketsPerMonth}</td>
                                      <td>{t.minManual}m</td>
                                      <td>{t.minSecOps}m</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <dl className="px-8 py-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
              <DetailRow label="Allowed products">
                <div>{invite.allowed_product_slugs?.length ? invite.allowed_product_slugs.join(", ") : "All"}</div>
                {invite.allowed_product_slugs?.length > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <select
                      value={addProductSlug}
                      onChange={(e) => setAddProductSlug(e.target.value)}
                      className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
                    >
                      <option value="">Add product access…</option>
                      {(productsData ?? [])
                        .filter((p) => !invite.allowed_product_slugs.includes(p.slug))
                        .map((p) => (
                          <option key={p.slug} value={p.slug}>
                            {p.name}
                          </option>
                        ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAddProductAccess}
                      disabled={!addProductSlug || addingProduct}
                      className="text-xs font-semibold text-primary hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer"
                    >
                      {addingProduct ? "Adding…" : "Add"}
                    </button>
                  </div>
                )}
              </DetailRow>
              <DetailRow label="Times opened">
                <span className="font-semibold">{invite.use_count}</span>
                <span className="text-gray-500 ml-1">
                  {invite.single_use
                    ? "(single-use link)"
                    : invite.usage_limit
                      ? `(up to ${invite.usage_limit} uses)`
                      : "(multi-use link)"}
                </span>
              </DetailRow>
              <DetailRow label="Device lock">
                {invite.device_lock ? "Restricted to the first device that opened it" : "Any browser can complete it"}
              </DetailRow>

              <DetailRow label="Sent at">{formatDate(invite.sent_at)}</DetailRow>
              <DetailRow label="Expires at">{formatDate(invite.expires_at)}</DetailRow>

              <DetailRow label="Last opened at">{formatDate(invite.used_at)}</DetailRow>
            </dl>

            {invite.sessions?.length > 0 && (
              <div className="px-8 py-6 border-t border-gray-100">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-4">
                  Login Sessions ({invite.sessions.length})
                </p>
                <div className="admin-table-wrapper" style={{ marginTop: 8 }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Logged In At</th>
                        <th>IP Address</th>
                        <th>Device ID</th>
                        <th>User Agent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invite.sessions.map((session) => (
                        <tr key={session.id}>
                          <td>{formatDate(session.consented_at)}</td>
                          <td style={{ fontSize: "0.85rem", color: "var(--slate-600)" }}>{session.ip || "—"}</td>
                          <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{session.device_id || "—"}</td>
                          <td style={{ fontSize: "0.78rem", color: "var(--slate-500)", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={session.user_agent}>
                            {session.user_agent || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const CURRENCY_SYMBOLS = { USD: "$", EUR: "€", GBP: "£", INR: "₹" };
function formatMoney(amount, currencyCode) {
  if (amount == null) return "—";
  const symbol = CURRENCY_SYMBOLS[currencyCode] || "$";
  return `${symbol}${Math.round(Number(amount)).toLocaleString(currencyCode === "INR" ? "en-IN" : "en-US")}`;
}

function RoiStat({ label, value, accent }) {
  return (
    <div className={`rounded-lg border p-2.5 ${accent ? "border-primary/20 bg-blue-50" : "border-gray-100 bg-white"}`}>
      <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
      <p className={`text-sm font-bold mt-0.5 ${accent ? "text-primary" : "text-gray-800"}`}>{value}</p>
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

// Excel/Sheets open a UTF-8 CSV with quoted fields fine — no library needed for
// something this simple, and it sidesteps ever having to update a PDF layout
// when a column gets added.
function csvCell(value) {
  const str = value == null ? "" : String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function downloadInvitesCsv(invites) {
  const headers = [
    "Email",
    "Entered Name",
    "Product",
    "Status",
    "Progress %",
    "Sent At",
    "Expires At",
    "Used At",
    "Device Lock",
    "Single Use",
    "Usage Limit",
    "Times Opened",
    "Assessment Score",
    "Assessment Tier",
    "ROI Currency",
    "ROI Annual Savings",
    "ROI FTEs Released",
  ];

  const rows = invites.map((inv) => {
    const assessment = inv.assessment_results?.[0];
    return [
      inv.email,
      inv.filled_name || "",
      inv.product_slug || "",
      inv.status,
      inv.progress_percent ?? 0,
      inv.sent_at ? formatDate(inv.sent_at) : "",
      inv.expires_at ? formatDate(inv.expires_at) : "",
      inv.used_at ? formatDate(inv.used_at) : "",
      inv.device_lock ? "Yes" : "No",
      inv.single_use ? "Yes" : "No",
      inv.usage_limit ?? "",
      inv.use_count ?? 0,
      assessment?.score ?? "",
      assessment?.tier_name ?? "",
      assessment?.roi_config?.currency ?? "",
      assessment?.roi_results?.annualSavings != null ? Math.round(assessment.roi_results.annualSavings) : "",
      assessment?.roi_results?.ftesReleased != null ? Number(assessment.roi_results.ftesReleased).toFixed(2) : "",
    ];
  });

  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  triggerCsvDownload(csv, `invites-${new Date().toISOString().slice(0, 10)}.csv`);
}

function triggerCsvDownload(csv, filename) {
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// One invite's full picture as a single downloadable CSV: the top-level
// details as key/value rows, then the quiz Q&A and ROI task breakdown (if
// present) as their own labeled blocks below — mirrors everything shown on
// this page, same spirit as the admin email report.
function downloadInviteDetailCsv(invite) {
  const rows = [
    ["Field", "Value"],
    ["Email", invite.email],
    ["Entered Name", invite.filled_name || ""],
    ["Product", invite.product_slug || ""],
    ["Status", invite.status],
    ["Progress %", invite.progress_percent ?? 0],
    ["Allowed Products", invite.allowed_product_slugs?.length ? invite.allowed_product_slugs.join("; ") : "All"],
    ["Device Lock", invite.device_lock ? "Yes" : "No"],
    ["Single Use", invite.single_use ? "Yes" : "No"],
    ["Usage Limit", invite.usage_limit ?? ""],
    ["Times Opened", invite.use_count ?? 0],
    ["Sent At", invite.sent_at ? formatDate(invite.sent_at) : ""],
    ["Expires At", invite.expires_at ? formatDate(invite.expires_at) : ""],
    ["Last Opened At", invite.used_at ? formatDate(invite.used_at) : ""],
  ];

  for (const a of invite.assessment_results || []) {
    rows.push([""], [`Assessment — ${a.product_slug}`]);
    rows.push(["Score", a.score ?? ""]);
    rows.push(["Recommended Tier", a.tier_name || ""]);
    if (a.answers?.length) {
      rows.push([""], ["Question", "Answer"]);
      for (const qa of a.answers) rows.push([`[${qa.dim}] ${qa.question}`, qa.answer]);
    }
    if (a.roi_results) {
      rows.push([""], [`ROI — ${a.product_slug}`]);
      rows.push(["Currency", a.roi_config?.currency || ""]);
      rows.push(["Cost per FTE / Year", a.roi_config?.costPerFte ?? ""]);
      rows.push(["Productive Hours / Month", a.roi_config?.productiveHoursMonth ?? ""]);
      rows.push(["Cost per Hour", Math.round(a.roi_results.hourlyRate) ?? ""]);
      rows.push(["Annual Savings", Math.round(a.roi_results.annualSavings) ?? ""]);
      rows.push(["FTEs Released", Number(a.roi_results.ftesReleased).toFixed(2)]);
      rows.push(["Effort Reduction %", a.roi_results.overallPctReduction ?? ""]);
      if (a.roi_config?.tasks?.length) {
        rows.push([""], ["Task", "Tickets/Month", "Min Manual", "Min Platform"]);
        for (const t of a.roi_config.tasks) rows.push([t.name, t.ticketsPerMonth, t.minManual, t.minSecOps]);
      }
    }
  }

  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  triggerCsvDownload(csv, `invite-${invite.email.replace(/[^a-z0-9]/gi, "_")}.csv`);
}
