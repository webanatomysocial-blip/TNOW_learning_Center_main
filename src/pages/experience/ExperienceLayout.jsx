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
  Sparkle,
} from "@phosphor-icons/react";
import { getSteps, useExperience, useProgress } from "@/lib/experience-store";
import { useExperience as useExperienceStore } from "@/lib/experience-store";
import { useApiGet } from "@/lib/use-api";
import { apiSend } from "@/lib/api";
import { UserProfileMenu } from "@/components/UserProfileMenu";
import { findBestQaMatch, rankQaMatches } from "@/lib/ai-qa-match";
import { NotFound } from "@/pages/NotFound";

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

  const { data: products, isLoading: productsLoading } =
    useApiGet("/api/products");
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
  const aiOpen = useExperience((s) => s.aiOpen);
  const setAiOpen = useExperience((s) => s.setAiOpen);

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
    steps.find((s) =>
      s.path === basePath ? pathname === basePath : pathname.startsWith(s.path),
    ) ?? steps[0];

  const capabilityLabel = params?.capability?.replace(/-/g, " ");

  const currentIdx = steps.findIndex((s) => s.id === currentStep.id);
  const nextStep = steps[currentIdx + 1];

  return (
    <div className="h-screen max-h-screen flex flex-col secops-page-bg text-[#101735] relative overflow-hidden">
      {/* Ambient Depth Glows */}
      <div className="absolute top-0 left-0 w-[540px] h-[540px] rounded-full bg-[#2854F5]/[0.05] opacity-100 blur-[280px] pointer-events-none -translate-x-1/2 -translate-y-1/2 z-0" />
      <div className="absolute bottom-0 right-0 w-[680px] h-[680px] rounded-full bg-[#6C3BFF]/[0.05] opacity-100 blur-[300px] pointer-events-none translate-x-1/3 translate-y-1/3 z-0" />

      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-[#E3E7F5] bg-white/90 backdrop-blur-md relative">
        <div className="w-full flex items-center justify-between gap-3 px-4 md:px-12 lg:px-[100px] py-3">
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
            <Link to="/experience" className="flex items-center shrink-0">
              <img
                src="/logo.png"
                alt="ToggleNow"
                className="h-6 sm:h-7 w-auto object-contain"
              />
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
      <div className="sticky top-[49px] sm:top-[53px] lg:hidden z-20 border-b border-border backdrop-blur-md px-4 py-3 shadow-sm">
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
                ref={isActive ? (el) => el?.scrollIntoView({ block: "nearest", inline: "center" }) : undefined}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] transition-all shrink-0 border ${
                  isActive
                    ? "bg-[#EEF3FF] text-[#2854F5] border-[#6C3BFF]/30 font-bold shadow-xs"
                    : "bg-white/80 text-[#59627D] border-[#E3E7F5]"
                }`}
              >
                <span
                  className={`grid size-4 place-items-center rounded-full text-[9px] font-bold border ${
                    isDone
                      ? "bg-primary text-primary-foreground border-primary"
                      : isActive
                        ? "bg-white text-[#6C3BFF] border-[#6C3BFF]"
                        : "bg-[#F8F9FD] text-[#8991A8] border-[#E3E7F5]"
                  }`}
                >
                  {isDone ? (
                    <Check className="size-2.5" weight="bold" />
                  ) : (
                    i + 1
                  )}
                </span>
                <span>{s.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex w-full gap-8 px-4 md:px-12 lg:px-[100px] pt-6 md:pt-8 lg:flex-1 lg:h-0 lg:overflow-hidden lg:pt-5 lg:gap-6">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-64 shrink-0 flex-col h-full overflow-hidden justify-between gap-3 pb-1">
          <div className="glass-sidebar p-5 relative z-10 flex-1 flex flex-col justify-between gap-2 overflow-hidden">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-caption">
                Your journey
              </p>
              <span className="inline-flex items-center gap-1 text-[10px] text-caption">
                <Clock className="size-3" /> ~{product.time || "12 min"}
              </span>
            </div>
            <p className="mt-1.5 font-display text-base font-semibold">
              {pct}% Complete
            </p>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${pct}%`,
                  background: "linear-gradient(90deg, #2854F5, #6C3BFF)",
                }}
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

            <nav className="mt-3 space-y-1 flex-1 overflow-y-auto scrollbar-none pr-0.5">
              {steps.map((s, i) => {
                const isActive = currentStep.id === s.id;
                const isDone = pathname.includes("/success") || completed[s.id];
                return (
                  <Link
                    key={s.id}
                    to={s.path}
                    ref={isActive ? (el) => el?.scrollIntoView({ block: "nearest" }) : undefined}
                    className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs transition-all ${
                      isActive
                        ? "bg-[#EEF3FF] text-[#101735] font-bold border border-[#6C3BFF]/30 shadow-xs"
                        : "text-[#59627D] hover:bg-white hover:text-[#101735]"
                    }`}
                  >
                    <span
                      className={`grid size-5.5 place-items-center rounded-full text-[10px] font-bold shrink-0 transition-all ${
                        isDone
                          ? "text-white"
                          : isActive
                            ? "border border-[#6C3BFF] bg-white text-[#6C3BFF] shadow-[0_0_0_3px_rgba(108,59,255,0.12)]"
                            : "border border-[#E3E7F5] bg-white text-[#8991A8]"
                      }`}
                      style={
                        isDone
                          ? {
                              background:
                                "linear-gradient(135deg, #2854F5, #6C3BFF)",
                            }
                          : undefined
                      }
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
          <div
            className="rounded-xl text-white p-4 shrink-0 flex flex-col justify-between relative overflow-hidden border border-[#2854F5]/20 group"
            style={{
              background:
                "radial-gradient(circle at 85% 10%, rgba(255,255,255,0.16), transparent 35%), linear-gradient(135deg, #2854F5 0%, #473DF2 45%, #6C3BFF 100%)",
            }}
          >
            <div>
              <span className="inline-block rounded-full bg-white/20 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white">
                Exclusive Invitation
              </span>
              <h3 className="mt-2 font-display text-[14px] font-semibold leading-tight text-white">
                Book an Interactive SAP Security Workshop
              </h3>
              <p className="mt-1 text-[10px] text-white/80 leading-normal font-normal">
                Connect with our specialists to analyze your system and review
                segregation-of-duties risks live.
              </p>
            </div>

            <div className="mt-3">
              <Link
                to={`${basePath}/book`}
                className="w-full py-2 rounded-lg bg-white hover:bg-white/95 text-[#2854F5] font-medium text-[11px] transition duration-200 text-center block shadow-sm active:scale-98 font-sans"
              >
                Schedule Free Scan
              </Link>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main
          ref={mainRef}
          className="min-w-0 flex-1 h-full relative flex flex-col overflow-hidden"
        >
          <div className="fade-up flex-1 flex flex-col overflow-hidden h-full">
            <Outlet context={{ product, productSlug }} />
          </div>
        </main>
      </div>

      {/* The AI Expert drawer is opened from the chat icon in StepNav's footer
          (see src/components/StepNav.jsx) — rendered once here so it isn't
          remounted per page. */}
      {aiOpen && (
        <AiDrawer
          productSlug={productSlug}
          productName={product.name}
          onClose={() => setAiOpen(false)}
        />
      )}
    </div>
  );
}

function AiDrawer({ productSlug, productName, onClose }) {
  const { data: qaData } = useApiGet(`/api/ai-qa?product=${productSlug}`);
  const { data: pageData } = useApiGet(
    `/api/experience-pages?product=${productSlug}&page=ai`,
  );
  const QA = qaData ?? [];
  const introMessage =
    pageData?.extra?.introMessage ??
    `Hi — I'm the ${productName} expert. Ask me anything, or pick a suggested question below.`;

  const [messages, setMessages] = useState([
    { role: "ai", text: introMessage },
  ]);
  const [seededIntro, setSeededIntro] = useState(false);
  const [input, setInput] = useState("");
  const incAi = useExperienceStore((s) => s.incAi);
  const addAchievement = useExperienceStore((s) => s.addAchievement);
  const complete = useExperienceStore((s) => s.complete);
  const messagesEndRef = useRef(null);

  if (!seededIntro && pageData) {
    setSeededIntro(true);
    setMessages([{ role: "ai", text: introMessage }]);
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  function send(q) {
    if (!q.trim()) return;
    const match = QA.find((item) => item.question === q) ?? findBestQaMatch(QA, q);

    if (match) {
      const sameTopic = QA.filter(
        (item) => item.topic && item.topic === match.topic && item.question !== match.question,
      );
      const related = (sameTopic.length ? sameTopic : rankQaMatches(QA, match.question, 4))
        .filter((item) => item.question !== q)
        .slice(0, 3);
      setMessages((m) => [
        ...m,
        { role: "user", text: q },
        { role: "ai", text: match.answer, related },
      ]);
    } else {
      // No confident match — show close candidates instead of guessing.
      const candidates = rankQaMatches(QA, q, 5);
      const text = candidates.length
        ? "I want to make sure I answer the right question — did you mean one of these?"
        : `Great question. Our ${productName} consultant will cover this in your workshop — I've noted it for the agenda.`;
      setMessages((m) => [
        ...m,
        { role: "user", text: q },
        { role: "ai", text, related: candidates },
      ]);
    }
    setInput("");
    incAi();
    addAchievement("firstAi");
    complete("ai");
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="flex-1 bg-foreground/10 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <aside className="flex w-full max-w-md flex-col bg-white/95 backdrop-blur-md border-l border-white/40 shadow-[0_15px_50px_rgba(32,76,237,0.12)]">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="relative inline-flex size-7 items-center justify-center shrink-0">
              <img src="/chatbot-icon.webp" alt="" className="absolute inset-0 size-full object-contain" />
              <img src="/sparkle.png" alt="" className="relative size-4.5 object-contain" />
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
                  className="ml-auto max-w-[85%] rounded-2xl text-white px-4 py-2.5 text-sm"
                  style={{
                    background: "linear-gradient(135deg, #2854F5, #6C3BFF)",
                  }}
                >
                  {m.text}
                </div>
              );
            } else {
              return (
                <div key={i} className="flex gap-3 max-w-[85%] items-start">
                  <div className="relative inline-flex size-8 items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <img src="/chatbot-icon.webp" alt="" className="absolute inset-0 size-full object-contain" />
                    <img src="/sparkle.png" alt="" className="relative size-5 object-contain" />
                  </div>
                  <div className="rounded-2xl bg-surface border border-border/50 text-foreground px-4 py-2.5 text-sm leading-relaxed shadow-sm rounded-tl-none">
                    {m.text}
                    {m.related?.length > 0 && (
                      <div className="mt-2.5 pt-2.5 border-t border-border/50">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                          Related questions
                        </p>
                        <div className="flex flex-col items-start gap-1">
                          {m.related.map((r) => (
                            <button
                              key={r.question}
                              type="button"
                              onClick={() => send(r.question)}
                              className="text-left text-xs text-primary hover:underline"
                            >
                              {r.question}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            }
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-border px-5 py-3">
          <div className="mb-3 flex flex-wrap gap-1.5">
            {QA.slice(0, 4).map((s) => (
              <button
                key={s.question}
                onClick={() => send(s.question)}
                className="rounded-full border border-border bg-background px-3 py-1 text-[11px] text-muted-foreground hover:border-[#6C3BFF] hover:text-[#6C3BFF] hover:bg-[#F3EFFF]"
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
              className="flex-1 rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none placeholder:text-caption focus:border-[#2854F5] focus:ring-2 focus:ring-[#2854F5]/15"
              style={{ borderRadius: 16 }}
            />
            <button
              type="submit"
              className="grid size-10 place-items-center rounded-full text-white hover:opacity-90 transition-opacity"
              style={{
                background: "linear-gradient(135deg, #2854F5, #6C3BFF)",
              }}
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
