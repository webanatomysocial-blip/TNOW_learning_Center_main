import { Navigate, Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAdminStore } from "@/lib/admin-store";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { to: "/admin", label: "Products" },
  { to: "/admin/capabilities", label: "Capabilities" },
  { to: "/admin/stories", label: "Stories" },
];

export function RequireAdmin() {
  const token = useAdminStore((s) => s.token);

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  return <AdminLayout />;
}

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const admin = useAdminStore((s) => s.admin);

  function handleLogout() {
    useAdminStore.getState().logout();
    navigate("/admin/login");
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <span className="font-display text-lg font-semibold text-foreground">
              ToggleNow Experience Center
            </span>
            <nav className="flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    location.pathname === link.to
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {admin?.email && (
              <span className="text-sm text-muted-foreground">{admin.email}</span>
            )}
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Log out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
