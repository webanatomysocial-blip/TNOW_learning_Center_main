import { useState } from "react";
import { useLocation } from "react-router-dom";
import { getDeviceId } from "@/lib/device-id";
import { apiSend } from "@/lib/api";

const COOKIE_NAME = "tn-cookie-consent";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function hasConsentCookie() {
  return document.cookie.split("; ").some((c) => c.startsWith(`${COOKIE_NAME}=`));
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(() => !hasConsentCookie());
  const { pathname } = useLocation();

  // Scoped to the login page only — not the admin panel, not the rest of the site.
  if (!pathname.startsWith("/login")) return null;
  if (!visible) return null;

  function accept() {
    // A real cookie (not localStorage) so that clearing browser cookies makes this
    // reappear on the next visit — each accept after that logs a fresh row, which is
    // how the admin "times opened" history is derived.
    document.cookie = `${COOKIE_NAME}=1; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
    setVisible(false);
    apiSend("/api/cookie-consent", "POST", { deviceId: getDeviceId() }).catch(() => {});
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col items-center justify-between gap-3 border-t border-border bg-background/95 p-4 backdrop-blur sm:flex-row sm:px-8">
      <p className="text-sm text-muted-foreground">
        We use cookies to keep you signed in and improve your experience. By continuing, you
        agree to our use of cookies.
      </p>
      <button
        type="button"
        onClick={accept}
        className="shrink-0 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
      >
        Accept
      </button>
    </div>
  );
}
