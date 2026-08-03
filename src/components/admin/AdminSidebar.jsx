import { Mail, LayoutGrid, Package, ChevronLeft, ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: LayoutGrid },
  { to: "/admin/emails", label: "Sent Emails", icon: Mail },
  { to: "/admin/products", label: "Products", icon: Package },
];

export function AdminSidebar({ isCollapsed, onToggle, isMobileOpen, onMobileClose }) {
  const location = useLocation();
  const isActive = (path) =>
    path === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(path);

  return (
    <aside className={`admin-sidebar${isMobileOpen ? " mobile-open" : ""}`}>
      <div className="sidebar-header">
        <Link to="/admin" className="sidebar-brand">
          {isCollapsed ? "TN" : "ToggleNow CMS"}
        </Link>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onMobileClose}
              className={`admin-nav-item ${isActive(item.to) ? "active" : ""}`}
            >
              <Icon />
              <span>{item.label}</span>
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
