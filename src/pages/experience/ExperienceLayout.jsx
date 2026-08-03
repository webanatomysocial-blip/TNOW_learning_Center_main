import { Link, Outlet, useLocation, useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import {
  Check,
  X,
  CaretRight,
  ChatCircle,
  Lightning,
  Clock,
  House,
  PaperPlaneTilt,
  ArrowRight,
} from "@phosphor-icons/react";
import { getSteps, useExperience, useProgress } from "@/lib/experience-store";
import { useExperience as useExperienceStore } from "@/lib/experience-store";
import { useApiGet } from "@/lib/use-api";
import { apiSend } from "@/lib/api";
import { UserProfileMenu } from "@/components/UserProfileMenu";
import { NotFound } from "@/pages/NotFound";

const CloverIcon = ({ className, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 256 256"
    fill="currentColor"
    className={className}
    {...props}
  >
    <path d="M211.66,165.54C225.16,159.7,232,144.37,232,120s-6.84-39.7-20.34-45.55c-11.65-5-27.24-2.23-46.46,8.35,10.58-19.22,13.39-34.81,8.35-46.46C167.7,22.84,152.37,16,128,16S88.3,22.84,82.45,36.34c-5,11.65-2.23,27.24,8.35,46.45C71.58,72.22,56,69.4,44.34,74.45,30.84,80.3,24,95.63,24,120s6.84,39.7,20.34,45.54A31,31,0,0,0,56.8,168c9.6,0,21-3.62,34-10.79C80.22,176.41,77.41,192,82.45,203.65,88.3,217.15,103.63,224,128,224s39.7-6.85,45.55-20.35a32.24,32.24,0,0,0,2.34-15c10.45,16.23,19.64,34.48,24.35,53.33A8,8,0,0,0,208,248a8.13,8.13,0,0,0,1.95-.24,8,8,0,0,0,5.82-9.7c-6.94-27.76-22.27-53.8-37.86-74.79Q189.68,168,199.2,168A31,31,0,0,0,211.66,165.54Zm-6.37-76.4C214.14,93,216,108,216,120s-1.86,27-10.7,30.86c-8.36,3.63-23.52-1.31-42.68-13.91a243.4,243.4,0,0,1-22.54-17C158.49,104.37,190.4,82.68,205.29,89.14ZM97.14,42.7C101,33.86,116,32,128,32s27,1.86,30.86,10.7c3.63,8.36-1.31,23.52-13.91,42.68a243.4,243.4,0,0,1-17,22.54C112.37,89.51,90.69,57.59,97.14,42.7ZM50.71,150.86C41.86,147,40,132,40,120s1.86-27,10.7-30.86A15.64,15.64,0,0,1,57,88c8.75,0,21.34,5.17,36.4,15.07a243.4,243.4,0,0,1,22.54,17C97.51,135.62,65.59,157.32,50.71,150.86Zm108.15,46.43C155,206.14,140,208,128,208s-27-1.86-30.86-10.7c-3.63-8.36,1.31-23.52,13.91-42.68a243.4,243.4,0,0,1,17-22.54C143.63,150.49,165.31,182.41,158.86,197.29Z" />
  </svg>
);

const ClubIcon = ({ className, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 256 256"
    fill="currentColor"
    className={className}
    {...props}
  >
    <path d="M184,88c-.78,0-1.56,0-2.33,0a56,56,0,1,0-107.34,0c-.78,0-1.55,0-2.33,0A56,56,0,1,0,96.54,194.35l-8.2,27.35A8,8,0,0,0,96,232h64a8,8,0,0,0,7.66-10.3l-8.2-27.35A56,56,0,1,0,184,88Zm0,96a40,40,0,0,1-33.4-18,8,8,0,0,0-14.33,6.71l13,43.26h-42.5l13-43.26A8,8,0,0,0,105.4,166a40,40,0,1,1-19.93-59.71,8,8,0,0,0,9.33-12,40,40,0,1,1,66.4,0,8,8,0,0,0,9.33,12A40,40,0,1,1,184,184Z" />
  </svg>
);

export function ExperienceLayout() {
  const location = useLocation();
  const pathname = location.pathname;
  const params = useParams();
  const { productSlug } = params;
  const mainRef = useRef(null);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo(0, 0);
    }
  }, [pathname]);

  const { data: products, isLoading: productsLoading } = useApiGet("/api/products");
  const product = (products ?? []).find((p) => p.slug === productSlug);

  const { pct, done, total } = useProgress(pathname);
  const user = useExperience((s) => s.user);
  const inviteId = useExperience((s) => s.inviteId);
  const completed = useExperience((s) => s.completed);
  const achievements = useExperience((s) => s.achievements);
  const capabilitiesViewed = useExperience((s) => s.capabilitiesViewed);
  const storiesRead = useExperience((s) => s.storiesRead);
  const aiQuestionsAsked = useExperience((s) => s.aiQuestionsAsked);
  const videosWatched = useExperience((s) => s.videosWatched);
  const [aiOpen, setAiOpen] = useState(false);

  // Reports how far this customer has gotten to the invite they came in on, so the
  // admin can see engagement in the Sent Emails list. Only invite-link logins have an
  // inviteId (the plain /login OTP flow is disabled entirely, so in practice this is
  // always set) — nothing to report against without one.
  useEffect(() => {
    if (!inviteId || !user?.email) return;
    const completedSteps = Object.entries(completed)
      .filter(([, done]) => done)
      .map(([id]) => id);
    apiSend(`/api/invites/${inviteId}/progress`, "POST", {
      email: user.email,
      pct,
      steps: completedSteps,
      productSlug,
    }).catch(() => {
      // Best-effort — a failed progress ping shouldn't interrupt the experience.
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteId, user?.email, pct, JSON.stringify(completed), productSlug]);

  if (productsLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
        Loading experience…
      </div>
    );
  }

  if (!product || product.status !== "available") {
    return <NotFound />;
  }

  const steps = getSteps(productSlug);
  const basePath = `/experience/${productSlug}`;

  const currentStep =
    steps.find((s) => (s.path === basePath ? pathname === basePath : pathname.startsWith(s.path))) ??
    steps[0];

  const capabilityLabel = params?.capability?.replace(/-/g, " ");

  const currentIdx = steps.findIndex((s) => s.id === currentStep.id);
  const nextStep = steps[currentIdx + 1];

  return (
    <div className="min-h-dvh lg:h-screen lg:max-h-screen lg:flex lg:flex-col bg-[#FFFFFF] text-foreground relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(32,76,237,0.06),_transparent_45%)]">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 md:px-6 py-3">
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
            <Link to="/experience" className="flex items-center shrink-0">
              <img src="/logo.png" alt="ToggleNow" className="h-6 sm:h-7 w-auto object-contain" />
            </Link>
            <CaretRight className="size-3 text-caption shrink-0" />
            <Link
              to={basePath}
              className="text-xs sm:text-sm font-medium text-foreground shrink-0"
            >
              {product.name}
            </Link>
            {currentStep.id !== "welcome" && (
              <>
                <CaretRight className="size-3 text-caption shrink-0" />
                <span className="text-xs sm:text-sm text-muted-foreground truncate max-w-[80px] sm:max-w-none">
                  {currentStep.label}
                </span>
              </>
            )}
            {capabilityLabel && (
              <>
                <CaretRight className="size-3 text-caption shrink-0" />
                <span className="text-xs sm:text-sm capitalize text-muted-foreground truncate max-w-[80px] sm:max-w-none">
                  {capabilityLabel}
                </span>
              </>
            )}
          </div>

          <div className="hidden items-center gap-2 md:flex shrink-0">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {pct}% Complete
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <UserProfileMenu />
          </div>
        </div>
      </header>

      {/* Mobile Sticky Step Header */}
      <div className="sticky top-[49px] sm:top-[53px] lg:hidden z-20 border-b border-border bg-background/95 backdrop-blur-md px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          {/* Step Info */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold text-primary uppercase tracking-wider">
              <span>
                Step {currentIdx + 1} of {steps.length}
              </span>
              <span className="text-muted-foreground/40">•</span>
              <span>{pct}% Done</span>
            </div>
            <h2 className="font-display text-sm font-bold text-foreground truncate mt-0.5">
              {currentStep.label}
            </h2>
          </div>

          {/* Next / Forward CTA Button right at the top on mobile */}
          {nextStep ? (
            <Link
              to={nextStep.path}
              className="inline-flex items-center gap-1 bg-primary text-white text-[11px] font-semibold rounded-full px-3.5 py-1.5 shadow-sm hover:bg-primary-hover active:scale-95 transition shrink-0"
            >
              Continue <ArrowRight className="size-3" weight="bold" />
            </Link>
          ) : (
            currentStep.id !== "book" && (
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold shrink-0 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                Step Complete
              </span>
            )
          )}
        </div>

        {/* Horizontal Scrollable Steps List */}
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {steps.map((s, i) => {
            const isActive = currentStep.id === s.id;
            const isDone = pathname.includes("/success") || completed[s.id];
            return (
              <Link
                key={s.id}
                to={s.path}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] transition-all shrink-0 border ${
                  isActive
                    ? "bg-primary/10 text-primary border-primary/25 font-semibold"
                    : "bg-surface text-muted-foreground border-border/70"
                }`}
              >
                <span
                  className={`grid size-4 place-items-center rounded-full text-[9px] font-bold ${
                    isDone
                      ? "bg-primary text-primary-foreground"
                      : isActive
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : "bg-muted text-caption border border-border"
                  }`}
                >
                  {isDone ? <Check className="size-2.5" weight="bold" /> : i + 1}
                </span>
                <span>{s.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1400px] gap-8 px-4 sm:px-6 py-6 md:py-8 lg:flex-1 lg:h-0 lg:overflow-hidden lg:py-5 lg:gap-6">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-64 shrink-0 flex-col h-full overflow-y-auto scrollbar-none pr-1 justify-start gap-3 pb-2">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-caption">
                Your journey
              </p>
              <span className="inline-flex items-center gap-1 text-[10px] text-caption">
                <Clock className="size-3" /> ~{product.time || "12 min"}
              </span>
            </div>
            <p className="mt-1.5 font-display text-base font-semibold">{pct}% Complete</p>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>

            {/* Sidebar metadata breakdown */}
            <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-2 gap-y-2.5 gap-x-2 text-xs font-sans">
              <div>
                <p className="text-[9px] uppercase font-bold text-muted-foreground/60 tracking-wider">
                  Estimated Time
                </p>
                <p className="text-[12px] font-medium text-foreground mt-0.5">
                  {product.time || "12 minutes"}
                </p>
              </div>
              <div>
                <p className="text-[9px] uppercase font-bold text-muted-foreground/60 tracking-wider">
                  Current Step
                </p>
                <p className="text-[12px] font-medium text-foreground mt-0.5">
                  {currentIdx + 1} / {steps.length}
                </p>
              </div>
            </div>

            <nav className="mt-4 space-y-0.5">
              {steps.map((s, i) => {
                const isActive = currentStep.id === s.id;
                const isDone = pathname.includes("/success") || completed[s.id];
                return (
                  <Link
                    key={s.id}
                    to={s.path}
                    className={`flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-xs transition ${
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-surface hover:text-foreground"
                    }`}
                  >
                    <span
                      className={`grid size-5.5 place-items-center rounded-full text-[10px] font-semibold shrink-0 ${
                        isDone
                          ? "bg-primary text-primary-foreground"
                          : isActive
                            ? "border border-primary/40 bg-background text-primary"
                            : "border border-border bg-background text-caption"
                      }`}
                    >
                      {isDone ? <Check className="size-3" /> : i + 1}
                    </span>
                    <span className="truncate">{s.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Promo CTA Card */}
          <div className="rounded-xl bg-[#204CED] text-white p-4 shrink-0 flex flex-col justify-between relative overflow-hidden border border-[#204CED]/10 group">
            <div>
              <span className="inline-block rounded-full bg-white/20 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white">
                Exclusive Invitation
              </span>
              <h3 className="mt-2 font-display text-[14px] font-semibold leading-tight text-white">
                Book an Interactive SAP Security Workshop
              </h3>
              <p className="mt-1 text-[10px] text-white/80 leading-normal font-normal">
                Connect with our specialists to analyze your system and review segregation-of-duties
                risks live.
              </p>
            </div>

            <div className="mt-3">
              <Link
                to={`${basePath}/book`}
                className="w-full py-2 rounded-lg bg-white hover:bg-white/95 text-[#204CED] font-medium text-[11px] transition duration-200 text-center block shadow-sm active:scale-98 font-sans"
              >
                Schedule Free Scan
              </Link>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main ref={mainRef} className="min-w-0 flex-1 pb-24 md:pb-16 lg:h-full lg:overflow-y-auto lg:pb-6 scrollbar-none">
          <div className="fade-up lg:h-full lg:flex lg:flex-col">
            <Outlet context={{ product, productSlug }} />
          </div>
        </main>
      </div>

      {/* Persistent AI drawer with soft glow */}
      <div className="fixed bottom-6 right-6 z-40">
        <div className="absolute inset-0 bg-primary opacity-30 blur-xl rounded-full scale-110 pointer-events-none" />
        <button
          onClick={() => setAiOpen(true)}
          className="relative inline-flex size-12 md:size-auto md:h-auto items-center justify-center md:justify-start gap-2 rounded-full bg-primary p-3 md:px-5 md:py-3 text-sm font-medium text-primary-foreground shadow-float transition hover:bg-primary-hover hover:scale-105 active:scale-95"
          aria-label="Open AI Expert"
        >
          <CloverIcon className="size-5 md:size-4 text-white" />
          <span className="hidden md:inline">Ask AI Expert</span>
        </button>
      </div>
      {aiOpen && (
        <AiDrawer productSlug={productSlug} productName={product.name} onClose={() => setAiOpen(false)} />
      )}
    </div>
  );
}

function AiDrawer({ productSlug, productName, onClose }) {
  const { data: qaData } = useApiGet(`/api/ai-qa?product=${productSlug}`);
  const { data: pageData } = useApiGet(`/api/experience-pages?product=${productSlug}&page=ai`);
  const QA = qaData ?? [];
  const introMessage =
    pageData?.extra?.introMessage ??
    `Hi — I'm the ${productName} expert. Ask me anything, or pick a suggested question below.`;

  const [messages, setMessages] = useState([{ role: "ai", text: introMessage }]);
  const [seededIntro, setSeededIntro] = useState(false);
  const [input, setInput] = useState("");
  const incAi = useExperienceStore((s) => s.incAi);
  const addAchievement = useExperienceStore((s) => s.addAchievement);
  const complete = useExperienceStore((s) => s.complete);

  if (!seededIntro && pageData) {
    setSeededIntro(true);
    setMessages([{ role: "ai", text: introMessage }]);
  }

  function send(q) {
    if (!q.trim()) return;
    const match = QA.find((item) => item.question === q);
    const answer =
      match?.answer ??
      `Great question. Our ${productName} consultant will cover this in your workshop — I've noted it for the agenda.`;
    setMessages((m) => [...m, { role: "user", text: q }, { role: "ai", text: answer }]);
    setInput("");
    incAi();
    addAchievement("firstAi");
    complete("ai");
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-foreground/10 backdrop-blur-[2px]" onClick={onClose} />
      <aside className="flex w-full max-w-md flex-col bg-white/95 backdrop-blur-md border-l border-white/40 shadow-[0_15px_50px_rgba(32,76,237,0.12)]">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="grid size-7 place-items-center rounded-full bg-primary text-white">
              <ClubIcon className="size-4 text-white" />
            </div>
            <p className="font-display text-sm font-semibold">AI Expert</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-caption hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {messages.map((m, i) => {
            if (m.role === "user") {
              return (
                <div
                  key={i}
                  className="ml-auto max-w-[85%] rounded-2xl bg-primary text-primary-foreground px-4 py-2.5 text-sm"
                >
                  {m.text}
                </div>
              );
            } else {
              return (
                <div key={i} className="flex gap-3 max-w-[85%] items-start">
                  <div className="grid size-8 place-items-center rounded-full bg-primary text-white shrink-0 shadow-sm mt-0.5">
                    <ClubIcon className="size-4 text-white" />
                  </div>
                  <div className="rounded-2xl bg-surface border border-border/50 text-foreground px-4 py-2.5 text-sm leading-relaxed shadow-sm rounded-tl-none">
                    {m.text}
                  </div>
                </div>
              );
            }
          })}
        </div>

        <div className="border-t border-border px-5 py-3">
          <div className="mb-3 flex flex-wrap gap-1.5">
            {QA.slice(0, 4).map((s) => (
              <button
                key={s.question}
                onClick={() => send(s.question)}
                className="rounded-full border border-border bg-background px-3 py-1 text-[11px] text-muted-foreground hover:border-primary hover:text-primary"
              >
                {s.question}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask about ${productName}…`}
              className="flex-1 rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none placeholder:text-caption focus:border-primary focus:ring-2 focus:ring-primary/15"
              style={{ borderRadius: 16 }}
            />
            <button
              type="submit"
              className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground hover:bg-primary-hover"
              aria-label="Send"
            >
              <PaperPlaneTilt className="size-4" />
            </button>
          </form>
        </div>
      </aside>
    </div>
  );
}

// Re-export shared helpers for step pages
export { House as Home, ChatCircle as MessageCircle };
