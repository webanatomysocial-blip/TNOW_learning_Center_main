import { Play, RotateCcw } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { SectionHeader, StepNav } from "@/components/StepNav";
import { useExperience } from "@/lib/experience-store";
import { useApiGet } from "@/lib/use-api";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useDocumentHead } from "@/lib/use-document-head";
import { embedVideo, extractGumletId } from "@/lib/video-embed";
import { resolveWhyIcon as resolveIcon } from "@/lib/why-icons";

const logs = [
  "Establishing RFC connection to SAP S/4HANA...",
  "Querying user master record database (2,408 active users)...",
  "Running real-time Segregation of Duties (SoD) audit ruleset...",
  "Analyzing license allocation (reclassifying 184 Professional licenses)...",
  "Generating audit-ready compliance packages and evidence logs...",
  "SecOps Optimization Sequence completed successfully.",
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 110,
      damping: 14,
    },
  },
};

export function WhyPage() {
  const { product, productSlug } = useOutletContext();
  useDocumentHead({ meta: [{ title: `Why ${product?.name ?? ""} — Experience` }] });
  const incVideos = useExperience((s) => s.incVideos);
  const addAchievement = useExperience((s) => s.addAchievement);
  const complete = useExperience((s) => s.complete);

  const { data: featuresData, isLoading: featuresLoading } = useApiGet(
    `/api/why-features?product=${productSlug}`,
  );
  const { data: pageData, isLoading: pageLoading } = useApiGet(
    `/api/experience-pages?product=${productSlug}&page=why`,
  );
  const FEATURES = (featuresData ?? []).map((f) => ({
    icon: resolveIcon(f.icon),
    title: f.title,
    desc: f.description,
  }));
  const headline = pageData?.headline || `Why enterprise SAP teams choose ${product?.name ?? "us"}`;
  const description = pageData?.description || "";
  const videoTitle = pageData?.extra?.videoTitle || "Walkthrough Demo";
  const videoDuration = pageData?.extra?.videoDuration || "";
  const gumletId = pageData?.extra?.gumletId || "";
  const gumletVideoId = extractGumletId(gumletId);
  const videoUrl = gumletVideoId
    ? `https://play.gumlet.io/embed/${gumletVideoId}`
    : (pageData?.extra?.videoUrl || "");
  const realVideo = videoUrl ? embedVideo(videoUrl) : null;

  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [logIdx, setLogIdx] = useState(0);

  useEffect(() => {
    let interval;
    if (status === "playing") {
      interval = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            if (interval) clearInterval(interval);
            setStatus("completed");
            complete("why");
            return 100;
          }
          const nextP = p + 2.5; // Reaches 100 in 4 seconds
          setLogIdx(Math.min(Math.floor((nextP / 100) * logs.length), logs.length - 1));

          // When the video reaches ~90% watched, animate the progress updates
          if (nextP >= 90 && p < 90) {
            complete("why");
          }

          return nextP;
        });
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, complete]);

  const handlePlay = () => {
    setStatus("playing");
    setProgress(0);
    setLogIdx(0);
    incVideos();
    addAchievement("firstVideo");
  };

  const handleReset = () => {
    setStatus("playing");
    setProgress(0);
    setLogIdx(0);
    incVideos();
  };

  return (
    <div className="h-full flex flex-col justify-between overflow-hidden">
      <div className="flex-1 overflow-y-auto pb-6 scrollbar-none space-y-4 lg:space-y-3">
        <SectionHeader
          eyebrow={`Step 2 · Why ${product?.name ?? ""}`}
          title={headline}
          description={description}
        />

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 xl:gap-6 items-stretch mt-4">
          {/* Left Column: Video Block wrapped in premium card container */}
          <div className="xl:col-span-7">
            <div
              className="p-4 h-full flex flex-col justify-center rounded-[20px]"
              style={{
                background:
                  "linear-gradient(135deg, rgba(40, 84, 245, 0.06), rgba(108, 59, 255, 0.05)), #FFFFFF",
                border: "1px solid #E3E7F5",
              }}
            >
              {realVideo ? (
                <div
                  className="relative w-full h-80 lg:h-72.5 xl:h-75 rounded-[18px] overflow-hidden border border-slate-800 bg-black"
                  onClick={() => {
                    incVideos();
                    addAchievement("firstVideo");
                    complete("why");
                  }}
                >
                  {realVideo.type === "iframe" ? (
                    <iframe
                      src={realVideo.src}
                      title={videoTitle}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : realVideo.type === "video" ? (
                    <video controls src={realVideo.src} className="h-full w-full" />
                  ) : (
                    <a
                      href={realVideo.src}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-full w-full items-center justify-center text-white underline"
                    >
                      Watch video
                    </a>
                  )}
                </div>
              ) : (
              <div className="relative w-full h-80 lg:h-72.5 xl:h-75 rounded-[18px] overflow-hidden border border-slate-800 bg-[#0B0F19]">
                {status === "idle" && (
                  <div className="absolute inset-0 bg-linear-to-br from-[#0F172A] to-[#020617] text-white flex flex-col md:flex-row">
                    {/* Left Half: Watch Info */}
                    <div
                      onClick={handlePlay}
                      className="flex-1 p-6 md:p-8 flex flex-col justify-between cursor-pointer group/inner select-none"
                    >
                      <div>
                        <span className="text-[9px] font-bold text-white bg-white/10 px-2.5 py-1 rounded-full uppercase tracking-wider border border-white/20">
                          Why {product?.name}
                        </span>
                        <h3 className="mt-4 font-display text-xl md:text-2xl font-medium tracking-tight text-white leading-tight">
                          {videoTitle}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 font-sans">
                          {videoDuration ? `${videoDuration} walkthrough` : "Interactive walkthrough"}
                        </p>
                      </div>

                      <div className="flex items-center gap-3.5 mt-4">
                        <div className="grid size-11 place-items-center rounded-full bg-primary text-white shadow-lg transition-transform duration-300 group-hover/inner:scale-105 group-hover/inner:bg-primary/90 shadow-primary/30">
                          <Play className="ml-0.5 size-5 fill-white" />
                        </div>
                        <span className="text-[13px] font-bold text-slate-200 group-hover/inner:text-white transition-colors">
                          Watch now
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {status === "playing" && (
                  <div className="absolute inset-0 flex flex-col justify-between p-5 md:p-6 font-mono text-xs text-primary-foreground bg-[#090D1A]">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="flex items-center gap-1.5 text-primary font-semibold text-[10px] md:text-xs">
                        <span className="size-2 rounded-full bg-primary animate-pulse" />
                        SECURE AUDIT PIPELINE ACTIVE
                      </span>
                      <span className="text-slate-400 font-semibold text-[10px] md:text-xs">
                        {Math.round(progress)}%
                      </span>
                    </div>

                    <div className="flex-1 flex flex-col justify-center space-y-2 max-w-lg mx-auto w-full text-left my-4">
                      {logs.slice(0, logIdx + 1).map((log, index) => (
                        <div
                          key={index}
                          className={`transition-all duration-300 text-[11px] md:text-xs ${
                            index === logIdx ? "text-primary font-medium" : "text-slate-300/80"
                          }`}
                        >
                          <span className="text-primary mr-2 font-bold">&gt;</span>
                          {log}
                        </div>
                      ))}
                    </div>

                    {/* Player controls */}
                    <div className="space-y-2">
                      <div className="relative h-1 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-100"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>0:00</span>
                        <span className="uppercase tracking-wider font-semibold">
                          SIMULATING SECURE AUDIT WORKFLOW
                        </span>
                        <span>0:04</span>
                      </div>
                    </div>
                  </div>
                )}

                {status === "completed" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white bg-[#0B0F19]/95 p-6 text-center">
                    <div className="grid size-12 place-items-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <svg
                        viewBox="0 0 24 24"
                        className="size-5 stroke-2"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-base font-bold text-white">Walkthrough Completed</p>
                      <p className="mt-1 text-xs text-slate-400">
                        Milestone Unlocked: Step 2 Done! You're ready to proceed.
                      </p>
                    </div>
                    <button
                      onClick={handleReset}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800 hover:bg-slate-700 px-4 py-1.5 text-xs font-semibold hover:scale-[1.02] active:scale-95 transition-all text-white cursor-pointer"
                    >
                      <RotateCcw className="size-3.5" /> Replay Walkthrough
                    </button>
                  </div>
                )}
              </div>
              )}
            </div>
          </div>

          {/* Right Column: Key Takeaways cards */}
          <div className="xl:col-span-5 flex flex-col justify-between space-y-3">
            <div className="space-y-3">
              <div className="border-b border-[#E3E7F5] pb-1.5">
                <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-[#6C3BFF]">
                  Key Takeaways
                </p>
              </div>

              {/* Feature list staggered animations */}
              {featuresLoading ? (
                <p className="text-xs text-muted-foreground">Loading key takeaways…</p>
              ) : FEATURES.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No key takeaways configured for this product yet.
                </p>
              ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                {FEATURES.map((f, i) => {
                  const Icon = f.icon;
                  return (
                    <motion.div
                      key={i}
                      variants={cardVariants}
                      className="group flex flex-col p-4 lg:p-3.5 rounded-[20px] min-h-[155px] lg:min-h-[135px] xl:min-h-[140px] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(40, 84, 245, 0.06), rgba(108, 59, 255, 0.05)), #FFFFFF",
                        border: "1px solid #E3E7F5",
                      }}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-7.5 items-center justify-center rounded-lg bg-[#F3EFFF] text-[#6C3BFF] shrink-0 border border-[#6C3BFF]/20 shadow-xs">
                          <Icon className="size-4 stroke-[2.25] text-[#6C3BFF]" />
                        </div>
                        <h3 className="text-[13px] font-bold text-[#101735] tracking-tight leading-tight">
                          {f.title}
                        </h3>
                      </div>
                      <p className="mt-2 text-[11px] text-slate-500 leading-snug font-normal">
                        {f.desc}
                      </p>
                    </motion.div>
                  );
                })}
              </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      <StepNav current="why" className="mt-auto" />
    </div>
  );
}
