import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Package, Video, Users, Send } from "lucide-react";
import { useApiGet } from "@/lib/use-api";
import { useAdminStore } from "@/lib/admin-store";
import { useDocumentHead } from "@/lib/use-document-head";
import { StatusBadge } from "@/pages/admin/SentEmails";
import { formatDate } from "@/lib/utils";

// The invites table has more granular statuses (used/expired/revoked) than the
// three buckets the dashboard tabs show — everything that isn't still
// "active" or "pending" reads as "inactive" here.
const TABS = [
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
  { key: "pending", label: "Pending" },
];

function bucketOf(status) {
  if (status === "active" || status === "pending") return status;
  return "inactive";
}

export function AdminDashboardPage() {
  useDocumentHead({ meta: [{ title: "Dashboard — Admin" }] });
  const token = useAdminStore((s) => s.token);
  const { data: products } = useApiGet("/api/products");
  const { data: capabilities } = useApiGet("/api/capabilities");
  const { data: stories } = useApiGet("/api/stories");
  const { data: inviteData } = useApiGet("/api/admin/email-invites", { token });
  const invites = useMemo(() => inviteData ?? [], [inviteData]);

  const [activeTab, setActiveTab] = useState("active");

  const counts = useMemo(() => {
    const c = { active: 0, inactive: 0, pending: 0 };
    for (const invite of invites) c[bucketOf(invite.status)] += 1;
    return c;
  }, [invites]);

  const filteredInvites = useMemo(
    () => invites.filter((invite) => bucketOf(invite.status) === activeTab),
    [invites, activeTab],
  );

  const stats = [
    { icon: Package, value: products?.length ?? 0, label: "Products" },
    { icon: Video, value: capabilities?.length ?? 0, label: "Capabilities" },
    { icon: Users, value: stories?.length ?? 0, label: "Customer Stories" },
  ];

  const sendButtonLabel =
    invites.length === 0 ? "Send First Invite Email" : `Send Invite Email (${counts.pending} pending)`;

  return (
    <div className="admin-page-wrapper">
      <div className="admin-header-actions">
        <h1>Dashboard</h1>
        <Link to="/admin/emails" className="btn-primary">
          <Send size={16} /> {sendButtonLabel}
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
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label} ({counts[tab.key]})
            </button>
          ))}
        </div>

        {filteredInvites.length === 0 ? (
          <div className="admin-state">
            <span>No {activeTab} invites.</span>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
