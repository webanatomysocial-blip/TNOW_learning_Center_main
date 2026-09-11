import { Navigate, Link } from "react-router-dom";
import { useExperience } from "@/lib/experience-store";
import { useEffect, useState } from "react";
import { apiGet, apiSend } from "@/lib/api";

// Blocks direct/deep-link access to the experience pages — only users who've
// actually signed in via a /login/:code invite link get past this.
export function RequireExperienceAuth({ children }) {
  const user = useExperience((s) => s.user);
  const inviteId = useExperience((s) => s.inviteId);
  const resetExperience = useExperience((s) => s.reset);
  
  const [localInviteId] = useState(inviteId);
  const [revoked, setRevoked] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [requested, setRequested] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!inviteId) return;
    const check = () => {
      apiGet(`/api/invites/${inviteId}/status`)
        .then((data) => {
          if (data?.status === "revoked" || data?.status === "expired") {
            setRevoked(true);
            resetExperience();
          }
        })
        .catch((err) => {
          // A 404 means the invite row itself is gone — its body still says
          // {status:"revoked"}, so treat it the same as a live "revoked" response.
          if (err?.status === 404) {
            setRevoked(true);
            resetExperience();
          }
        });
    };
    check();
    const id = setInterval(check, 5000);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);

    return () => {
      clearInterval(id);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [inviteId, resetExperience]);

  const handleRequestAccess = async () => {
    if (!localInviteId) {
      setErrorMsg("No invite ID found. Please try opening your link again.");
      return;
    }
    setRequesting(true);
    setErrorMsg("");
    try {
      await apiSend(`/api/invites/${localInviteId}/request-access`, "POST", { email: user?.email });
      setRequested(true);
    } catch (err) {
      console.error("Request access error:", err);
      setErrorMsg(err.message || "Failed to send request. Please try again.");
    } finally {
      setRequesting(false);
    }
  };

  if (!user || revoked) {
    if (revoked) {
      return (
        <main className="min-h-dvh bg-background text-foreground flex items-center justify-center px-6">
          <div className="w-full max-w-sm">
            <div className="flex items-center justify-center mb-8">
              <img src="/logo.png" alt="ToggleNow" className="h-8 w-auto object-contain" />
            </div>
            <div className="rounded-2xl border border-border bg-background p-8 shadow-soft text-center">
              <h1 className="font-display text-xl font-semibold tracking-tight mb-2">
                Access revoked
              </h1>
              <p className="text-[15px] text-muted-foreground mb-6">
                Your access to this link has been revoked by the admin.
              </p>
              {errorMsg && (
                <p className="text-xs text-red-500 mb-4 font-medium">{errorMsg}</p>
              )}
              {requested ? (
                <p className="text-sm text-primary">
                  Request sent — we'll get back to you once access is granted.
                </p>
              ) : (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleRequestAccess}
                    disabled={requesting || !localInviteId}
                    className="btn-primary w-full disabled:opacity-60"
                  >
                    {requesting ? "Sending…" : "Request access"}
                  </button>
                  <Link to="/" className="block text-sm text-primary hover:underline">
                    Back to home
                  </Link>
                </div>
              )}
            </div>
          </div>
        </main>
      );
    }
    return <Navigate to="/" replace />;
  }

  return children;
}
