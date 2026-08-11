import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Cookie, XCircle } from "lucide-react";
import { useApiGet } from "@/lib/use-api";
import { useAdminStore } from "@/lib/admin-store";
import { useDocumentHead } from "@/lib/use-document-head";
import { formatDate } from "@/lib/utils";

export function CookieConsentsPage() {
  useDocumentHead({ meta: [{ title: "Cookie Consents — Admin" }] });
  const token = useAdminStore((s) => s.token);
  const { data, isLoading, isError } = useApiGet("/api/admin/cookie-consents", { token });
  const rows = data ?? [];

  return (
    <div className="admin-page-wrapper">
      <div className="admin-header-actions">
        <h1>Cookie Consents</h1>
      </div>

      <div className="admin-card" style={{ padding: 0 }}>
        {isLoading ? (
          <div className="admin-state">
            <div className="admin-spinner" />
            <span>Loading…</span>
          </div>
        ) : isError ? (
          <div className="admin-state is-error">
            <div className="admin-state-icon">
              <XCircle size={20} />
            </div>
            <span>Couldn't load cookie consents.</span>
          </div>
        ) : rows.length === 0 ? (
          <div className="admin-state">
            <div className="admin-state-icon">
              <Cookie size={20} />
            </div>
            <span>No cookie consents recorded yet.</span>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Device</th>
                  <th>Email</th>
                  <th>Times Opened</th>
                  <th>First Consented</th>
                  <th>Last Consented</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.device_id}>
                    <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{row.device_id}</td>
                    <td>{row.email || "—"}</td>
                    <td>{row.times_opened}</td>
                    <td>{formatDate(row.first_consented_at)}</td>
                    <td>{formatDate(row.last_consented_at)}</td>
                    <td style={{ textAlign: "right" }}>
                      <Link className="btn-secondary" to={`/admin/cookies/${row.device_id}`}>
                        View Details
                      </Link>
                    </td>
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

export function CookieConsentDetailsPage() {
  useDocumentHead({ meta: [{ title: "Cookie Consent History — Admin" }] });
  const { deviceId } = useParams();
  const token = useAdminStore((s) => s.token);
  const { data, isLoading, isError } = useApiGet(`/api/admin/cookie-consents/${deviceId}`, { token });
  const rows = data ?? [];

  return (
    <div className="admin-page-wrapper">
      <div className="admin-header-actions">
        <Link to="/admin/cookies" className="btn-secondary">
          <ArrowLeft size={16} /> Back to Cookie Consents
        </Link>
      </div>

      <div className="admin-card">
        <h1>Consent history</h1>
        <p style={{ color: "var(--slate-500)", fontSize: "0.85rem", marginTop: 4, fontFamily: "monospace" }}>
          {deviceId}
        </p>

        {isLoading ? (
          <div className="admin-state">
            <div className="admin-spinner" />
            <span>Loading…</span>
          </div>
        ) : isError ? (
          <div className="admin-state is-error">
            <div className="admin-state-icon">
              <XCircle size={20} />
            </div>
            <span>Couldn't load history.</span>
          </div>
        ) : (
          <div className="admin-table-wrapper" style={{ marginTop: 16 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Email</th>
                  <th>Consented At</th>
                  <th>User Agent</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.id}>
                    <td>{rows.length - i}</td>
                    <td>{row.email || "—"}</td>
                    <td>{formatDate(row.consented_at)}</td>
                    <td style={{ fontSize: "0.78rem", color: "var(--slate-500)" }}>{row.user_agent || "—"}</td>
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
