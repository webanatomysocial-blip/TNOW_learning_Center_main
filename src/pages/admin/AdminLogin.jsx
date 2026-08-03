import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { apiSend } from "@/lib/api";
import { useAdminStore } from "@/lib/admin-store";
import { useDocumentHead } from "@/lib/use-document-head";
import "@/styles/admin.css";

export function AdminLoginPage() {
  useDocumentHead({ meta: [{ title: "Admin Login — ToggleNow CMS" }] });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { token } = await apiSend("/api/admin/login", "POST", { email, password });
      useAdminStore.getState().setSession(token, { email });
      navigate("/admin");
    } catch (err) {
      setError(err.status === 401 ? "Invalid email or password." : err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-root admin-login-wrapper">
      <div className="admin-login-box">
        <div className="admin-login-brand">ToggleNow CMS</div>
        <h2>Admin Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="form-control"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@togglenow.com"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-control"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p style={{ color: "var(--error-red)", fontSize: "0.85rem", marginBottom: 12 }}>
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%" }}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
