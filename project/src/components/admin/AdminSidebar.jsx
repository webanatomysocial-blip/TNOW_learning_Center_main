import { Mail, LayoutGrid, Package, Cookie, ShieldCheck, ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useApiGet } from "@/lib/use-api";
import { useAdminStore } from "@/lib/admin-store";
import { buildAccessRequestQueue } from "@/pages/admin/GrantAccess";

const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: LayoutGrid },
  { to: "/admin/emails", label: "Send Invite", icon: Mail },
  { to: "/admin/progress", label: "Progress Tracking", icon: TrendingUp },
  { to: "/admin/grant-access", label: "Grant Access", icon: ShieldCheck, badgeKey: "grantAccess" },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/cookies", label: "Cookie Consents", icon: Cookie },
];

// Red dot on a nav item when there's something pending an admin's attention —
// currently just device/product access requests, the one workflow in this app
// that an admin can otherwise miss by not opening Grant Access proactively.
function usePendingBadges() {
  const token = useAdminStore((s) => s.token);
  const { data, refetch } = useApiGet("/api/admin/email-invites", { token });
  const invites = data ?? [];

  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      refetch();
    }, 5000); // Poll every 5 seconds to keep notifications active
    return () => clearInterval(interval);
  }, [token, refetch]);

  const grantAccessCount = buildAccessRequestQueue(invites).length;
  return { grantAccess: grantAccessCount };
}

export function AdminSidebar({ isCollapsed, onToggle, isMobileOpen, onMobileClose }) {
  const location = useLocation();
  const badges = usePendingBadges();
  const isActive = (path) =>
    path === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(path);

  return (
    <aside className={`admin-sidebar${isMobileOpen ? " mobile-open" : ""}`}>
      <div className="sidebar-header">
        <Link to="/admin" className="sidebar-brand">
          {isCollapsed ? "TN" : "ToggleNow Experience Center"}
        </Link>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const count = item.badgeKey ? badges[item.badgeKey] : 0;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onMobileClose}
              className={`admin-nav-item ${isActive(item.to) ? "active" : ""}`}
              style={{ position: "relative" }}
            >
              <Icon />
              <span>{item.label}</span>
              {count > 0 && !isCollapsed && (
                <span
                  aria-label={`${count} pending`}
                  style={{
                    marginLeft: "auto",
                    display: "inline-grid",
                    placeItems: "center",
                    minWidth: 20,
                    height: 20,
                    padding: "0 5px",
                    background: "#ef4444",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 700,
                    borderRadius: 999,
                  }}
                >
                  {count}
                </span>
              )}
              {count > 0 && isCollapsed && (
                <span
                  aria-label={`${count} pending`}
                  className="nav-badge-dot"
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#ef4444",
                    border: "1.5px solid var(--sidebar-bg, #0f172a)",
                  }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button
          className="sidebar-toggle-btn"
          onClick={onToggle}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
          {!isCollapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
