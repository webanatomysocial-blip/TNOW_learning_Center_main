import { useNavigate, Link, useParams } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Sparkle } from "@phosphor-icons/react";
import { ASSESSMENT_QUESTIONS, getTierFromScore } from "@/lib/assessment-data";
import { useExperience } from "@/lib/experience-store";
import { UserProfileMenu } from "@/components/UserProfileMenu";
import { useDocumentHead } from "@/lib/use-document-head";
import { apiSend } from "@/lib/api";

export function AssessmentPage() {
  const navigate = useNavigate();
  const { productSlug } = useParams();
  useDocumentHead({ meta: [{ title: "Engagement Fit Assessment — ToggleNow" }] });
  const setAssessmentResult = useExperience((s) => s.setAssessmentResult);
  const storedAnswers = useExperience((s) => s.assessmentAnswers);
  const inviteId = useExperience((s) => s.inviteId);
  const user = useExperience((s) => s.user);

  // Best-effort — records the Q&A for the admin panel and emails a summary.
  // Fires in the background; a failure here shouldn't block the user from
  // seeing their recommendation.
  function submitAssessmentResult(finalScore, finalAnswers) {
    if (!inviteId || !user?.email) return;
    const tier = getTierFromScore(finalScore);
    const answerDetails = ASSESSMENT_QUESTIONS.map((q, idx) => {
      const optIdx = finalAnswers[idx];
      const opt = optIdx !== null && optIdx !== undefined ? q.opts[optIdx] : null;
      return {
        dim: q.dim,
        question: q.q,
        answer: opt?.text ?? "Not answered",
        flag: opt?.flag ?? null,
      };
    });
    apiSend(`/api/invites/${inviteId}/assessment-result`, "POST", {
      email: user.email,
      name: user.name,
      productSlug,
      score: finalScore,
      maxScore: ASSESSMENT_QUESTIONS.length * 2,
      tierId: tier.id,
      tierName: tier.tag,
      answers: answerDetails,
    }).catch((e) => {
      console.error("Failed to record assessment result:", e.message);
    });
  }

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState(() => {
    if (storedAnswers && storedAnswers.length === ASSESSMENT_QUESTIONS.length) {
      return storedAnswers;
    }
    return Array(ASSESSMENT_QUESTIONS.length).fill(null);
  });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState("next");

  const currentScore = answers.reduce((sum, ans, idx) => {
    if (ans === null) return sum;
    return sum + (ASSESSMENT_QUESTIONS[idx]?.opts[ans]?.s ?? 0);
  }, 0);

  const answeredCount = answers.filter((a) => a !== null).length;
  const totalQuestions = ASSESSMENT_QUESTIONS.length;
  const maxScore = totalQuestions * 2;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);
  const readinessPercent = Math.min(100, Math.round((currentScore / maxScore) * 100));

  const currentQ = ASSESSMENT_QUESTIONS[currentQuestionIndex];
  const selectedAnswer = answers[currentQuestionIndex];

  const handleSelectOption = useCallback(
    (optionIndex) => {
      if (isTransitioning) return;

      const nextAnswers = [...answers];
      nextAnswers[currentQuestionIndex] = optionIndex;
      setAnswers(nextAnswers);

      const calculatedScore = nextAnswers.reduce((sum, ans, idx) => {
        if (ans === null) return sum;
        return sum + (ASSESSMENT_QUESTIONS[idx]?.opts[ans]?.s ?? 0);
      }, 0);

      setIsTransitioning(true);

      if (currentQuestionIndex < totalQuestions - 1) {
        setTimeout(() => {
          setDirection("next");
          setCurrentQuestionIndex((prev) => prev + 1);
          setIsTransitioning(false);
        }, 320);
      } else {
        setTimeout(() => {
          setAssessmentResult(calculatedScore, nextAnswers);
          submitAssessmentResult(calculatedScore, nextAnswers);
          navigate(`/experience/${productSlug}/recommendation`);
        }, 400);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [answers, currentQuestionIndex, isTransitioning, navigate, productSlug, setAssessmentResult, totalQuestions],
  );

  const handlePrev = useCallback(() => {
    if (currentQuestionIndex > 0 && !isTransitioning) {
      setDirection("prev");
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  }, [currentQuestionIndex, isTransitioning]);

  const handleNext = useCallback(() => {
    if (currentQuestionIndex < totalQuestions - 1 && !isTransitioning) {
      setDirection("next");
      setCurrentQuestionIndex((prev) => prev + 1);
    } else if (currentQuestionIndex === totalQuestions - 1 && selectedAnswer !== null) {
      setAssessmentResult(currentScore, answers);
      submitAssessmentResult(currentScore, answers);
      navigate(`/experience/${productSlug}/recommendation`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    answers,
    currentQuestionIndex,
    currentScore,
    isTransitioning,
    navigate,
    productSlug,
    selectedAnswer,
    setAssessmentResult,
    totalQuestions,
  ]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === "1") {
        handleSelectOption(0);
      } else if (e.key === "2") {
        handleSelectOption(1);
      } else if (e.key === "3") {
        handleSelectOption(2);
      } else if (e.key === "ArrowLeft" && currentQuestionIndex > 0) {
        handlePrev();
      } else if (e.key === "ArrowRight" && selectedAnswer !== null) {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentQuestionIndex, selectedAnswer, handleSelectOption, handlePrev, handleNext]);

  return (
    <div className="min-h-screen secops-page-bg text-[#101735] flex flex-col select-none antialiased relative overflow-hidden">
      <div className="fixed top-0 left-0 w-[540px] h-[540px] rounded-full bg-[#2854F5]/[0.05] opacity-100 blur-[280px] pointer-events-none -translate-x-1/2 -translate-y-1/2 z-0" />
      <div className="fixed bottom-0 right-0 w-[680px] h-[680px] rounded-full bg-[#6C3BFF]/[0.05] opacity-100 blur-[300px] pointer-events-none translate-x-1/3 translate-y-1/3 z-0" />

      <header className="h-14 sm:h-16 border-b border-[#E3E7F5] bg-white/90 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 flex items-center justify-between relative">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link to="/experience" className="flex items-center gap-2 hover:opacity-85 transition-opacity">
            <img src="/logo.png" alt="ToggleNow" className="h-6 sm:h-7 w-auto object-contain" />
          </Link>
          <div className="h-4 w-px bg-[#E3E7F5] hidden sm:block" />
          <span className="text-xs sm:text-sm font-semibold text-[#101735] hidden sm:inline tracking-tight">
            SecOps Fit Assessment
          </span>
        </div>

        <div className="flex items-center gap-3">
          <UserProfileMenu />
        </div>
      </header>

      <div className="border-b border-[#E3E7F5] bg-white/75 backdrop-blur-md px-4 sm:px-8 py-4 sm:py-5 shadow-xs relative z-10">
        <div className="max-w-[1360px] mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#59627D]">12 Questions · 3 min</span>
            </div>
            <h1 className="text-base sm:text-lg md:text-xl lg:text-[22px] font-extrabold text-[#101735] tracking-tight mt-1 whitespace-normal lg:whitespace-nowrap">
              Find the SecOps engagement model that actually fits your operation.
            </h1>
            <p className="text-xs sm:text-[13px] text-[#59627D] leading-relaxed mt-0.5 whitespace-normal xl:whitespace-nowrap overflow-hidden text-ellipsis">
              Twelve questions on how your organization runs access today. Your answers reveal how
              much operational weight you carry manually, and which SecOps model closes the gap.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <Link
              to={`/experience/${productSlug}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 active:scale-95 border border-white/20"
              style={{ background: "linear-gradient(135deg, #2854F5, #6C3BFF)" }}
            >
              <span>Skip to Experience Portal</span>
              <ArrowRight className="size-3.5" weight="bold" />
            </Link>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-[1360px] w-full mx-auto p-4 sm:p-6 md:p-8 grid grid-cols-1 lg:grid-cols-[32fr_68fr] xl:grid-cols-[30fr_70fr] gap-6 items-start relative z-10">
        <aside className="bg-white/95 backdrop-blur-sm rounded-2xl border border-[#E3E7F5] p-5 sm:p-6 shadow-xs flex flex-col justify-between gap-5 sticky top-20 lg:h-[500px]">
          <div>
            <div className="flex items-center justify-between border-b border-[#E3E7F5] pb-3">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#59627D]">
                Operational Readiness
              </span>
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <div>
                <p className="text-3xl font-extrabold text-[#101735] tracking-tight">
                  {currentScore}
                  <span className="text-sm font-semibold text-[#59627D] ml-1">/ {maxScore}</span>
                </p>
                <p className="text-xs text-[#59627D] mt-0.5">Readiness Score</p>
              </div>
            </div>

            <div className="mt-6 flex gap-4 items-stretch h-60">
              <div className="w-4 bg-[#F8F9FD] border border-[#E3E7F5] rounded-full relative overflow-hidden flex flex-col justify-end p-0.5 shrink-0">
                <div
                  className="w-full rounded-full transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{
                    height: `${Math.max(4, readinessPercent)}%`,
                    background:
                      "linear-gradient(to top, #EF4444 0%, #6366F1 30%, #2854F5 55%, #06B6D4 80%, #10B981 100%)",
                  }}
                />
              </div>

              <div className="flex-1 flex flex-col justify-between py-1 text-left">
                <div
                  className={`p-2.5 rounded-xl border transition-all ${
                    currentScore >= 17
                      ? "border-[#0E9F8E]/40 bg-[#E8F8F5]/80 shadow-xs"
                      : "border-transparent text-[#59627D]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-[#101735]">Self-sufficient</p>
                    <span className="text-[10px] font-semibold text-[#0E9F8E]">17–24 pts</span>
                  </div>
                  <p className="text-[11px] text-[#59627D]">Option 3 · Platform only</p>
                </div>

                <div
                  className={`p-2.5 rounded-xl border transition-all ${
                    currentScore >= 9 && currentScore <= 16
                      ? "border-[#6C3BFF]/40 bg-[#F3EFFF]/80 shadow-xs"
                      : "border-transparent text-[#59627D]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-[#101735]">Capable but stretched</p>
                    <span className="text-[10px] font-semibold text-[#6C3BFF]">9–16 pts</span>
                  </div>
                  <p className="text-[11px] text-[#59627D]">Option 2 · Platform + Advisory</p>
                </div>

                <div
                  className={`p-2.5 rounded-xl border transition-all ${
                    currentScore <= 8 && answeredCount > 0
                      ? "border-[#2854F5]/40 bg-[#EEF3FF]/80 shadow-xs"
                      : "border-transparent text-[#59627D]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-[#101735]">Manual & exposed</p>
                    <span className="text-[10px] font-semibold text-[#2854F5]">0–8 pts</span>
                  </div>
                  <p className="text-[11px] text-[#59627D]">Option 1 · Full BaU Takeover</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-[#E3E7F5]">
            <div>
              <div className="flex items-center justify-between text-xs font-medium text-[#59627D] mb-1.5">
                <span>Assessment Progress</span>
                <span className="font-bold text-[#101735]">{progressPercent}%</span>
              </div>
              <div className="h-1.5 w-full bg-[#F8F9FD] border border-[#E3E7F5] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#2854F5] to-[#6C3BFF] transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </aside>

        <section className="flex flex-col justify-between">
          <div className="h-[500px] flex flex-col bg-white/95 backdrop-blur-sm rounded-2xl border border-[#E3E7F5] p-6 sm:p-8 md:p-10 shadow-sm relative overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E3E7F5] pb-4 mb-6 shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-xs font-extrabold text-[#2854F5] bg-[#EEF3FF] px-2.5 py-1 rounded-lg border border-[#2854F5]/20">
                  {currentQuestionIndex + 1 < 10 ? `0${currentQuestionIndex + 1}` : currentQuestionIndex + 1} / 12
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-[#59627D]">
                  {currentQ.dim}
                </span>
              </div>

              <div className="text-xs font-medium text-[#59627D]">
                <span>Select 1 option</span>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentQ.id}
                initial={{ opacity: 0, x: direction === "next" ? 24 : -24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction === "next" ? -24 : 24 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="flex-1 space-y-6"
              >
                <h2 className="text-xl sm:text-2xl font-bold text-[#101735] leading-snug tracking-tight">
                  {currentQ.q}
                </h2>

                <div className="space-y-3.5 pt-2">
                  {currentQ.opts.map((opt, optIdx) => {
                    const isSelected = selectedAnswer === optIdx;

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleSelectOption(optIdx)}
                        className={`w-full text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex items-start gap-4 cursor-pointer outline-none ${
                          isSelected
                            ? "border-[#2854F5] bg-[#EEF4FF] shadow-md ring-2 ring-[#2854F5]/25"
                            : "border-[#E3E7F5] bg-[#F7F4FE] hover:bg-[#EFE8FD] hover:border-[#6C3BFF]/40 hover:shadow-xs"
                        }`}
                      >
                        <div className="flex items-center shrink-0 mt-0.5">
                          <span
                            className={`grid size-5 place-items-center rounded-full border transition-all ${
                              isSelected
                                ? "border-[#2854F5] bg-[#2854F5] text-white"
                                : "border-[#6C3BFF]/40 bg-white text-transparent"
                            }`}
                          >
                            <Check className="size-3" weight="bold" />
                          </span>
                        </div>

                        <div className="flex-1">
                          <p
                            className={`text-sm sm:text-[15px] leading-relaxed transition-colors ${
                              isSelected ? "font-bold text-[#101735]" : "font-medium text-[#101735]/90"
                            }`}
                          >
                            {opt.text}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-4 flex items-center justify-between px-2">
            <button
              onClick={handlePrev}
              disabled={currentQuestionIndex === 0 || isTransitioning}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                currentQuestionIndex === 0
                  ? "opacity-30 pointer-events-none text-[#59627D]"
                  : "text-[#59627D] hover:text-[#101735] hover:bg-white border border-transparent hover:border-[#E3E7F5] active:scale-98"
              }`}
            >
              <ArrowLeft className="size-3.5" weight="bold" />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-3">
              {currentQuestionIndex === totalQuestions - 1 && selectedAnswer !== null ? (
                <button
                  onClick={handleNext}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#2854F5] to-[#6C3BFF] hover:opacity-95 text-white text-xs font-semibold shadow-md active:scale-98 transition-all cursor-pointer"
                >
                  <span>View Recommendation & ROI</span>
                  <ArrowRight className="size-3.5" weight="bold" />
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={selectedAnswer === null || isTransitioning}
                  className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold transition-all ${
                    selectedAnswer === null
                      ? "opacity-40 pointer-events-none bg-[#E3E7F5] text-[#59627D]"
                      : "bg-[#2854F5] hover:bg-[#16206B] text-white shadow-xs active:scale-98 cursor-pointer"
                  }`}
                >
                  <span>Continue</span>
                  <ArrowRight className="size-3.5" weight="bold" />
                </button>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
