import { Link, useOutletContext } from "react-router-dom";
import { Check, Play, Clock } from "lucide-react";
import { SectionHeader, StepNav } from "@/components/StepNav";
import { useExperience } from "@/lib/experience-store";
import { useApiGet } from "@/lib/use-api";
import { useDocumentHead } from "@/lib/use-document-head";

const CARD_THEMES = [
  {
    gradient: "bg-gradient-to-br from-[#df5c5c] via-[#cc3c8c] to-[#7c2ebd] bg-[#cc3c8c]",
    shadow: "shadow-[#cc3c8c]/15",
  },
  {
    gradient: "bg-gradient-to-br from-[#1070e6] via-[#4d2dbd] to-[#120f3a] bg-[#4d2dbd]",
    shadow: "shadow-[#4d2dbd]/15",
  },
  {
    gradient: "bg-gradient-to-br from-[#38bdf8] via-[#0369a1] to-[#0c4a6e] bg-[#0369a1]",
    shadow: "shadow-[#0369a1]/15",
  },
  {
    gradient: "bg-gradient-to-br from-[#10b981] via-[#0f766e] to-[#115e59] bg-[#0f766e]",
    shadow: "shadow-[#0f766e]/15",
  },
  {
    gradient: "bg-gradient-to-br from-[#ec4899] via-[#8b5cf6] to-[#3b82f6] bg-[#8b5cf6]",
    shadow: "shadow-[#8b5cf6]/15",
  },
  {
    gradient: "bg-gradient-to-br from-[#f59e0b] via-[#ea580c] to-[#991b1b] bg-[#ea580c]",
    shadow: "shadow-[#ea580c]/15",
  },
];

export function TourGrid() {
  const { product, productSlug } = useOutletContext();
  useDocumentHead({ meta: [{ title: `Product Tour — ${product?.name ?? ""} Experience` }] });
  const viewed = useExperience((s) => s.capabilitiesViewed);
  const { data, isLoading, isError } = useApiGet(`/api/capabilities?product=${productSlug}`);
  const CAPABILITIES = data ?? [];

  return (
    <div className="lg:h-full lg:flex lg:flex-col lg:justify-between">
      <div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/80 pb-3 mb-4">
          <div className="max-w-xl">
            <p className="text-[10px] font-medium uppercase tracking-widest text-primary">
              Step 3 · Product Tour
            </p>
            <h1 className="mt-1.5 font-display text-xl font-semibold leading-tight text-foreground">
              Explore {product?.name ?? ""} capability by capability
            </h1>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Six focused tours, ~2 minutes each. Watch the ones most relevant to your role — we'll
              mark them complete automatically.
            </p>
          </div>

          {/* Product Tour Progress Section */}
          <div className="rounded-xl border border-border bg-card p-3 w-full lg:max-w-xs shrink-0 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-xs font-semibold text-foreground">
                  Tour progress
                </h3>
              </div>
              <span className="text-[10px] font-semibold text-primary shrink-0 ml-4 bg-primary/10 px-2 py-0.5 rounded-full">
                {viewed.length} / 6 completed
              </span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted relative">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${(viewed.length / 6) * 100}%` }}
              />
            </div>
            {viewed.length === 6 && (
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <div className="grid size-4 place-items-center rounded-full bg-emerald-500/15 text-emerald-500">
                  <Check className="size-2.5 stroke-[3px]" />
                </div>
                All demos completed!
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <p className="mt-3 text-sm text-muted-foreground">Loading tour…</p>
        ) : isError ? (
          <p className="mt-3 text-sm text-destructive">Couldn't load capabilities.</p>
        ) : (
        <div className="mt-3 lg:mt-2 grid gap-4 lg:gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((c, idx) => {
            const done = viewed.includes(c.slug);
            const theme = CARD_THEMES[idx % CARD_THEMES.length];
            return (
              <Link
                key={c.slug}
                to={`/experience/${productSlug}/tour/${c.slug}`}
                className="group flex flex-col overflow-hidden rounded-[16px] border border-[#E3EBFF] bg-gradient-to-b from-[#FCFDFF] to-[#F7FAFF] transition-all duration-[180ms] ease-out hover:-translate-y-[2px] hover:scale-[1.01] hover:shadow-[0_8px_25px_rgba(32,76,237,0.05)] hover:border-primary/40"
              >
                {/* Top Visual Thumbnail Area */}
                <div
                  className={`relative w-full aspect-[2.4/1] lg:aspect-[2.8/1] overflow-hidden ${theme.gradient}`}
                >
                  {/* Top Right: watch status indicator — only set once the video is actually
                      finished (see Capability.jsx), never a manual shortcut */}
                  <div className="absolute top-2.5 right-2.5 z-20">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[9px] font-semibold backdrop-blur-md border ${
                        done
                          ? "bg-emerald-500/95 border-emerald-400 text-white shadow-sm"
                          : "bg-black/35 border-white/20 text-white"
                      }`}
                    >
                      {done ? (
                        <>
                          <Check className="size-2.5 stroke-[3px]" /> Watched
                        </>
                      ) : (
                        <>Not watched</>
                      )}
                    </span>
                  </div>
                </div>

                {/* Bottom Metadata Content Area */}
                <div className="flex p-4 lg:p-3 gap-2 justify-between items-start flex-1 bg-transparent">
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#204CED]/90 block mb-1">
                      SAP Security
                    </span>
                    <h3 className="font-display text-[14px] font-semibold tracking-tight text-slate-800 leading-snug group-hover:text-primary transition-colors line-clamp-1">
                      {c.title}
                    </h3>

                    {/* Metadata Row */}
                    <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground/90 font-normal">
                      <span className="inline-flex items-center gap-0.5">
                        <Clock className="size-3 text-muted-foreground" />
                        <span>{c.duration} mins</span>
                      </span>
                      <span className="size-1 rounded-full bg-border" />
                      <span>Video Tour</span>
                    </div>
                  </div>

                  {/* Right Arrow/Play Circular Button - aligned to bottom */}
                  <div className="grid size-7 place-items-center rounded-full bg-[#204CED] text-white transition-all duration-300 group-hover:scale-105 shadow-sm shrink-0 self-end">
                    <Play className="ml-0.5 size-2.5 fill-white text-white" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        )}
      </div>

      <StepNav current="tour" />
    </div>
  );
}
