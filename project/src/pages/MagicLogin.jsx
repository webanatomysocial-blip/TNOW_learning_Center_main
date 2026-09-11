import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldCheck,
  LockSimple,
  Buildings,
  SealCheck,
  User,
  Compass,
  ChatCircleDots,
  CalendarCheck,
  ArrowRight,
  Fingerprint,
  FileText,
  Briefcase,
  MapPin,
  IdentificationCard,
  Fire,
  ListChecks,
  Gauge,
  Robot,
} from "@phosphor-icons/react";
import { apiGet, apiSend } from "@/lib/api";
import { useApiGet } from "@/lib/use-api";
import { getDeviceId } from "@/lib/device-id";
import { getStoredName, setStoredName } from "@/lib/visitor-name";
import { useExperience } from "@/lib/experience-store";
import { useDocumentHead } from "@/lib/use-document-head";

const PRODUCT_ICON_MAP = {
  secops: ShieldCheck,
  fftrust: Fire,
  reviewnow: ListChecks,
  gams360: Gauge,
  digybots: Robot,
};

const DEFAULT_PRODUCTS = [
  { id: "secops", name: "SecOps", tagline: "SAP Security Operations, automated." },
  { id: "fftrust", name: "FF Trust", tagline: "Firefighter access with zero blind spots." },
  { id: "reviewnow", name: "ReviewNow", tagline: "Access recertification without spreadsheets." },
  { id: "gams360", name: "GAMS360", tagline: "Governance, Access & Monitoring, unified." },
  { id: "digybots", name: "Digybots", tagline: "Intelligent bots for SAP operations." },
];

// Shortest signed distance from `active` to `index` around a ring of length `count`
function ringOffset(index, active, count) {
  let diff = index - active;
  if (diff > count / 2) diff -= count;
  if (diff < -count / 2) diff += count;
  return diff;
}

export function MagicLoginPage() {
  useDocumentHead({ meta: [{ title: "Sign in — ToggleNow Experience Center" }] });
  const { code } = useParams();
  const navigate = useNavigate();
  const setUser = useExperience((s) => s.setUser);
  const setInviteId = useExperience((s) => s.setInviteId);
  const reset = useExperience((s) => s.reset);

  const { data: fetchedProducts } = useApiGet("/api/products");
  const rawProducts = Array.isArray(fetchedProducts) && fetchedProducts.length > 0 ? fetchedProducts : DEFAULT_PRODUCTS;
  const products = rawProducts.map((p) => {
    const rawKey = p ? (p.id != null ? p.id : p.slug != null ? p.slug : "") : "";
    const key = String(rawKey).toLowerCase();
    return {
      ...p,
      icon: PRODUCT_ICON_MAP[key] || ShieldCheck,
    };
  });

  const [linkState, setLinkState] = useState("loading"); // loading | valid | invalid | device-locked
  const [linkMessage, setLinkMessage] = useState("");
  const [linkReason, setLinkReason] = useState("");
  const [accessRequested, setAccessRequested] = useState(false);
  const [requestingAccess, setRequestingAccess] = useState(false);

  // Once a name has been stored for this browser it's never asked for or
  // editable again — the form below just skips rendering that field.
  const storedName = getStoredName(code);
  const [name, setName] = useState(storedName);
  const [securityCode, setSecurityCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const [activeCard, setActiveCard] = useState(0);
  const prevOffsetsRef = useRef({});
  useEffect(() => {
    if (!products.length) return;
    const timer = setInterval(() => {
      setActiveCard((i) => (i + 1) % products.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [products.length]);

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
        setLinkReason(err.body?.reason || "");
        setLinkState("invalid");
      });

    return () => {
      cancelled = true;
    };
  }, [code]);

  async function handleVerify(e) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    setLoading(true);
    setFormError("");
    try {
      const deviceId = getDeviceId();
      const res = await apiSend(`/api/magic/${code}/consume`, "POST", {
        deviceId,
        name: trimmedName,
        securityCode: securityCode.trim(),
      });
      setStoredName(trimmedName, code);
      reset();
      setUser({ email: res.email, name: trimmedName || "Guest User" });
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
      await apiSend(`/api/magic/${code}/request-access`, "POST", { reason: linkReason });
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
            {linkReason === "expired" || linkReason === "revoked" ? (
              accessRequested ? (
                <p className="text-sm text-primary">
                  Request sent — we'll get back to you once access is granted.
                </p>
              ) : (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleRequestAccess}
                    disabled={requestingAccess}
                    className="btn-primary w-full disabled:opacity-60"
                  >
                    {requestingAccess ? "Sending…" : "Request access"}
                  </button>
                  <Link to="/" className="block text-sm text-primary hover:underline">
                    Back to home
                  </Link>
                </div>
              )
            ) : (
              <Link to="/" className="text-sm text-primary hover:underline">
                Back to home
              </Link>
            )}
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
    <main className="min-h-dvh lg:h-screen lg:overflow-hidden bg-white text-foreground">
      <div className="grid min-h-dvh lg:h-screen lg:grid-cols-2">
        {/* Left — Showcase with ToggleNow branding & reference visual design */}
        <aside
          className="relative hidden lg:flex flex-col items-center justify-between px-10 pt-12 pb-10 overflow-hidden select-none text-center"
          style={{
            background:
              "linear-gradient(180deg, #03081E 0%, #081642 35%, #0F2E78 68%, #1B45BA 100%)",
          }}
        >
          {/* Subtle background ambient mesh glow */}
          <div
            className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-105 h-105 rounded-full pointer-events-none opacity-35 blur-3xl"
            style={{ background: "radial-gradient(circle, #05D9C8 0%, #204CED 60%, transparent 80%)" }}
            aria-hidden="true"
          />

          {/* ToggleNow Logo */}
          <div className="relative flex items-center justify-center">
            <img
              src="/logo.png"
              alt="ToggleNow"
              className="h-9 w-auto object-contain"
              style={{ filter: "brightness(0) invert(1)" }}
            />
          </div>

          {/* Headline + Bullets */}
          <div className="relative max-w-lg space-y-3.5 my-auto pt-2">
            <h1 className="font-display text-3xl lg:text-[38px] font-medium leading-[1.2] tracking-tight text-white">
              Your <span className="text-[#05D9C8] font-medium">Personal Briefing</span> on<br />
              SAP Security & Governance
            </h1>
            <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs lg:text-sm font-normal text-white/80 pt-1">
              <span>Guided Product Tour</span>
              <span className="text-[#05D9C8] font-normal">•</span>
              <span>Live AI Expert</span>
              <span className="text-[#05D9C8] font-normal">•</span>
              <span>Real Customer Stories</span>
            </p>
          </div>

          {/* Product Carousel — cards shift positions smoothly as the active one
              changes, EXCEPT across the ring wrap (the card leaving the far-left
              or far-right slot): that card just fades out where it already is
              instead of sliding all the way across to the opposite side, and
              its replacement fades in already in place. Detected by comparing
              each product's offset to what it was last render — a jump bigger
              than half the ring means it wrapped. */}
          <div className="relative flex h-72 w-full max-w-2xl items-center justify-center my-auto">
            {/* Stationary glass viewport frame — stays fixed behind the active card */}
            <div
              className="absolute z-20 w-44 h-48 rounded-2xl border-2 border-[#05D9C8] bg-[#05D9C8]/10 backdrop-blur-md shadow-[0_0_40px_rgba(5,217,200,0.5),inset_0_0_20px_rgba(5,217,200,0.2)] pointer-events-none"
              style={{ transform: "translateY(-4px)" }}
              aria-hidden="true"
            />

            <AnimatePresence initial={false}>
              {products.map((p, idx) => {
                const offset = ringOffset(idx, activeCard, products.length);
                const abs = Math.abs(offset);
                const isActive = offset === 0;
                const count = products.length;

                const prevOffset = prevOffsetsRef.current[idx];
                const isWrap = prevOffset !== undefined && Math.abs(offset - prevOffset) > count / 2;
                prevOffsetsRef.current[idx] = offset;

                // Arc slot positioning (5 slots)
                const posX =
                  offset === 0
                    ? 0
                    : offset < 0
                    ? offset === -1
                      ? -152
                      : -278
                    : offset === 1
                    ? 152
                    : 278;

                const posY = abs === 0 ? -4 : abs === 1 ? 18 : 54;
                const rot = offset === 0 ? 0 : offset < 0 ? (offset === -1 ? -10 : -20) : (offset === 1 ? 10 : 20);
                const scale = isActive ? 1.05 : 1 - abs * 0.08;
                const targetOpacity = abs > 2 ? 0 : abs === 2 ? 0.7 : 1;

                const IconComponent = p.icon || ShieldCheck;
                const cardKey = isWrap ? `${p.id || p.name}-${offset}` : p.id || p.name;

                return (
                  <motion.div
                    key={cardKey}
                    onClick={() => setActiveCard(idx)}
                    className={`absolute flex flex-col items-center justify-center cursor-pointer text-center w-40 h-44 p-4 rounded-2xl border transition-colors ${
                      isActive
                        ? "border-[#05D9C8]/60 bg-[#0A265C]/95 backdrop-blur-sm shadow-[0_0_25px_rgba(5,217,200,0.35)]"
                        : "border-[#05D9C8]/25 bg-[#071D48]/85 backdrop-blur-sm shadow-xl hover:border-[#05D9C8]/50"
                    }`}
                    initial={isWrap ? { x: posX, y: posY, rotate: rot, scale, opacity: 0 } : false}
                    animate={{ x: posX, y: posY, rotate: rot, scale, opacity: targetOpacity, zIndex: 30 - abs * 5 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 160, damping: 22 }}
                  >
                    {/* Product Icon */}
                    <div
                      className={`rounded-xl border transition-all ${
                        isActive
                          ? "p-3 mb-2 bg-[#05D9C8]/20 border-[#05D9C8]/50 shadow-[0_0_12px_rgba(5,217,200,0.3)]"
                          : "p-2 mb-1.5 bg-cyan-500/10 border-[#05D9C8]/20"
                      }`}
                    >
                      <IconComponent
                        className={`${isActive ? "size-7 text-[#05D9C8]" : "size-5.5 text-cyan-200/85"}`}
                        weight={isActive ? "fill" : "regular"}
                      />
                    </div>

                    {/* Product Title */}
                    <span
                      className={`leading-tight text-white tracking-tight ${
                        isActive ? "text-sm font-bold text-white drop-shadow-sm" : "text-xs font-medium text-white/90"
                      }`}
                    >
                      {p.name}
                    </span>

                    {/* Product Tagline — only shown on the active card */}
                    {isActive && p.tagline && (
                      <span className="leading-snug px-1 mt-1.5 text-center text-[11px] font-normal text-cyan-100/95 max-w-36 line-clamp-2">
                        {p.tagline}
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Bottom Horizon Arc & Footer Text */}
          <div className="relative w-full flex flex-col items-center justify-end pt-6 overflow-hidden">
            {/* Curved Glowing Horizon Dome Arc */}
            <div
              className="absolute left-1/2 -bottom-35 -translate-x-1/2 w-[180%] aspect-square rounded-full pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at 50% 0%, rgba(5,217,200,0.55) 0%, rgba(32,76,237,0.25) 30%, rgba(12,30,80,0.08) 60%, transparent 75%)",
                borderTop: "1px solid rgba(5,217,200,0.6)",
                boxShadow: "0 -15px 40px rgba(5,217,200,0.35)",
              }}
              aria-hidden="true"
            />
            <p className="relative z-10 text-xs font-normal tracking-wide text-white/70 pb-1">
              A ToggleNow Experience Center briefing
            </p>
          </div>
        </aside>

        {/* Right — Form */}
        <section className="flex min-h-dvh lg:h-screen flex-col justify-start items-center overflow-y-auto bg-[#F5F7FB] px-4 py-8 lg:px-6 lg:py-12">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <img src="/logo.png" alt="ToggleNow" className="h-8 w-auto object-contain" />
          </div>

          <div className="w-full max-w-lg rounded-3xl border border-border bg-white p-10 shadow-xl my-auto">
            <div
              className="mx-auto flex size-14 items-center justify-center rounded-2xl"
              style={{ background: "linear-gradient(135deg, #204CED22, #05D9C822)" }}
            >
              <User className="size-7 text-[#204CED]" weight="regular" />
            </div>

            <h1 className="mt-5 text-center font-display text-2xl sm:text-[26px] font-medium tracking-tight text-black">
              You're Invited to Sign In
            </h1>
            <p className="mt-2 text-center text-sm leading-relaxed text-muted-foreground">
              {storedName
                ? "Enter the security code from your invite email."
                : "Tell us your name and enter the security code from your invite email."}
            </p>

            <div className="mt-8">
              <form onSubmit={handleVerify} className="space-y-4">
                {storedName ? (
                  <p className="text-sm text-black">
                    Signing in as <span className="font-medium">{name}</span>
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-black">Your Name</label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-caption" />
                      <input
                        type="text"
                        required
                        autoFocus
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Sarah"
                        className="w-full rounded-xl border border-input bg-surface-alt py-3 pl-11 pr-4 text-[15px] outline-none transition placeholder:text-caption focus:ring-2 focus:ring-primary/15"
                      />
                    </div>
                    <p className="text-xs text-caption">
                      This is saved to this device — you won't be asked again.
                    </p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-black">Security Code</label>
                  <input
                    inputMode="numeric"
                    autoFocus={!!storedName}
                    maxLength={6}
                    value={securityCode}
                    onChange={(e) => setSecurityCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="6-digit code"
                    className="w-full rounded-xl border border-input bg-surface-alt px-4 py-3 text-center text-lg tracking-[0.5em] outline-none focus:ring-2 focus:ring-primary/15"
                  />
                </div>
                <p className="text-xs text-caption">
                  Check your invite email for your security code.
                </p>
                {formError && <p className="text-sm text-destructive">{formError}</p>}
                <button
                  type="submit"
                  disabled={loading || !name.trim() || securityCode.length < 6}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-[15px] font-medium text-white transition disabled:opacity-60"
                  style={{ background: "linear-gradient(90deg, #204CED, #05D9C8)" }}
                >
                  {loading ? "Verifying…" : "Verify & Enter"}
                  {!loading && <ArrowRight className="size-4" weight="bold" />}
                </button>
              </form>

              <ul className="mt-6 grid grid-cols-2 gap-3 text-xs text-caption">
                {[
                  { icon: SealCheck, label: "SAP Certified Partner" },
                  { icon: LockSimple, label: "Secure session" },
                  { icon: ShieldCheck, label: "Private experience" },
                  { icon: Buildings, label: "Prepared for your company" },
                ].map((t) => (
                  <li key={t.label} className="flex items-center gap-2">
                    <t.icon className="size-3.5 text-[#204CED]" weight="bold" />
                    {t.label}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-caption">
            © {new Date().getFullYear()} ToggleNow · SAP Security & Governance
          </p>
        </section>
      </div>
    </main>
  );
}
