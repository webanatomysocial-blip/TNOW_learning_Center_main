import { useMemo, useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Package,
  Video,
  Users,
  Send,
  MoreVertical,
  Eye,
  ShieldCheck,
  RotateCcw,
  XCircle,
  Trash2,
  Smartphone,
  CheckCircle2,
  Search,
  Filter,
} from "lucide-react";
import { useApiGet } from "@/lib/use-api";
import { apiSend } from "@/lib/api";
import { useAdminStore } from "@/lib/admin-store";
import { useDocumentHead } from "@/lib/use-document-head";
import { StatusBadge } from "@/pages/admin/SentEmails";
import { buildAccessRequestQueue } from "@/pages/admin/GrantAccess";
import { formatDate } from "@/lib/utils";

// The invites table has more granular statuses (used/expired/revoked) than the
// three buckets the dashboard tabs show — everything that isn't still
// "active" or "pending" reads as "inactive" here.
const TABS = [
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
  { key: "pending", label: "Pending" },
  { key: "grant-access", label: "Grant Access" },
];

function bucketOf(status) {
  if (status === "active" || status === "pending") return status;
  return "inactive";
}

export function AdminDashboardPage() {
  useDocumentHead({ meta: [{ title: "Dashboard — Admin" }] });
  const token = useAdminStore((s) => s.token);
  const navigate = useNavigate();
  const { data: products } = useApiGet("/api/products");
  const { data: capabilities } = useApiGet("/api/capabilities");
  const { data: stories } = useApiGet("/api/stories");
  const { data: inviteData, refetch } = useApiGet("/api/admin/email-invites", { token });
  const invites = useMemo(() => inviteData ?? [], [inviteData]);

  const [activeTab, setActiveTab] = useState("active");
  const [search, setSearch] = useState("");
  const [productFilter, setProductFilter] = useState("all");
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
    const MENU_HEIGHT = itemCount * 38 + 12;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top =
      spaceBelow >= MENU_HEIGHT + 6
        ? rect.bottom + 6
        : Math.max(8, rect.top - MENU_HEIGHT - 6);
    const left = Math.max(8, Math.min(rect.right - 180, window.innerWidth - 188));
    setMenuPos({ top, left });
    setMenuFor(invite.id);
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

  const accessQueue = useMemo(() => buildAccessRequestQueue(invites), [invites]);

  const filteredAccessQueue = useMemo(() => {
    return accessQueue.filter((item) => {
      const invite = item.invite;
      const matchesSearch =
        (invite.email || "").toLowerCase().includes(search.toLowerCase()) ||
        (invite.filled_name || "").toLowerCase().includes(search.toLowerCase());
      const matchesProduct =
        productFilter === "all" ||
        invite.product_slug === productFilter ||
        item.productSlug === productFilter;
      return matchesSearch && matchesProduct;
    });
  }, [accessQueue, search, productFilter]);

  const counts = useMemo(() => {
    const c = { active: 0, inactive: 0, pending: 0 };
    for (const invite of invites) c[bucketOf(invite.status)] += 1;
    c["grant-access"] = accessQueue.length;
    return c;
  }, [invites, accessQueue]);

  const uniqueProducts = useMemo(() => {
    const slugs = invites.map((i) => i.product_slug).filter(Boolean);
    return ["all", ...Array.from(new Set(slugs))];
  }, [invites]);

  const filteredInvites = useMemo(() => {
    return invites.filter((invite) => {
      const matchesTab = bucketOf(invite.status) === activeTab;
      const matchesSearch =
        (invite.email || "").toLowerCase().includes(search.toLowerCase()) ||
        (invite.filled_name || "").toLowerCase().includes(search.toLowerCase());
      const matchesProduct = productFilter === "all" || invite.product_slug === productFilter;
      return matchesTab && matchesSearch && matchesProduct;
    });
  }, [invites, activeTab, search, productFilter]);

  async function handleApproveRequest(item) {
    try {
      if (item.type === "device") {
        await apiSend(`/api/admin/email-invites/${item.invite.id}/grant-access`, "POST", undefined, token);
      } else {
        await apiSend(
          `/api/admin/email-invites/${item.invite.id}/product-access/${item.productSlug}/approve`,
          "POST",
          undefined,
          token,
        );
      }
      refetch();
    } catch (err) {
      window.alert(err.message || "Failed to grant access.");
    }
  }

  const stats = [
    { icon: Package, value: products?.length ?? 0, label: "Products" },
    { icon: Video, value: capabilities?.length ?? 0, label: "Capabilities" },
    { icon: Users, value: stories?.length ?? 0, label: "Customer Stories" },
  ];

  return (
    <div className="admin-page-wrapper">
      <div className="admin-header-actions">
        <h1>Dashboard</h1>
        <Link to="/admin/emails" className="btn-primary">
          <Send size={16} /> Send Invite Emails
        </Link>
      </div>

      <div className="dashboard-grid">
        {stats.map((s) => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon">
              <s.icon />
            </div>
            <div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-card" style={{ padding: 0, marginTop: 24 }}>
        <div style={{ display: "flex", gap: 4, padding: "12px 16px 0" }}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`btn-secondary${activeTab === tab.key ? " active" : ""}`}
              style={{
                borderRadius: "8px 8px 0 0",
                borderBottom: activeTab === tab.key ? "2px solid var(--primary-blue)" : "2px solid transparent",
                fontWeight: activeTab === tab.key ? 700 : 600,
              }}
              onClick={(e) => {
                e.preventDefault();
                setActiveTab(tab.key);
              }}
            >
              {tab.label} ({counts[tab.key]})
            </button>
          ))}
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

        {activeTab === "grant-access" ? (
          filteredAccessQueue.length === 0 ? (
            <div className="admin-state">
              <div className="admin-state-icon">
                <CheckCircle2 size={20} />
              </div>
              <span>No pending access requests.</span>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredAccessQueue.map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-4 px-4 py-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="grid size-9 shrink-0 place-items-center rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                      {item.type === "device" ? <Smartphone size={16} /> : <Package size={16} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{item.invite.email}</p>
                      <p className="text-[13px] text-gray-500">
                        {item.label} — requested {formatDate(item.requestedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to={`/admin/emails/${item.invite.id}`}
                      state={{ from: "/admin" }}
                      className="px-3.5 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      View Invite
                    </Link>
                    <button
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:opacity-90 transition"
                      onClick={() => handleApproveRequest(item)}
                    >
                      <ShieldCheck size={14} /> Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : filteredInvites.length === 0 ? (
          <div className="admin-state">
            <span>No matching {activeTab} invites found.</span>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Product</th>
                  <th>Status</th>
                  <th>Sent At</th>
                  <th>Expires At</th>
                  <th style={{ width: 80, textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvites.map((invite) => (
                  <tr key={invite.id}>
                    <td>{invite.email}</td>
                    <td style={{ textTransform: "uppercase", fontSize: "0.85rem", fontWeight: 600, color: "var(--slate-600)" }}>
                      {invite.product_slug || "—"}
                    </td>
                    <td>
                      <StatusBadge status={invite.status} />
                    </td>
                    <td>{formatDate(invite.sent_at)}</td>
                    <td>{formatDate(invite.expires_at)}</td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                        style={{ border: "none", background: "none", cursor: "pointer", borderRadius: 8, padding: 4 }}
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
              style={{ position: "fixed", top: menuPos.top, left: menuPos.left, minWidth: 160, backgroundColor: "#ffffff", borderRadius: 12, boxShadow: "0 10px 40px rgba(0,0,0,0.1)", border: "1px solid #f1f5f9", padding: "6px 0", zIndex: 1000 }}
            >
              <button
                className="w-full px-4 py-2 text-left text-[13px] font-medium text-gray-700 hover:bg-gray-50 hover:text-primary flex items-center gap-2 transition-colors"
                style={{ border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", width: "100%", textAlign: "left", fontSize: "0.85rem", color: "#475569" }}
                onClick={() => {
                  navigate(`/admin/emails/${invite.id}`, { state: { from: "/admin" } });
                  setMenuFor(null);
                }}
              >
                <Eye size={15} /> View Details
              </button>
              {invite.access_requested_at && (
                <button
                  className="dropdown-item"
                  style={{ border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", width: "100%", textAlign: "left", fontSize: "0.85rem", color: "#475569" }}
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
                style={{ border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", width: "100%", textAlign: "left", fontSize: "0.85rem", color: "#475569" }}
                onClick={() => {
                  handleResend(invite);
                  setMenuFor(null);
                }}
              >
                <RotateCcw size={15} /> Resend
              </button>
              <button
                className="w-full px-4 py-2 text-left text-[13px] font-medium text-gray-700 hover:bg-gray-50 hover:text-red-600 flex items-center gap-2 transition-colors"
                style={{ border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", width: "100%", textAlign: "left", fontSize: "0.85rem", color: "#475569" }}
                onClick={() => {
                  handleRevoke(invite);
                  setMenuFor(null);
                }}
              >
                <XCircle size={15} /> Revoke
              </button>
              <div style={{ height: 1, backgroundColor: "#f1f5f9", margin: "4px 0" }}></div>
              <button
                className="w-full px-4 py-2 text-left text-[13px] font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                style={{ border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", width: "100%", textAlign: "left", fontSize: "0.85rem", color: "#dc2626" }}
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
