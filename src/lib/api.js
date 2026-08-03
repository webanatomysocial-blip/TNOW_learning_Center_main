// VITE_API_URL="" (set at build time) means "same origin as the page" — used in
// production where one Node process serves both the API and the built frontend, so
// requests should be relative rather than pointing at a dev-only host:port. Only fall
// back to the dev guess (page's hostname on port 4000, so a phone/laptop on the same
// LAN reaches the dev machine's backend, not its own localhost:4000) when the env var
// isn't set at all — an empty string must NOT be treated as "unset" here.
const API_URL =
  import.meta.env.VITE_API_URL !== undefined
    ? import.meta.env.VITE_API_URL
    : `http://${window.location.hostname}:4000`;

async function parseResponse(res) {
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
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
  return parseResponse(res);
}

export async function apiSend(path, method, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  return parseResponse(res);
}

export { API_URL };
