import { useEffect, useRef, useState } from "react";
import { Link, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Globe, ChevronDown, LogOut, Menu } from "lucide-react";
import { useAdminStore } from "@/lib/admin-store";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import "@/styles/admin.css";

function pageTitle(pathname) {
  if (pathname === "/admin") return "Sent Emails";
  if (pathname.startsWith("/admin/dashboard")) return "Dashboard Overview";
  if (pathname === "/admin/products") return "Manage Products";
  if (pathname.startsWith("/admin/products/")) return "Product Details";
  return "Admin";
}

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = useAdminStore((s) => s.token);
  const admin = useAdminStore((s) => s.admin);

  const [isCollapsed, setIsCollapsed] = useState(
    () => localStorage.getItem("admin-sidebar-collapsed") === "true",
  );
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  function toggleSidebar() {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("admin-sidebar-collapsed", String(next));
      return next;
    });
  }

  function handleLogout() {
    useAdminStore.getState().logout();
    navigate("/admin/login");
  }

  const initial = (admin?.email || "A")[0].toUpperCase();

  return (
    <div className={`admin-root admin-container ${isCollapsed ? "collapsed" : ""}`}>
      {isMobileOpen && (
        <div className="mobile-sidebar-backdrop" onClick={() => setIsMobileOpen(false)} />
      )}
      <AdminSidebar
        isCollapsed={isCollapsed}
        onToggle={toggleSidebar}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />

      <main className="admin-main">
        <header className="admin-header">
          <div className="header-title">
            <button
              className="mobile-menu-btn"
              onClick={() => setIsMobileOpen((prev) => !prev)}
              aria-label="Open menu"
            >
              <Menu />
            </button>
            <h2>{pageTitle(location.pathname)}</h2>
          </div>

          <div className="header-actions">
            <Link to="/" className="btn-go-website">
              <Globe /> <span>Go to Website</span>
            </Link>

            <div className="header-user" ref={dropdownRef} onClick={() => setShowDropdown((p) => !p)}>
              <div className="user-avatar-circle">{initial}</div>
              <div>
                <div className="user-name">{admin?.email}</div>
                <div className="user-role">Admin</div>
              </div>
              <ChevronDown
                style={{ transform: showDropdown ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
              />

              {showDropdown && (
                <div className="profile-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                  <button className="dropdown-item logout" onClick={handleLogout}>
                    <LogOut /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
