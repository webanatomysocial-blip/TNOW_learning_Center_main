// VITE_API_URL="" (set at build time) means "same origin as the page" — used in
// production where one Node process serves both the API and the built frontend, so
// requests should be relative rather than pointing at a dev-only host:port. An empty
// string must NOT be treated as "unset" here — that's the explicit same-origin case.
//
// When the env var isn't set at all, don't guess a dev-only host:port for production
// builds: hosts like cPanel's Node.js Selector (Passenger) put the app behind
// LiteSpeed and never expose a fixed port like 4000, so that guess would 404 there
// even though the same process is already serving the API. import.meta.env.PROD is
// set by Vite itself at build time regardless of which custom env vars made it
// through, so it's a reliable way to default to same-origin in any production build,
// with the LAN-reachable dev guess (page's hostname on port 4000) only used in dev.
const API_URL =
  import.meta.env.VITE_API_URL !== undefined
    ? import.meta.env.VITE_API_URL
    : import.meta.env.PROD
      ? ""
      : `http://${window.location.hostname}:4000`;

// A 401 on a request that carried an admin token means that token is no longer
// valid (expired past its 7-day life, or the JWT_SECRET was rotated) — not that
// the specific action was denied. Without this, the session doesn't actually
// end: the token stays in localStorage, every admin page keeps trying to use
// it, and the admin just sees a wall of "Couldn't load" errors instead of
// being sent back to log in again. Dynamic import avoids a circular import
// (admin-store.js has no reason to import this file back).
async function endExpiredAdminSession() {
  const { useAdminStore } = await import("@/lib/admin-store");
  useAdminStore.getState().logout();
  if (!window.location.pathname.startsWith("/admin/login")) {
    window.location.assign("/admin/login");
  }
}

async function parseResponse(res, hadToken) {
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    if (res.status === 401 && hadToken) {
      endExpiredAdminSession();
    }
    const message = (data && data.message) || `Request failed with status ${res.status}`;
    const error = new Error(message);
    error.status = res.status;
    error.body = data;
    throw error;
  }

  return data;
}

export async function apiGet(path, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const res = await fetch(`${API_URL}${path}`, { headers });
  return parseResponse(res, !!token);
}

export async function apiSend(path, method, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  return parseResponse(res, !!token);
}

export { API_URL };
