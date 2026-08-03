import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { ShieldCheck, LockSimple, Buildings, SealCheck } from "@phosphor-icons/react";
import { useExperience } from "@/lib/experience-store";
import { useDocumentHead } from "@/lib/use-document-head";

export function LoginPage() {
  useDocumentHead({
    meta: [
      { title: "Sign in — ToggleNow Experience Center" },
      {
        name: "description",
        content:
          "Sign in to your personalized ToggleNow Experience Center — a private, guided SAP Security & Governance briefing for you.",
      },
    ],
  });
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isNameModified, setIsNameModified] = useState(false);
  const [otp, setOtp] = useState("");
  const [stage, setStage] = useState("email");
  const [loading, setLoading] = useState(false);
  const setUser = useExperience((s) => s.setUser);
  const reset = useExperience((s) => s.reset);
  const navigate = useNavigate();

  function handleEmailChange(val) {
    setEmail(val);
    if (!isNameModified && val) {
      const candidate = val
        .split("@")[0]
        .replace(/[0-9]/g, "") // remove numeric digits (e.g. 723ms -> ms)
        .replace(/grc|basis|sap|it|admin|dev/gi, "") // strip common robotic/system labels
        .replace(/[._]/g, " ") // replace dots and underscores with spaces
        .trim();

      const cleanCandidate =
        candidate.length > 1 ? candidate : val.split("@")[0].replace(/[._]/g, " ");
      setName(capitalize(cleanCandidate));
    }
  }

  function sendOtp(e) {
    e.preventDefault();
    if (!email || !name) return;
    setLoading(true);
    setTimeout(() => {
      setStage("otp");
      setLoading(false);
    }, 400);
  }

  function verifyOtp(e) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      reset(); // Reset all cached state, achievements, and steps from previous sessions
      setUser({ email, name: name.trim() || "Guest User" });
      navigate("/experience");
    }, 400);
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
          {/* White Grid Lines */}
          <div
            className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay"
            style={{
              backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.25) 1px, transparent 1px),
                               linear-gradient(to bottom, rgba(255, 255, 255, 0.25) 1px, transparent 1px)`,
              backgroundSize: "90px 90px",
              backgroundPosition: "center center",
            }}
          />

          {/* Testimonial Card */}
          <div
            className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-white/10 p-10 shadow-2xl backdrop-blur-md flex flex-col justify-between"
            style={{ borderRadius: 24 }}
          >
            {/* Litmus Logo */}
            <div className="flex items-center gap-3">
              <svg
                className="size-8 text-white shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g fill="currentColor">
                  {Array.from({ length: 12 }).map((_, i) => {
                    const angle = (i * 30 * Math.PI) / 180;
                    const x1 = 12 + 4 * Math.cos(angle);
                    const y1 = 12 + 4 * Math.sin(angle);
                    const x2 = 12 + 9.5 * Math.cos(angle);
                    const y2 = 12 + 9.5 * Math.sin(angle);

                    const nextAngle = ((i + 0.65) * 30 * Math.PI) / 180;
                    const x3 = 12 + 9.5 * Math.cos(nextAngle);
                    const y3 = 12 + 9.5 * Math.sin(nextAngle);
                    const x4 = 12 + 4 * Math.cos(nextAngle);
                    const y4 = 12 + 4 * Math.sin(nextAngle);

                    return (
                      <path
                        key={i}
                        d={`M ${x1} ${y1} L ${x2} ${y2} A 9.5 9.5 0 0 1 ${x3} ${y3} L ${x4} ${y4} A 4 4 0 0 0 ${x1} ${y1} Z`}
                      />
                    );
                  })}
                </g>
              </svg>
              <span className="font-sans text-xl font-semibold tracking-tight text-white">
                litmus
              </span>
            </div>

            {/* Quote */}
            <blockquote className="mt-14 text-lg md:text-[21px] text-white/90 leading-relaxed font-sans font-light tracking-wide">
              “ToggleNow allows us to make informed and cohesive decisions around{" "}
              <strong className="font-semibold text-white">securing our SAP systems</strong> and
              making our compliance seamless.”
            </blockquote>

            {/* Author */}
            <div className="flex items-center gap-3.5 mt-14">
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&h=120&q=80"
                alt="Taylor Davis"
                className="size-11 rounded-full object-cover border border-white/20 shadow-md"
                referrerPolicy="no-referrer"
              />
              <div>
                <cite className="not-italic text-sm font-semibold text-white block">
                  Taylor Davis
                </cite>
                <span className="font-mono text-[10px] text-white/75 uppercase tracking-wider block mt-0.5">
                  Senior Director of Customer Experience
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Right — Login */}
        <section className="flex flex-col justify-between px-6 py-10 lg:col-span-2 lg:px-14">
          <div className="mx-auto flex h-full w-full max-w-sm flex-col justify-between gap-12">
            <div className="flex items-center">
              <img src="/logo.png" alt="ToggleNow" className="h-8 w-auto object-contain" />
            </div>

            <div className="w-full">
              <p className="mb-3 text-xs font-medium uppercase tracking-widest text-caption">
                Experience Center
              </p>
              <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight whitespace-nowrap">
                Welcome to ToggleNow
              </h1>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                Explore enterprise SAP products for you.
              </p>

              <div className="mt-8 rounded-2xl border border-border bg-background p-6 shadow-soft">
                {stage === "email" ? (
                  <form onSubmit={sendOtp} className="space-y-4">
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
                    <button
                      type="submit"
                      disabled={loading || !email || !name}
                      className="btn-primary w-full disabled:opacity-60"
                    >
                      {loading ? "Sending code…" : "Continue"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={verifyOtp} className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-foreground">
                          One-time code
                        </label>
                        <button
                          type="button"
                          onClick={() => setStage("email")}
                          className="text-xs text-caption hover:text-foreground"
                        >
                          Change email
                        </button>
                      </div>
                      <input
                        inputMode="numeric"
                        autoFocus
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                        placeholder="6-digit code"
                        className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-center text-lg tracking-[0.5em] outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                        style={{ borderRadius: 16 }}
                      />
                    </div>
                    <p className="text-xs text-caption">
                      Sent to <span className="text-foreground">{email}</span>. Use any 6 digits for
                      the demo.
                    </p>
                    <button
                      type="submit"
                      disabled={loading || otp.length < 4}
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

function capitalize(s) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}
