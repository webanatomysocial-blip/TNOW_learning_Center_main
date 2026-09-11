const KEY = "tn-visitor-name";

// Once a visitor types their name on the login screen it's kept for this
// browser so they're never asked to re-type or edit it on a later visit.
// Adding an optional scope (e.g. invite code) to prevent name leak across different links.
export function getStoredName(scope) {
  if (scope) {
    return localStorage.getItem(`${KEY}-${scope}`) || "";
  }
  return localStorage.getItem(KEY) || "";
}

export function setStoredName(name, scope) {
  if (name) {
    localStorage.setItem(KEY, name);
    if (scope) {
      localStorage.setItem(`${KEY}-${scope}`, name);
    }
  }
}
