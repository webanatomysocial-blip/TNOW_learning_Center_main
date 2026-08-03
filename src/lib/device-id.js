const KEY = "tn-device-id";

// A per-browser opaque identifier used as a lightweight device fingerprint for
// magic-login links. Deliberately stored in localStorage rather than a cookie
// to avoid cross-origin cookie issues between the Vite dev server and the API.
export function getDeviceId() {
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}
