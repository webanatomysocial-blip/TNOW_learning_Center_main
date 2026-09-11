import { useNavigate, Link, useParams } from "react-router-dom";
import { useState, useMemo, useEffect, useRef } from "react";
import { motion } from "motion/react";
import {
  ShieldCheck,
  Check,
  ArrowRight,
  ArrowCounterClockwise,
  Calculator,
  WarningCircle,
  CheckCircle,
  CalendarCheck,
  Compass,
  ArrowDown,
  CaretDown,
} from "@phosphor-icons/react";
import {
  ASSESSMENT_QUESTIONS,
  RECOMMENDATION_TIERS,
  getTierFromScore,
  DEFAULT_ROI_TASKS,
  CURRENCIES,
  formatCurrency,
} from "@/lib/assessment-data";
import { useExperience } from "@/lib/experience-store";
import { UserProfileMenu } from "@/components/UserProfileMenu";
import { useDocumentHead } from "@/lib/use-document-head";
import { apiSend } from "@/lib/api";

export function RecommendationPage() {
  const navigate = useNavigate();
  const { productSlug } = useParams();
  useDocumentHead({ meta: [{ title: "Your SecOps Recommendation & ROI — ToggleNow" }] });
  const assessmentScore = useExperience((s) => s.assessmentScore);
  const assessmentAnswers = useExperience((s) => s.assessmentAnswers);
  const resetAssessment = useExperience((s) => s.resetAssessment);
  const inviteId = useExperience((s) => s.inviteId);
  const user = useExperience((s) => s.user);

  const effectiveScore = assessmentScore ?? 24;
  const tier = useMemo(() => getTierFromScore(effectiveScore), [effectiveScore]);

  const exposureFlags = useMemo(() => {
    const flags = [];
    ASSESSMENT_QUESTIONS.forEach((q, idx) => {
      const selectedOptIdx = assessmentAnswers[idx];
      if (selectedOptIdx !== null && selectedOptIdx !== undefined) {
        const opt = q.opts[selectedOptIdx];
        if (opt && opt.s === 0 && opt.flag) {
          flags.push({ dim: q.dim, text: opt.flag, qText: q.q });
        }
      }
    });
    return flags;
  }, [assessmentAnswers]);

  const [selectedCurrency, setSelectedCurrency] = useState("INR");
  const currencyConfig = CURRENCIES[selectedCurrency] || CURRENCIES.INR;
  const [costPerFte, setCostPerFte] = useState(currencyConfig.defaultCostPerFte);
  const [productiveHoursMonth, setProductiveHoursMonth] = useState(160);
  const [tasks, setTasks] = useState(DEFAULT_ROI_TASKS);
  const [activeNav, setActiveNav] = useState("recommendation");
  const [methodologyOpen, setMethodologyOpen] = useState(false);

  const handleCurrencyChange = (currCode) => {
    setSelectedCurrency(currCode);
    const newConfig = CURRENCIES[currCode] || CURRENCIES.USD;
    setCostPerFte(newConfig.defaultCostPerFte);
    setLaborCalculated(false);
  };

  const handleTaskFieldChange = (taskId, field, val) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, [field]: Math.max(0, val) } : t)));
    // Edited inputs no longer match the totals already shown — hide them until
    // "Recalculate" is clicked again, rather than leaving a stale total on screen.
    setTasksCalculated(false);
  };

  const handleResetTasks = () => {
    setTasks(DEFAULT_ROI_TASKS);
    const config = CURRENCIES[selectedCurrency] || CURRENCIES.INR;
    setCostPerFte(config.defaultCostPerFte);
    setProductiveHoursMonth(160);
    setTasksCalculated(false);
  };

  const roi = useMemo(() => {
    const hourlyRate = costPerFte / (productiveHoursMonth * 12);

    let totalTickets = 0;
    let totalMonthlyManualHours = 0;
    let totalMonthlySecOpsHours = 0;

    const taskBreakdown = tasks.map((t) => {
      totalTickets += t.ticketsPerMonth;
      const manualHours = (t.ticketsPerMonth * t.minManual) / 60;
      const secOpsHours = (t.ticketsPerMonth * t.minSecOps) / 60;
      const hoursSaved = manualHours - secOpsHours;

      totalMonthlyManualHours += manualHours;
      totalMonthlySecOpsHours += secOpsHours;

      return {
        ...t,
        manualHours,
        secOpsHours,
        hoursSaved,
        pctReduction: manualHours > 0 ? Math.round((hoursSaved / manualHours) * 100) : 0,
      };
    });

    const monthlyHoursSaved = totalMonthlyManualHours - totalMonthlySecOpsHours;
    const fteManual = totalMonthlyManualHours / productiveHoursMonth;
    const fteSecOps = totalMonthlySecOpsHours / productiveHoursMonth;
    const ftesReleased = Math.max(0, fteManual - fteSecOps);

    const monthlyCostManual = totalMonthlyManualHours * hourlyRate;
    const monthlyCostSecOps = totalMonthlySecOpsHours * hourlyRate;
    const monthlySavings = Math.max(0, monthlyCostManual - monthlyCostSecOps);
    const annualSavings = monthlySavings * 12;

    const annualCostManual = monthlyCostManual * 12;
    const annualCostSecOps = monthlyCostSecOps * 12;

    const overallPctReduction =
      totalMonthlyManualHours > 0
        ? Math.round((monthlyHoursSaved / totalMonthlyManualHours) * 100)
        : 0;

    return {
      hourlyRate,
      totalTickets,
      totalMonthlyManualHours,
      totalMonthlySecOpsHours,
      monthlyHoursSaved,
      fteManual,
      fteSecOps,
      ftesReleased,
      monthlyCostManual,
      monthlyCostSecOps,
      monthlySavings,
      annualSavings,
      annualCostManual,
      annualCostSecOps,
      overallPctReduction,
      taskBreakdown,
    };
  }, [costPerFte, productiveHoursMonth, tasks]);

  // "Calculate" persists the current inputs + results against this invite/product
  // (works for any product this quiz gets wired up on, not just SecOps — the
  // route and DB row are already keyed by productSlug) and emails the admin a
  // full report: ROI numbers plus the quiz Q&A, not just one or the other.
  // Numbers stay hidden in the UI until the matching button is clicked — the
  // ROI Tasks totals reveal on "Calculate SecOps ROI", everything downstream
  // that depends on cost (labor rate, savings, comparisons) reveals on
  // "Calculate Labor Cost".
  const [roiSaveStatus, setRoiSaveStatus] = useState("idle"); // idle | saving | saved | error
  const [tasksCalculated, setTasksCalculated] = useState(false);
  const [laborCalculated, setLaborCalculated] = useState(false);
  const handleCalculateRoi = async (kind) => {
    if (kind === "tasks") setTasksCalculated(true);
    if (kind === "labor") setLaborCalculated(true);
    if (!inviteId || !user?.email) return;
    setRoiSaveStatus("saving");
    try {
      await apiSend(`/api/invites/${inviteId}/roi-result`, "POST", {
        email: user.email,
        name: user.name,
        productSlug,
        config: {
          currency: selectedCurrency,
          costPerFte,
          productiveHoursMonth,
          tasks,
        },
        // Everything the customer sees on this page besides the raw Q&A (which
        // is already stored from the quiz step) — score, the full recommended
        // tier writeup, and the exposure flags — so the admin report/email is
        // a complete replica of what was shown, not just the ROI numbers.
        results: {
          ...roi,
          score: effectiveScore,
          maxScore: ASSESSMENT_QUESTIONS.length * 2,
          tier: {
            id: tier.id,
            name: tier.name,
            tag: tier.tag,
            subtitle: tier.subtitle,
            description: tier.description,
            whyFits: tier.whyFits,
            features: tier.features,
            recommendedFor: tier.recommendedFor,
            readinessCategory: tier.readinessCategory,
          },
          exposureFlags: exposureFlags.map((f) => ({ dim: f.dim, text: f.text })),
        },
      });
      setRoiSaveStatus("saved");
    } catch (e) {
      console.error("Failed to save ROI result:", e.message);
      setRoiSaveStatus("error");
    }
  };

  const handleRetake = () => {
    resetAssessment();
    navigate(`/experience/${productSlug}/assessment`);
  };

  const scrollToSection = (id) => {
    setActiveNav(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Hide the section-nav bar once the final CTA banner comes into view — the
  // nav has nothing left to jump to at that point, and it would otherwise sit
  // on top of the CTA's own buttons.
  const [ctaVisible, setCtaVisible] = useState(false);
  const ctaRef = useRef(null);
  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setCtaVisible(entry.isIntersecting), {
      threshold: 0.15,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Scroll-spy — highlights whichever nav section is currently scrolled into
  // view, not just the one last clicked. IntersectionObserver's ratio/band
  // math gets ambiguous when adjacent sections both graze a wide trigger
  // zone, so this just picks the last section whose top has crossed a fixed
  // line near the sticky header — simple and exact.
  const NAV_SECTION_IDS = ["recommendation", "why-this-fits", "models", "roi", "cost-savings", "methodology"];
  useEffect(() => {
    const sections = NAV_SECTION_IDS.map((id) => document.getElementById(id)).filter(Boolean);
    if (!sections.length) return;
    const TRIGGER_LINE = 110; // just below the sticky header

    let ticking = false;
    const updateActive = () => {
      ticking = false;
      let current = sections[0];
      for (const s of sections) {
        if (s.getBoundingClientRect().top <= TRIGGER_LINE) current = s;
      }
      setActiveNav(current.id);
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateActive);
    };

    updateActive();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen secops-page-bg text-[#101735] flex flex-col antialiased selection:bg-[#2854F5] selection:text-white relative overflow-hidden">
      <div className="fixed top-0 left-0 w-[540px] h-[540px] rounded-full bg-[#2854F5]/[0.05] opacity-100 blur-[280px] pointer-events-none -translate-x-1/2 -translate-y-1/2 z-0" />
      <div className="fixed bottom-0 right-0 w-[680px] h-[680px] rounded-full bg-[#6C3BFF]/[0.05] opacity-100 blur-[300px] pointer-events-none translate-x-1/3 translate-y-1/3 z-0" />

      <header className="h-14 sm:h-16 border-b border-[#E3E7F5] bg-white/90 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-8 flex items-center justify-between relative">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link to="/experience" className="flex items-center gap-2 hover:opacity-85 transition-opacity">
            <img src="/logo.png" alt="ToggleNow" className="h-6 sm:h-7 w-auto object-contain" />
          </Link>
          <div className="h-4 w-px bg-[#E3E7F5] hidden sm:block" />
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#101735]">
            <Link to={`/experience/${productSlug}`} className="text-[#59627D] hover:text-[#101735]">
              SecOps
            </Link>
            <span className="text-[#59627D]">/</span>
            <span>Recommendation & ROI</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRetake}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E3E7F5] bg-white/90 text-xs font-semibold text-[#59627D] hover:text-[#101735] hover:border-[#2854F5]/40 transition-all cursor-pointer shadow-xs"
          >
            <ArrowCounterClockwise className="size-3.5" />
            <span>Retake Assessment</span>
          </button>
          <UserProfileMenu />
        </div>
      </header>

      <nav
        aria-label="Section navigation"
        className={`fixed inset-x-0 bottom-0 z-40 h-16 bg-white/95 backdrop-blur-md border-t border-[#E3E7F5] px-4 sm:px-8 overflow-x-auto no-scrollbar shadow-[0_-8px_24px_rgba(16,23,53,0.06)] transition-all duration-300 ${
          ctaVisible ? "opacity-0 translate-y-full pointer-events-none" : "opacity-100 translate-y-0"
        }`}
      >
        <div className="h-full max-w-[1240px] mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-1 sm:gap-2 text-xs font-medium text-[#59627D] whitespace-nowrap overflow-x-auto no-scrollbar">
            {[
              ["recommendation", "Recommendation"],
              ["why-this-fits", "Why This Fits"],
              ["models", "The Three Models"],
              ["roi", "ROI Tasks"],
              ["cost-savings", "Annual Savings & Effort"],
              ["methodology", "Methodology"],
            ].map(([id, label], i) => (
              <span key={id} className="flex items-center gap-1 sm:gap-2">
                {i > 0 && <span className="text-[#E3E7F5]">•</span>}
                <button
                  onClick={() => scrollToSection(id)}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    activeNav === id
                      ? "bg-[#EEF3FF] text-[#2854F5] font-bold border border-[#2854F5]/20"
                      : "hover:text-[#101735]"
                  }`}
                >
                  {label}
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              to={`/experience/${productSlug}/book`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-[#2854F5] border border-[#2854F5]/25 bg-white shadow-xs hover:bg-[#EEF3FF] transition-all whitespace-nowrap"
            >
              <CalendarCheck className="size-3.5" weight="bold" />
              <span>Book a Scoping Call</span>
            </Link>

            <Link
              to={`/experience/${productSlug}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-white shadow-xs hover:shadow-md transition-all whitespace-nowrap"
              style={{ background: "linear-gradient(135deg, #2854F5, #6C3BFF)" }}
            >
              <Compass className="size-3.5" weight="bold" />
              <span>Go to Experience Portal</span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-[1240px] w-full mx-auto p-4 sm:p-6 md:p-8 pb-20 space-y-12 relative z-10">
        <section id="recommendation" className="scroll-mt-32 space-y-6">
          <div className="space-y-2 pt-2">
            <div className="inline-flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-[#2854F5]">
                ASSESSMENT COMPLETE
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-[42px] font-extrabold text-[#101735] tracking-tight leading-tight">
              Your SecOps{" "}
              <span className="bg-gradient-to-r from-[#2854F5] to-[#6C3BFF] bg-clip-text text-transparent">
                recommendation is ready.
              </span>
            </h1>
            <p className="text-sm sm:text-base text-[#59627D] leading-relaxed max-w-[760px]">
              Based on your assessment responses, ToggleNow recommends the operating model that best
              matches your current state.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="bg-white rounded-2xl border border-[#E2E6F5] p-6 sm:p-8 md:p-10 shadow-xs relative overflow-hidden grid grid-cols-1 lg:grid-cols-[65fr_35fr] gap-8 items-stretch"
          >
            <div className="absolute top-0 right-0 w-[380px] h-[380px] bg-gradient-to-bl from-[#2854F5]/5 via-[#6C3BFF]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col justify-center space-y-6">
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-[#59627D]">
                    YOUR RECOMMENDED MODEL
                  </p>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-[#2854F5]">
                    {tier.name.toUpperCase()}
                  </p>
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#101735] tracking-tight leading-snug">
                  {tier.subtitle}
                </h2>

                <p className="text-sm sm:text-[15px] text-[#59627D] leading-relaxed max-w-[600px] pt-1">
                  {tier.description}
                </p>
              </div>

              <div className="pt-4 border-t border-[#E3E7F5] text-xs text-[#59627D]">
                <span className="font-semibold text-[#101735]">Engagement scope:</span>{" "}
                {tier.recommendedFor}
              </div>
            </div>

            <div
              className="relative z-10 rounded-2xl border border-[#E2E6F5] p-6 sm:p-8 flex flex-col items-center justify-center text-center shadow-xs"
              style={{
                background:
                  "radial-gradient(circle at 100% 0%, rgba(108,59,255,.14), transparent 45%), linear-gradient(135deg, #F2F5FF, #F7F2FF)",
              }}
            >
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#59627D]">
                ASSESSMENT RESULT
              </span>

              <div className="my-5">
                <p className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-[#2854F5] to-[#6C3BFF] bg-clip-text text-transparent">
                  {effectiveScore} / 24
                </p>
                <p className="text-xs font-semibold text-[#59627D] mt-1.5">Readiness score</p>
              </div>

              <div className="px-3.5 py-1 rounded-xl bg-white/90 border border-[#E3E7F5] shadow-xs">
                <span className="text-xs sm:text-sm font-bold text-[#101735]">
                  {tier.readinessCategory}
                </span>
              </div>
            </div>
          </motion.div>

          <div className="flex items-center justify-center pt-1">
            <button
              onClick={() => scrollToSection("why-this-fits")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#59627D] hover:text-[#2854F5] transition-colors cursor-pointer group"
            >
              <span>Scroll to understand your recommendation</span>
              <ArrowDown className="size-3.5 group-hover:translate-y-0.5 transition-transform" />
            </button>
          </div>
        </section>

        <section id="why-this-fits" className="scroll-mt-32 space-y-4">
          <div className="border-b border-[#E3E7F5] pb-2">
            <p className="text-xs font-bold uppercase tracking-widest text-[#2854F5]">
              ASSESSMENT CONTEXT & JUSTIFICATION
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-[#101735] tracking-tight">Why This Fits You</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-[#E3E7F5] p-6 sm:p-7 shadow-xs flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-[#E3E7F5] pb-3">
                  <span className="size-2 rounded-full bg-[#2854F5]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#101735]">Your Current State</h3>
                </div>

                <p className="text-sm text-[#101735] leading-relaxed">{tier.whyFits}</p>

                <div className="space-y-2 pt-1">
                  <p className="text-xs font-bold text-[#59627D] uppercase tracking-wider">Included in this model:</p>
                  {tier.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-[#101735]">
                      <CheckCircle className="size-4 text-[#0E9F8E] shrink-0 mt-0.5" weight="fill" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[#E3E7F5] text-xs text-[#59627D]">
                <span className="font-semibold text-[#101735]">Ideal for:</span> {tier.recommendedFor}
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-[#E3E7F5] p-6 sm:p-7 shadow-xs flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#E3E7F5] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-[#EF4444]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#101735]">
                      Where Your Exposure is Highest
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-[#EF4444] bg-[#FFF4F2] px-2 py-0.5 rounded-full border border-[#EF4444]/20">
                    {exposureFlags.length} Identified Flag{exposureFlags.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {exposureFlags.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-xs text-[#59627D]">
                      Based on your responses, these operational areas represent critical risk and manual toil:
                    </p>
                    <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                      {exposureFlags.map((flag, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-[#FFF4F2] border border-[#EF4444]/20 flex items-start gap-3">
                          <WarningCircle className="size-4 text-[#EF4444] shrink-0 mt-0.5" weight="fill" />
                          <div>
                            <p className="text-xs font-bold text-[#101735]">{flag.text}</p>
                            <p className="text-[11px] text-[#59627D] mt-0.5">{flag.dim}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-xl bg-[#E8F8F5] border border-[#0E9F8E]/20 text-center space-y-2.5">
                    <ShieldCheck className="size-8 text-[#0E9F8E] mx-auto" weight="fill" />
                    <p className="text-xs font-bold text-[#101735]">No zero-maturity gaps detected</p>
                    <p className="text-xs text-[#59627D] leading-relaxed">
                      Your baseline governance policies are solid. Your primary opportunity is replacing manual
                      checkpoints with autonomous SecOps policy automation.
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-[#E3E7F5] flex items-center justify-between text-xs">
                <span className="text-[#59627D]">Need to adjust your answers?</span>
                <button
                  onClick={handleRetake}
                  className="font-semibold text-[#2854F5] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <ArrowCounterClockwise className="size-3" />
                  <span>Retake Quiz</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <section id="models" className="scroll-mt-32 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-[#E3E7F5] pb-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#2854F5]">THE THREE MODELS</p>
              <h2 className="text-xl sm:text-2xl font-bold text-[#101735] tracking-tight">Yours Highlighted</h2>
            </div>
            <span className="text-xs text-[#59627D]">Select any tier to compare scope & deliverables</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {Object.values(RECOMMENDATION_TIERS).map((t) => {
              const isRecommended = t.id === tier.id;

              return (
                <div
                  key={t.id}
                  className={`rounded-2xl p-6 transition-all duration-200 relative flex flex-col justify-between border ${
                    isRecommended
                      ? "bg-white/95 backdrop-blur-sm border-[#2854F5] shadow-md ring-2 ring-[#2854F5]/15"
                      : "bg-white/90 backdrop-blur-sm border-[#E3E7F5] hover:border-[#2854F5]/30 shadow-xs"
                  }`}
                >
                  {isRecommended && (
                    <div className="absolute -top-3 left-6">
                      <span className="bg-gradient-to-r from-[#2854F5] to-[#6C3BFF] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs">
                        YOUR FIT
                      </span>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-[#59627D] mt-1">
                      <span>{t.name.toUpperCase()}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] ${
                          isRecommended ? "bg-[#EEF3FF] text-[#2854F5]" : "bg-[#F8F9FD] text-[#59627D]"
                        }`}
                      >
                        {t.scoreRange} pts
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-[#101735]">{t.tag}</h3>
                      <p className="text-xs text-[#59627D] font-medium mt-0.5">{t.subtitle}</p>
                    </div>

                    <p className="text-xs text-[#101735]/80 leading-relaxed">{t.description}</p>

                    <div className="pt-3 border-t border-[#E3E7F5] space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#59627D]">Key Highlights:</p>
                      {t.features.slice(0, 3).map((f, fIdx) => (
                        <div key={fIdx} className="flex items-start gap-2 text-xs text-[#101735]">
                          <Check
                            className={`size-3.5 shrink-0 mt-0.5 ${isRecommended ? "text-[#2854F5]" : "text-[#59627D]"}`}
                            weight="bold"
                          />
                          <span className="line-clamp-2">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#E3E7F5]">
                    <Link
                      to={`/experience/${productSlug}/book`}
                      className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        isRecommended
                          ? "bg-[#2854F5] text-white hover:bg-[#16206B] shadow-xs"
                          : "bg-[#F8F9FD] text-[#101735] hover:bg-[#EEF3FF]"
                      }`}
                    >
                      <span>Explore {t.name}</span>
                      <ArrowRight className="size-3" weight="bold" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section id="roi" className="scroll-mt-32 space-y-6">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-[#E3E7F5] p-6 sm:p-8 md:p-10 shadow-xs space-y-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calculator className="size-4 text-[#2854F5]" weight="bold" />
                <span className="text-xs font-bold uppercase tracking-widest text-[#2854F5]">QUANTIFY THE UPSIDE</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#101735] tracking-tight">Your SecOps ROI</h2>
              <p className="text-xs sm:text-sm text-[#59627D] leading-relaxed max-w-[720px]">
                Enter the tickets you handle each month, the time each takes manually today, and the time each will
                take with SecOps. The comparison below shows the effort, headcount and cost saved. Every task is
                manual support-desk work today · SecOps runs it through agent-based or platform-based automation.
              </p>
            </div>

            <div className="overflow-x-auto border border-[#E3E7F5] rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F8F9FD] border-b border-[#E3E7F5] text-[#59627D] font-bold uppercase tracking-wider">
                    <th scope="col" className="py-3 px-4 min-w-[220px]">
                      Task/Activity
                    </th>
                    <th scope="col" className="py-3 px-3 text-right w-36">
                      Tickets/Month
                    </th>
                    <th scope="col" className="py-3 px-3 text-right w-36">
                      Time Required (Manual) in mns
                    </th>
                    <th scope="col" className="py-3 px-3 text-center w-28">
                      Automated with
                    </th>
                    <th scope="col" className="py-3 px-4 text-right w-36 text-[#0E9F8E]">
                      Time Required (SecOps) in mns
                    </th>
                    <th scope="col" className="py-3 px-3 text-right w-32 text-[#0E9F8E]">
                      SecOps hours per month
                    </th>
                    <th scope="col" className="py-3 px-4 text-right w-32">
                      Hours released per month
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3E7F5]">
                  {tasks.map((task) => (
                    <tr key={task.id} className="hover:bg-[#F8F9FD]/60 transition-colors focus-within:bg-[#F8F9FD]/60">
                      <td className="py-3 px-4">
                        <p className="font-bold text-[#101735] text-xs">{task.name}</p>
                        {task.desc && <p className="text-[11px] text-[#59627D] mt-0.5">{task.desc}</p>}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center justify-end">
                          <input
                            type="number"
                            min={0}
                            aria-label={`${task.name} tickets per month`}
                            value={task.ticketsPerMonth}
                            onChange={(e) => handleTaskFieldChange(task.id, "ticketsPerMonth", Number(e.target.value))}
                            className="w-20 px-2 py-1 text-xs font-bold text-right text-[#101735] rounded-lg border border-[#E3E7F5] bg-white hover:border-[#2854F5]/40 focus:border-[#2854F5] focus:ring-2 focus:ring-[#2854F5]/15 outline-none transition-all"
                          />
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center justify-end">
                          <input
                            type="number"
                            min={0}
                            aria-label={`${task.name} minutes each manual`}
                            value={task.minManual}
                            onChange={(e) => handleTaskFieldChange(task.id, "minManual", Number(e.target.value))}
                            className="w-20 px-2 py-1 text-xs font-bold text-right text-[#101735] rounded-lg border border-[#E3E7F5] bg-white hover:border-[#2854F5]/40 focus:border-[#2854F5] focus:ring-2 focus:ring-[#2854F5]/15 outline-none transition-all"
                          />
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            task.via === "AGENT"
                              ? "bg-[#EEF3FF] text-[#2854F5] border border-[#2854F5]/20"
                              : "bg-[#F3EFFF] text-[#6C3BFF] border border-[#6C3BFF]/20"
                          }`}
                        >
                          {task.via}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center justify-end">
                          <input
                            type="number"
                            min={0}
                            aria-label={`${task.name} minutes each SecOps`}
                            value={task.minSecOps}
                            onChange={(e) => handleTaskFieldChange(task.id, "minSecOps", Number(e.target.value))}
                            className="w-20 px-2 py-1 text-xs font-bold text-right text-[#0E9F8E] rounded-lg border border-[#E3E7F5] bg-[#E8F8F5]/50 hover:border-[#0E9F8E]/40 focus:border-[#0E9F8E] focus:ring-2 focus:ring-[#0E9F8E]/15 outline-none transition-all"
                          />
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-[#0E9F8E]">
                        {((task.ticketsPerMonth * task.minSecOps) / 60).toFixed(1)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-[#101735]">
                        {(
                          (task.ticketsPerMonth * task.minManual) / 60 -
                          (task.ticketsPerMonth * task.minSecOps) / 60
                        ).toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>

                <tfoot>
                  <tr className="bg-[#F8F9FD] border-t-2 border-[#E3E7F5] font-extrabold text-[#101735]">
                    <td className="py-4 px-4 uppercase text-[11px] tracking-wider text-[#59627D]">TOTAL MONTHLY EFFORT</td>
                    <td className="py-4 px-3 text-right text-base text-[#101735]">
                      {tasksCalculated ? roi.totalTickets.toLocaleString() : "—"}
                    </td>
                    <td className="py-4 px-3 text-right text-base text-[#EF4444]">
                      {tasksCalculated ? `${Math.round(roi.totalMonthlyManualHours)} h` : "—"}
                    </td>
                    <td className="py-4 px-3 text-center text-xs text-[#59627D] font-semibold">{tasks.length} Workflows</td>
                    <td className="py-4 px-4 text-right text-base text-[#0E9F8E]">
                      {tasksCalculated ? `${Math.round(roi.totalMonthlySecOpsHours)} h` : "—"}
                    </td>
                    <td className="py-4 px-3 text-right text-base text-[#0E9F8E]">
                      {tasksCalculated ? roi.totalMonthlySecOpsHours.toFixed(1) : "—"}
                    </td>
                    <td className="py-4 px-4 text-right text-base text-[#101735]">
                      {tasksCalculated ? roi.monthlyHoursSaved.toFixed(1) : "—"}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <p className="text-[11px] text-[#8A93AC] leading-relaxed">
              ** For the list of tasks/activities and the time required, refer to the Excel. Note that the
              default time should be as per the excel for Time Required (SecOps) in mns. But should be
              changeable (as existing)
            </p>

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#59627D] pt-1">
              <span>All input fields above update the cost & FTE calculations dynamically.</span>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleResetTasks}
                  className="font-semibold text-[#2854F5] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <ArrowCounterClockwise className="size-3" />
                  <span>Reset to Standard Benchmark</span>
                </button>
                <button
                  onClick={() => handleCalculateRoi("tasks")}
                  disabled={roiSaveStatus === "saving"}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white shadow-xs hover:shadow-md transition-all disabled:opacity-60 cursor-pointer"
                  style={{ background: "linear-gradient(135deg, #2854F5, #6C3BFF)" }}
                >
                  <Calculator className="size-3.5" weight="bold" />
                  <span>
                    {roiSaveStatus === "saving"
                      ? "Calculating…"
                      : tasksCalculated
                        ? "Recalculate SecOps ROI"
                        : "Calculate SecOps ROI"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <section id="cost-savings" className="scroll-mt-32 space-y-6">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-[#E3E7F5] p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E3E7F5] pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#59627D]">
                  CONFIG · COST AND CAPACITY ASSUMPTIONS (MAINTAIN CENTRALLY)
                </p>
                <h3 className="text-lg sm:text-xl font-bold text-[#101735] mt-0.5">Labor & Organization Parameters</h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#59627D]">Currency:</span>
                <div className="flex bg-[#F8F9FD] p-1 rounded-xl border border-[#E3E7F5]">
                  {Object.keys(CURRENCIES).map((code) => (
                    <button
                      key={code}
                      onClick={() => handleCurrencyChange(code)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        selectedCurrency === code ? "bg-[#2854F5] text-white shadow-xs" : "text-[#59627D] hover:text-[#101735]"
                      }`}
                    >
                      {CURRENCIES[code].symbol} {code}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 rounded-xl bg-[#F8F9FD] border border-[#E3E7F5] space-y-2">
                <label className="text-xs font-bold text-[#59627D] uppercase tracking-wider block">
                  Fully Loaded Cost per FTE · Year
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-base font-extrabold text-[#2854F5]">
                    {CURRENCIES[selectedCurrency]?.symbol || "$"}
                  </span>
                  <input
                    type="number"
                    min={1000}
                    step={selectedCurrency === "INR" ? 50000 : 2500}
                    value={costPerFte}
                    onChange={(e) => {
                      setCostPerFte(Number(e.target.value));
                      setLaborCalculated(false);
                    }}
                    className="w-full px-3 py-1.5 text-sm font-bold text-[#101735] bg-white border border-[#E3E7F5] rounded-lg focus:border-[#2854F5] outline-none"
                  />
                </div>
                <p className="text-[11px] text-[#59627D]">Annual loaded salary, benefits & overhead</p>
              </div>

              <div className="p-4 rounded-xl bg-[#F8F9FD] border border-[#E3E7F5] space-y-2">
                <label className="text-xs font-bold text-[#59627D] uppercase tracking-wider block">
                  Productive Hours / FTE · Month
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={80}
                    max={220}
                    step={5}
                    value={productiveHoursMonth}
                    onChange={(e) => {
                      setProductiveHoursMonth(Number(e.target.value));
                      setLaborCalculated(false);
                    }}
                    className="w-full px-3 py-1.5 text-sm font-bold text-[#101735] bg-white border border-[#E3E7F5] rounded-lg focus:border-[#2854F5] outline-none"
                  />
                  <span className="text-xs font-bold text-[#59627D]">hrs/mo</span>
                </div>
                <p className="text-[11px] text-[#59627D]">Standard effective utilization benchmark</p>
              </div>

              <div className="p-4 rounded-xl bg-[#EEF3FF] border border-[#2854F5]/20 space-y-1 flex flex-col justify-center">
                <span className="text-xs font-bold text-[#2854F5] uppercase tracking-wider">Derived Cost per Hour</span>
                <p className="text-2xl font-extrabold text-[#101735]">
                  {laborCalculated ? formatCurrency(roi.hourlyRate, selectedCurrency) : "—"}{" "}
                  <span className="text-xs font-medium text-[#59627D]">/ hr</span>
                </p>
                <p className="text-[11px] text-[#59627D]">Loaded Cost ÷ ({productiveHoursMonth} hrs × 12 mo)</p>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                onClick={() => handleCalculateRoi("labor")}
                disabled={roiSaveStatus === "saving"}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white shadow-xs hover:shadow-md transition-all disabled:opacity-60 cursor-pointer"
                style={{ background: "linear-gradient(135deg, #2854F5, #6C3BFF)" }}
              >
                <Calculator className="size-3.5" weight="bold" />
                <span>
                  {roiSaveStatus === "saving"
                    ? "Calculating…"
                    : laborCalculated
                      ? "Recalculate Labor Cost"
                      : "Calculate Labor Cost"}
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[40fr_60fr] gap-6 items-stretch">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-[#E3E7F5] p-6 sm:p-8 shadow-xs flex flex-col justify-between relative overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[#0E9F8E]" />
                  <p className="text-xs font-bold uppercase tracking-widest text-[#59627D]">ESTIMATED ANNUAL SAVING</p>
                </div>

                <div className="py-2">
                  <h3 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#2854F5] tracking-tight">
                    {laborCalculated ? formatCurrency(roi.annualSavings, selectedCurrency) : "—"}
                  </h3>
                  <p className="text-xs sm:text-sm font-semibold text-[#0E9F8E] mt-2 flex items-center gap-1.5">
                    <span>
                      {laborCalculated
                        ? `${roi.ftesReleased.toFixed(1)} FTE released · ${Math.round(roi.monthlyHoursSaved)} hours removed every month`
                        : "Click Calculate Labor Cost to see your savings"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E3E7F5] text-xs text-[#59627D] space-y-1">
                <p>• Immediate operational capacity unlock</p>
                <p>• Zero reliance on emergency contractor surges</p>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-[#E3E7F5] p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#E3E7F5] pb-3">
                <p className="text-xs font-bold uppercase tracking-widest text-[#59627D]">MANUAL · VS · SECOPS</p>
                <span className="text-xs font-bold text-[#0E9F8E] bg-[#E8F8F5] px-2.5 py-0.5 rounded-full border border-[#0E9F8E]/20">
                  {laborCalculated ? `Save ${roi.overallPctReduction}% Effort` : "—"}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E3E7F5] text-[#59627D] font-semibold">
                      <th scope="col" className="py-2">
                        Metric
                      </th>
                      <th scope="col" className="py-2 text-right">
                        Manual / BAU
                      </th>
                      <th scope="col" className="py-2 text-right">
                        With SecOps
                      </th>
                      <th scope="col" className="py-2 text-right text-[#0E9F8E] font-bold">
                        You Save
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E3E7F5] font-medium">
                    <tr>
                      <td className="py-2.5 text-[#101735]">Effort · hours / month</td>
                      <td className="py-2.5 text-right font-bold text-[#101735]">{laborCalculated ? Math.round(roi.totalMonthlyManualHours) : "—"}</td>
                      <td className="py-2.5 text-right font-bold text-[#101735]">{laborCalculated ? Math.round(roi.totalMonthlySecOpsHours) : "—"}</td>
                      <td className="py-2.5 text-right font-extrabold text-[#0E9F8E]">{laborCalculated ? Math.round(roi.monthlyHoursSaved) : "—"}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 text-[#101735]">FTEs needed</td>
                      <td className="py-2.5 text-right font-bold text-[#101735]">{laborCalculated ? roi.fteManual.toFixed(2) : "—"}</td>
                      <td className="py-2.5 text-right font-bold text-[#101735]">{laborCalculated ? roi.fteSecOps.toFixed(2) : "—"}</td>
                      <td className="py-2.5 text-right font-extrabold text-[#0E9F8E]">{laborCalculated ? roi.ftesReleased.toFixed(2) : "—"}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 text-[#101735]">Cost / month</td>
                      <td className="py-2.5 text-right font-bold text-[#101735]">{laborCalculated ? formatCurrency(roi.monthlyCostManual, selectedCurrency) : "—"}</td>
                      <td className="py-2.5 text-right font-bold text-[#101735]">{laborCalculated ? formatCurrency(roi.monthlyCostSecOps, selectedCurrency) : "—"}</td>
                      <td className="py-2.5 text-right font-extrabold text-[#0E9F8E]">{laborCalculated ? formatCurrency(roi.monthlySavings, selectedCurrency) : "—"}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 text-[#101735] font-bold">Cost / year</td>
                      <td className="py-2.5 text-right font-bold text-[#101735]">{laborCalculated ? formatCurrency(roi.annualCostManual, selectedCurrency) : "—"}</td>
                      <td className="py-2.5 text-right font-bold text-[#101735]">{laborCalculated ? formatCurrency(roi.annualCostSecOps, selectedCurrency) : "—"}</td>
                      <td className="py-2.5 text-right font-extrabold text-[#0E9F8E]">{laborCalculated ? formatCurrency(roi.annualSavings, selectedCurrency) : "—"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-[#E3E7F5] p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-[#E3E7F5] pb-3">
              <p className="text-xs font-bold uppercase tracking-widest text-[#59627D]">MONTHLY EFFORT · MANUAL VS SECOPS</p>
              <span className="text-xs font-semibold text-[#59627D]">
                {laborCalculated ? `${Math.round(roi.monthlyHoursSaved)}h total removed` : "—"}
              </span>
            </div>

            {laborCalculated ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-[#101735]">
                    <span>Manual today</span>
                    <span className="text-sm font-extrabold text-[#EF4444]">{Math.round(roi.totalMonthlyManualHours)}h</span>
                  </div>
                  <div className="h-4 bg-[#F8F9FD] rounded-full overflow-hidden">
                    <div className="h-full bg-[#101735] rounded-full w-full transition-all duration-500" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-[#101735]">
                    <span className="text-[#0E9F8E]">With SecOps</span>
                    <span className="text-sm font-extrabold text-[#0E9F8E]">{Math.round(roi.totalMonthlySecOpsHours)}h</span>
                  </div>
                  <div className="h-4 bg-[#F8F9FD] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0E9F8E] rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(
                          6,
                          Math.min(100, (roi.totalMonthlySecOpsHours / (roi.totalMonthlyManualHours || 1)) * 100),
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#59627D]">Click Calculate Labor Cost to see this comparison.</p>
            )}
          </div>
        </section>

        <section id="methodology" className="scroll-mt-32 space-y-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-[#E3E7F5] shadow-xs overflow-hidden">
            <button
              type="button"
              onClick={() => setMethodologyOpen((v) => !v)}
              className="w-full flex items-center justify-between gap-4 p-6 sm:p-8 text-left cursor-pointer"
              aria-expanded={methodologyOpen}
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#59627D]">TRANSPARENCY & METHODOLOGY</p>
                <h3 className="text-lg sm:text-xl font-bold text-[#101735] mt-0.5">How This is Calculated</h3>
              </div>
              <CaretDown
                className={`size-4 text-[#59627D] shrink-0 transition-transform duration-200 ${methodologyOpen ? "rotate-180" : ""}`}
                weight="bold"
              />
            </button>

            {methodologyOpen && (
              <div className="px-6 sm:px-8 pb-6 sm:pb-8 space-y-5">
                {laborCalculated ? (
                  <div className="border-t border-[#E3E7F5] pt-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="p-4 rounded-xl bg-[#F8F9FD] border border-[#E3E7F5] space-y-1.5">
                      <p className="font-bold text-[#101735]">1. Cost per Hour</p>
                      <p className="text-[#59627D] font-mono text-[11px]">Loaded Cost ÷ (Productive Hours × 12)</p>
                      <p className="text-[11px] text-[#101735] pt-1">
                        = {formatCurrency(costPerFte, selectedCurrency)} ÷ ({productiveHoursMonth} × 12) ={" "}
                        <strong>{formatCurrency(roi.hourlyRate, selectedCurrency)} / hr</strong>
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#F8F9FD] border border-[#E3E7F5] space-y-1.5">
                      <p className="font-bold text-[#101735]">2. FTEs Needed</p>
                      <p className="text-[#59627D] font-mono text-[11px]">Monthly Effort in Hours ÷ Productive Hours</p>
                      <p className="text-[11px] text-[#101735] pt-1">
                        = {Math.round(roi.totalMonthlyManualHours)}h ÷ {productiveHoursMonth}h ={" "}
                        <strong>{roi.fteManual.toFixed(2)} FTEs</strong>
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#F8F9FD] border border-[#E3E7F5] space-y-1.5">
                      <p className="font-bold text-[#101735]">3. Annual Saving</p>
                      <p className="text-[#59627D] font-mono text-[11px]">FTEs Released × Loaded Cost per FTE</p>
                      <p className="text-[11px] text-[#101735] pt-1">
                        = {roi.ftesReleased.toFixed(2)} FTE × {formatCurrency(costPerFte, selectedCurrency)} ={" "}
                        <strong className="text-[#0E9F8E]">{formatCurrency(roi.annualSavings, selectedCurrency)}</strong>
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#59627D] border-t border-[#E3E7F5] pt-5">
                    Click Calculate Labor Cost above to see this breakdown.
                  </p>
                )}

                <p className="text-[11px] text-[#59627D] text-center pt-2">
                  Figures are directional estimates driven entirely by your inputs · not a contractual commitment.
                </p>
              </div>
            )}
          </div>
        </section>

        <section
          id="cta"
          ref={ctaRef}
          className="scroll-mt-32 bg-gradient-to-r from-[#2854F5] to-[#6C3BFF] text-white rounded-2xl p-8 sm:p-10 shadow-md relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8"
        >
          <div className="relative z-10 max-w-[620px] space-y-3">
            <span className="inline-block bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
              Next Step in Your Journey
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Ready to pressure-test this against your landscape?
            </h2>
            <p className="text-sm text-white/85 leading-relaxed">
              ToggleNow will walk your team through scope, effort and the transition plan for the{" "}
              <strong>
                {tier.name} ({tier.tag})
              </strong>{" "}
              model. Or continue into the interactive 6-step SecOps showcase.
            </p>
          </div>

          <div className="relative z-10 shrink-0 flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-auto">
            <Link
              to={`/experience/${productSlug}/book`}
              className="py-3 px-6 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <CalendarCheck className="size-4" weight="bold" />
              <span>Book a Scoping Call</span>
            </Link>

            <Link
              to={`/experience/${productSlug}`}
              className="py-3 px-6 rounded-xl bg-white hover:bg-white/95 text-[#2854F5] font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <span>Explore Experience Portal</span>
              <ArrowRight className="size-4" weight="bold" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
