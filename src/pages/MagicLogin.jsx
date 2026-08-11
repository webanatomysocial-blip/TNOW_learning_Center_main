import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ShieldCheck, LockSimple, Buildings, SealCheck } from "@phosphor-icons/react";
import { apiGet, apiSend } from "@/lib/api";
import { getDeviceId } from "@/lib/device-id";
import { useExperience } from "@/lib/experience-store";
import { useDocumentHead } from "@/lib/use-document-head";

function capitalize(s) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function MagicLoginPage() {
  useDocumentHead({ meta: [{ title: "Sign in — ToggleNow Experience Center" }] });
  const { code } = useParams();
  const navigate = useNavigate();
  const setUser = useExperience((s) => s.setUser);
  const setInviteId = useExperience((s) => s.setInviteId);
  const reset = useExperience((s) => s.reset);

  const [linkState, setLinkState] = useState("loading"); // loading | valid | invalid | device-locked
  const [linkMessage, setLinkMessage] = useState("");
  const [accessRequested, setAccessRequested] = useState(false);
  const [requestingAccess, setRequestingAccess] = useState(false);

  const [name, setName] = useState("");
  const [isNameModified, setIsNameModified] = useState(false);
  const [email, setEmail] = useState("");
  const [securityCode, setSecurityCode] = useState("");
  const [stage, setStage] = useState("details"); // details | code
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [detailsError, setDetailsError] = useState("");
  const [checkingEmail, setCheckingEmail] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const deviceId = getDeviceId();

    apiGet(`/api/magic/${code}?deviceId=${encodeURIComponent(deviceId)}`)
      .then(() => {
        if (cancelled) return;
        setLinkState("valid");
      })
      .catch((err) => {
        if (cancelled) return;
        setLinkMessage(err.message || "This link is invalid.");
        setLinkState("invalid");
      });

    return () => {
      cancelled = true;
    };
  }, [code]);

  function handleEmailChange(val) {
    setEmail(val);
    setDetailsError("");
    if (!isNameModified && val) {
      const candidate = val
        .split("@")[0]
        .replace(/[0-9]/g, "")
        .replace(/grc|basis|sap|it|admin|dev/gi, "")
        .replace(/[._]/g, " ")
        .trim();
      const cleanCandidate =
        candidate.length > 1 ? candidate : val.split("@")[0].replace(/[._]/g, " ");
      setName(capitalize(cleanCandidate));
    }
  }

  async function handleContinue(e) {
    e.preventDefault();
    if (!email || !name) return;
    setDetailsError("");
    setCheckingEmail(true);
    try {
      const res = await apiSend(`/api/magic/${code}/check-email`, "POST", { email });
      if (!res.matches) {
        setDetailsError("This invite wasn't sent to that email address.");
        return;
      }
      setFormError("");
      setStage("code");
    } catch (err) {
      if (err.status === 404 || err.status === 410) {
        setLinkMessage(err.message || "This link is no longer available.");
        setLinkState("invalid");
      } else {
        setDetailsError(err.message || "Couldn't verify that email. Please try again.");
      }
    } finally {
      setCheckingEmail(false);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    setLoading(true);
    setFormError("");
    try {
      const deviceId = getDeviceId();
      const res = await apiSend(`/api/magic/${code}/consume`, "POST", {
        deviceId,
        email,
        name: name.trim(),
        securityCode: securityCode.trim(),
      });
      reset();
      setUser({ email: res.email, name: name.trim() || "Guest User" });
      setInviteId(res.inviteId ?? null);
      navigate("/experience");
    } catch (err) {
      if (err.status === 401 || err.status === 400) {
        setFormError(err.message || "That didn't match. Please try again.");
      } else if (err.status === 403 && err.body?.deviceLocked) {
        setLinkMessage(err.message || "This link was opened on a different device and can no longer be used here.");
        setLinkState("device-locked");
      } else {
        setLinkMessage(err.message || "This link could not be used.");
        setLinkState("invalid");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestAccess() {
    setRequestingAccess(true);
    try {
      await apiSend(`/api/magic/${code}/request-access`, "POST");
      setAccessRequested(true);
    } catch {
      // best-effort — the message below still tells them what to do
      setAccessRequested(true);
    } finally {
      setRequestingAccess(false);
    }
  }

  if (linkState === "loading") {
    return (
      <main className="min-h-dvh bg-background text-foreground flex items-center justify-center px-6">
        <p className="text-sm text-caption">Checking your link…</p>
      </main>
    );
  }

  if (linkState === "invalid") {
    return (
      <main className="min-h-dvh bg-background text-foreground flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-center mb-8">
            <img src="/logo.png" alt="ToggleNow" className="h-8 w-auto object-contain" />
          </div>
          <div className="rounded-2xl border border-border bg-background p-8 shadow-soft text-center">
            <h1 className="font-display text-xl font-semibold tracking-tight mb-2">
              Link unavailable
            </h1>
            <p className="text-[15px] text-muted-foreground mb-6">{linkMessage}</p>
            <Link to="/" className="text-sm text-primary hover:underline">
              Back to home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (linkState === "device-locked") {
    return (
      <main className="min-h-dvh bg-background text-foreground flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-center mb-8">
            <img src="/logo.png" alt="ToggleNow" className="h-8 w-auto object-contain" />
          </div>
          <div className="rounded-2xl border border-border bg-background p-8 shadow-soft text-center">
            <h1 className="font-display text-xl font-semibold tracking-tight mb-2">
              Different device detected
            </h1>
            <p className="text-[15px] text-muted-foreground mb-6">{linkMessage}</p>
            {accessRequested ? (
              <p className="text-sm text-primary">
                Request sent — we'll get back to you once access is granted.
              </p>
            ) : (
              <button
                type="button"
                onClick={handleRequestAccess}
                disabled={requestingAccess}
                className="btn-primary w-full disabled:opacity-60"
              >
                {requestingAccess ? "Sending…" : "Request access"}
              </button>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="grid min-h-dvh lg:grid-cols-5">
        {/* Left — Showcase */}
        <aside
          className="relative hidden lg:col-span-3 lg:flex flex-col items-center justify-center p-14 overflow-hidden select-none"
          style={{
            backgroundColor: "#2054E3",
            background:
              "radial-gradient(circle at bottom right, rgba(244, 114, 182, 0.45) 0%, rgba(192, 132, 252, 0.45) 25%, rgba(37, 99, 235, 0) 70%), radial-gradient(circle at top left, rgba(56, 189, 248, 0.5) 0%, rgba(37, 99, 235, 0) 60%), #2054E3",
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay"
            style={{
              backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.25) 1px, transparent 1px),
                               linear-gradient(to bottom, rgba(255, 255, 255, 0.25) 1px, transparent 1px)`,
              backgroundSize: "90px 90px",
              backgroundPosition: "center center",
            }}
          />
          <div
            className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-white/10 p-10 shadow-2xl backdrop-blur-md flex flex-col justify-between"
            style={{ borderRadius: 24 }}
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-8 text-white" weight="fill" />
              <span className="font-sans text-xl font-semibold tracking-tight text-white">
                ToggleNow
              </span>
            </div>
            <blockquote className="mt-14 text-lg md:text-[21px] text-white/90 leading-relaxed font-sans font-light tracking-wide">
              “You've been personally invited to explore your{" "}
              <strong className="font-semibold text-white">SAP Security & Governance</strong>{" "}
              briefing.”
            </blockquote>
          </div>
        </aside>

        {/* Right — Form */}
        <section className="flex flex-col justify-between px-6 py-10 lg:col-span-2 lg:px-14">
          <div className="mx-auto flex h-full w-full max-w-sm flex-col justify-between gap-12">
            <div className="flex items-center">
              <img src="/logo.png" alt="ToggleNow" className="h-8 w-auto object-contain" />
            </div>

            <div className="w-full">
              <p className="mb-3 text-xs font-medium uppercase tracking-widest text-caption">
                Experience Center
              </p>
              <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">
                You're invited to sign in
              </h1>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                Confirm your details, then enter the security code from your invite email.
              </p>

              <div className="mt-8 rounded-2xl border border-border bg-background p-6 shadow-soft">
                {stage === "details" ? (
                  <form onSubmit={handleContinue} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-foreground">Your Name</label>
                      <input
                        type="text"
                        required
                        autoFocus
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          setIsNameModified(true);
                        }}
                        placeholder="e.g. Sarah"
                        className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-[15px] outline-none transition placeholder:text-caption focus:border-primary focus:ring-2 focus:ring-primary/15"
                        style={{ borderRadius: 16 }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-foreground">
                        Work email
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => handleEmailChange(e.target.value)}
                        placeholder="you@company.com"
                        className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-[15px] outline-none transition placeholder:text-caption focus:border-primary focus:ring-2 focus:ring-primary/15"
                        style={{ borderRadius: 16 }}
                      />
                    </div>
                    {detailsError && <p className="text-sm text-destructive">{detailsError}</p>}
                    <button
                      type="submit"
                      disabled={!email || !name || checkingEmail}
                      className="btn-primary w-full disabled:opacity-60"
                    >
                      {checkingEmail ? "Checking…" : "Continue"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerify} className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-foreground">
                          Security code
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setStage("details");
                            setFormError("");
                          }}
                          className="text-xs text-caption hover:text-foreground"
                        >
                          Change details
                        </button>
                      </div>
                      <input
                        inputMode="numeric"
                        autoFocus
                        maxLength={6}
                        value={securityCode}
                        onChange={(e) => setSecurityCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="6-digit code"
                        className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-center text-lg tracking-[0.5em] outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                        style={{ borderRadius: 16 }}
                      />
                    </div>
                    <p className="text-xs text-caption">
                      Check the invite email sent to <span className="text-foreground">{email}</span>{" "}
                      for your security code.
                    </p>
                    {formError && <p className="text-sm text-destructive">{formError}</p>}
                    <button
                      type="submit"
                      disabled={loading || securityCode.length < 6}
                      className="btn-primary w-full disabled:opacity-60"
                    >
                      {loading ? "Verifying…" : "Verify & enter"}
                    </button>
                  </form>
                )}

                <ul className="mt-6 grid grid-cols-2 gap-3 text-xs text-caption">
                  {[
                    { icon: SealCheck, label: "SAP Certified Partner" },
                    { icon: LockSimple, label: "Secure session" },
                    { icon: ShieldCheck, label: "Private experience" },
                    { icon: Buildings, label: "Prepared for your company" },
                  ].map((t) => (
                    <li key={t.label} className="flex items-center gap-2">
                      <t.icon className="size-3.5 text-primary" weight="bold" />
                      {t.label}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <p className="text-xs text-caption">
              © {new Date().getFullYear()} ToggleNow · SAP Security & Governance
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
