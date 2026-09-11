import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Cookie, X } from "lucide-react";
import { getDeviceId } from "@/lib/device-id";
import { apiSend } from "@/lib/api";

const COOKIE_NAME = "tn-cookie-consent";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

// "1" = accepted, "0" = explicitly declined, absent = never responded yet.
function getConsentValue() {
  const match = document.cookie.split("; ").find((c) => c.startsWith(`${COOKIE_NAME}=`));
  return match ? match.split("=")[1] : null;
}

function setConsentValue(value) {
  document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function CookieConsentBanner() {
  const initialConsent = getConsentValue();
  // Popup starts open only on a true first visit (no cookie at all yet) — a
  // past decline keeps the small reopen button around instead of nagging
  // again on every page load.
  const [popupOpen, setPopupOpen] = useState(initialConsent === null);
  const [consent, setConsent] = useState(initialConsent);
  const { pathname } = useLocation();

  // Scoped to the login page only — not the admin panel, not the rest of the site.
  if (!pathname.startsWith("/login")) return null;
  if (consent === "1") return null;

  function accept() {
    setConsentValue("1");
    setConsent("1");
    setPopupOpen(false);
    // A real cookie write (not localStorage) so that clearing browser cookies makes
    // this reappear on the next visit — each accept after that logs a fresh row,
    // which is how the admin "times opened" history is derived. Declining is
    // deliberately not logged here — there's nothing to record consent for.
    apiSend("/api/cookie-consent", "POST", { deviceId: getDeviceId() }).catch(() => {});
  }

  function decline() {
    setConsentValue("0");
    setConsent("0");
    setPopupOpen(false);
  }

  if (!popupOpen) {
    return (
      <button
        type="button"
        onClick={() => setPopupOpen(true)}
        aria-label="Cookie preferences"
        className="fixed bottom-5 left-5 z-50 grid size-11 place-items-center rounded-full bg-foreground text-background shadow-lg transition hover:scale-105"
      >
        <Cookie className="size-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 left-5 z-50 w-[min(360px,calc(100vw-2.5rem))] rounded-2xl border border-border bg-background p-5 shadow-2xl">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Cookie className="size-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Cookie notice</h2>
        </div>
        {consent !== null && (
          <button
            type="button"
            onClick={() => setPopupOpen(false)}
            aria-label="Close"
            className="text-caption hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        We set one essential cookie to remember this choice — nothing else. Your sign-in itself is
        kept in your browser's local storage, not cookies, and we don't use any tracking or
        advertising cookies.
      </p>
      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={accept}
          className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          Accept
        </button>
        <button
          type="button"
          onClick={decline}
          className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-surface-alt"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
