import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Play, RotateCcw } from "lucide-react";
import { Sparkle } from "@phosphor-icons/react";
import { getSteps, useExperience } from "@/lib/experience-store";
import { useState, useEffect } from "react";

export function StepNav({ current, nextLabel, className, alignEnd = false }) {
  const complete = useExperience((s) => s.complete);
  const setAiOpen = useExperience((s) => s.setAiOpen);
  const { productSlug } = useParams();
  const steps = getSteps(productSlug);
  const idx = steps.findIndex((s) => s.id === current);
  const prev = steps[idx - 1];
  const next = steps[idx + 1];

  return (
    <div
      className={`w-full shrink-0 h-20 lg:h-16 backdrop-blur-sm ${
        className || "mt-auto"
      } flex items-center justify-between border-t border-border ${alignEnd ? "" : "pr-4 lg:pr-6"}`}
    >
      {prev ? (
        <Link
          to={prev.path}
          className="inline-flex items-center gap-1.5 text-sm lg:text-xs text-muted-foreground hover:text-foreground font-medium shrink-0"
        >
          <ArrowLeft className="size-4 lg:size-3.5" />
          <span className="hidden sm:inline">{prev.label}</span>
          <span className="inline sm:hidden">Back</span>
        </Link>
      ) : (
        <span />
      )}
      <div className="flex items-center gap-2.5 lg:gap-3 shrink-0">
        {next ? (
          <Link to={next.path} className="btn-primary lg:py-2 lg:px-4 lg:text-xs shrink-0">
            {nextLabel ?? (
              <>
                <span className="hidden sm:inline">Continue to {next.label}</span>
                <span className="inline sm:hidden">Continue</span>
              </>
            )}
            <ArrowRight className="size-4 lg:size-3.5" />
          </Link>
        ) : null}
        <button
          type="button"
          onClick={() => setAiOpen(true)}
          aria-label="Open AI Expert"
          className="relative inline-flex size-10 lg:size-9 items-center justify-center transition hover:scale-105 active:scale-95 shrink-0 cursor-pointer"
        >
          <img src="/chatbot-icon.webp" alt="" className="absolute inset-0 size-full object-contain" />
          <img src="/sparkle.png" alt="" className="relative size-5.5 lg:size-5 object-contain" />
        </button>
      </div>
    </div>
  );
}

export function SectionHeader({ eyebrow, title, description }) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-medium uppercase tracking-widest text-primary">{eyebrow}</p>
      <h1 className="mt-1.5 font-display text-xl sm:text-2xl md:text-3xl font-semibold leading-tight">
        {title}
      </h1>
      {description && (
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

export function VideoBlock({
  label = "Product demo",
  onPlay,
  onComplete,
  className = "aspect-video",
}) {
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [logIdx, setLogIdx] = useState(0);

  const logs = [
    "Establishing RFC connection to SAP S/4HANA...",
    "Querying user master record database (2,408 active users)...",
    "Running real-time Segregation of Duties (SoD) audit ruleset...",
    "Analyzing license allocation (reclassifying 184 Professional licenses)...",
    "Generating audit-ready compliance packages and evidence logs...",
    "SecOps Optimization Sequence completed successfully.",
  ];

  useEffect(() => {
    let interval;
    if (status === "playing") {
      interval = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            if (interval) clearInterval(interval);
            setStatus("completed");
            onComplete?.();
            return 100;
          }
          const nextP = p + 2.5; // reaches 100% in 4 seconds
          setLogIdx(Math.min(Math.floor((nextP / 100) * logs.length), logs.length - 1));
          return nextP;
        });
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, logs.length, onComplete]);

  const handlePlay = (e) => {
    e.stopPropagation();
    setStatus("playing");
    setProgress(0);
    setLogIdx(0);
    onPlay?.();
  };

  const handleReset = (e) => {
    e.stopPropagation();
    setStatus("playing");
    setProgress(0);
    setLogIdx(0);
    onPlay?.();
  };

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-border bg-foreground select-none ${className}`}
    >
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(32,76,237,0.2),transparent_60%)]" />

      {status === "idle" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-primary-foreground">
          <button
            onClick={handlePlay}
            className="grid size-16 place-items-center rounded-full bg-primary/95 text-primary-foreground shadow-float transition-all hover:bg-primary hover:scale-105 active:scale-95 group"
            aria-label="Play Product Video Demo"
          >
            <Play className="ml-1 size-7 fill-white text-white" />
          </button>
          <div className="text-center">
            <p className="text-base font-semibold tracking-tight text-white">{label}</p>
            <p className="mt-1 text-xs text-muted-foreground/85">
              Click to watch the interactive demonstration
            </p>
          </div>
        </div>
      )}

      {status === "playing" && (
        <div className="absolute inset-0 flex flex-col justify-between p-6 font-mono text-xs text-primary-foreground bg-black/40">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="flex items-center gap-1.5 text-primary font-semibold">
              <span className="size-2 rounded-full bg-primary animate-pulse" />
              LIVE SIMULATION
            </span>
            <span className="text-caption font-semibold">{Math.round(progress)}%</span>
          </div>

          <div className="flex-1 flex flex-col justify-center space-y-2 max-w-lg mx-auto w-full text-left">
            {logs.slice(0, logIdx + 1).map((log, index) => (
              <div
                key={index}
                className={`transition-all duration-300 ${
                  index === logIdx ? "text-primary font-medium" : "text-white/60"
                }`}
              >
                <span className="text-primary mr-2 font-bold">&gt;</span>
                {log}
              </div>
            ))}
          </div>

          {/* Player controls */}
          <div className="space-y-2">
            <div className="relative h-1 w-full rounded-full bg-white/20 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>0:00</span>
              <span>SIMULATING SECURE AUDIT WORKFLOW</span>
              <span>0:04</span>
            </div>
          </div>
        </div>
      )}

      {status === "completed" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-primary-foreground bg-black/65">
          <div className="grid size-14 place-items-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <svg viewBox="0 0 24 24" className="size-6 stroke-2" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-white">Demonstration Completed</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Milestone Unlocked: First Video Watched
            </p>
          </div>
          <button
            onClick={handleReset}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-semibold hover:bg-white/20 transition-all text-white"
          >
            <RotateCcw className="size-3.5" /> Replay Demo
          </button>
        </div>
      )}
    </div>
  );
}
