import { useEffect, useState } from "react";
import { Monitor } from "lucide-react";

const MOBILE_BREAKPOINT = 768; // matches Tailwind's `md` — anything narrower is blocked

function isMobileViewport() {
  return typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT;
}

// Blocks the ENTIRE app — including /login and /admin/login — below the
// desktop breakpoint, rather than trying to make every page (magic-link auth,
// the admin CMS, the guided experience) responsive. Re-checks on resize/
// rotate so a tablet turned sideways past the breakpoint unblocks live,
// without a reload.
export function MobileGate({ children }) {
  const [isMobile, setIsMobile] = useState(isMobileViewport);

  useEffect(() => {
    function handleResize() {
      setIsMobile(isMobileViewport());
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!isMobile) return children;

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "32px 24px",
        background: "#0f172a",
        color: "#fff",
        fontFamily: "inherit",
      }}
    >
      <div
        style={{
          display: "grid",
          placeItems: "center",
          width: 56,
          height: 56,
          borderRadius: 16,
          background: "rgba(255,255,255,0.08)",
          marginBottom: 20,
        }}
      >
        <Monitor size={26} />
      </div>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: "#fff" }}>Best viewed on desktop</h1>
      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", maxWidth: 320, lineHeight: 1.6 }}>
        ToggleNow Experience Center is designed for larger screens. Please open this link on a
        desktop or laptop computer to continue.
      </p>
    </div>
  );
}
