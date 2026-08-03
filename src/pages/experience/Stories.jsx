import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { createPortal } from "react-dom";
import { X, Download } from "lucide-react";
import { SectionHeader, StepNav } from "@/components/StepNav";
import { INDUSTRIES } from "@/lib/experience-data";
import { useExperience } from "@/lib/experience-store";
import { useApiGet } from "@/lib/use-api";
import { useDocumentHead } from "@/lib/use-document-head";

export function StoriesPage() {
  const { product, productSlug } = useOutletContext();
  useDocumentHead({ meta: [{ title: `Customer Stories — ${product?.name ?? ""} Experience` }] });
  const [industry, setIndustry] = useState(null);
  const [openId, setOpenId] = useState(null);
  const markStory = useExperience((s) => s.markStory);
  const addAchievement = useExperience((s) => s.addAchievement);
  const complete = useExperience((s) => s.complete);
  const read = useExperience((s) => s.storiesRead);

  const { data, isLoading, isError } = useApiGet(`/api/stories?product=${productSlug}`);
  const STORIES = data ?? [];

  const filtered = industry ? STORIES.filter((s) => s.industry === industry) : STORIES;
  const open = STORIES.find((s) => s.slug === openId);

  function openStory(id) {
    setOpenId(id);
    markStory(id);
    addAchievement("firstStory");
    complete("stories");
  }

  return (
    <div className="lg:h-full lg:flex lg:flex-col lg:justify-between">
      <div>
        <SectionHeader
          eyebrow="Step 4 · Customer Stories"
          title={`Enterprise SAP teams already running on ${product?.name ?? ""}`}
          description="Real outcomes from Global 2000 organizations across manufacturing, pharma, banking, and utilities."
        />

        <div className="mt-4 lg:mt-3 flex flex-wrap gap-1.5">
          <FilterChip active={industry === null} onClick={() => setIndustry(null)} label="All" />
          {INDUSTRIES.map((i) => (
            <FilterChip key={i} active={industry === i} onClick={() => setIndustry(i)} label={i} />
          ))}
        </div>

        {isLoading ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading stories…</p>
        ) : isError ? (
          <p className="mt-4 text-sm text-destructive">Couldn't load customer stories.</p>
        ) : (
        <div className="mt-4 lg:mt-3 grid gap-3 lg:gap-2.5 md:grid-cols-2">
          {filtered.map((s) => (
            <button
              key={s.slug}
              onClick={() => openStory(s.slug)}
              className={`text-left border p-5 lg:p-4.5 h-[160px] lg:h-[135px] xl:h-[140px] flex flex-col justify-between transition-all duration-[180ms] ease-out hover:-translate-y-[2px] hover:scale-[1.01] hover:shadow-[0_8px_25px_rgba(32,76,237,0.05)] hover:border-primary/40 ${
                read.includes(s.slug)
                  ? "border-primary/40 bg-gradient-to-b from-[#F3F7FF] to-[#EDF4FF]"
                  : "border-[#E3EBFF] bg-gradient-to-b from-[#FCFDFF] to-[#F7FAFF]"
              }`}
              style={{ borderRadius: 16 }}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-caption">
                    {s.industry}
                  </span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    {s.metric}
                  </span>
                </div>
                <h3 className="mt-2.5 lg:mt-2 font-display text-base lg:text-[15px] font-semibold text-foreground">
                  {s.company}
                </h3>
              </div>
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {s.challenge}
              </p>
            </button>
          ))}
        </div>
        )}
      </div>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
              onClick={() => setOpenId(null)}
            />
            <div
              className="relative w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden rounded-3xl border border-white/40 bg-white/95 backdrop-blur-md shadow-[0_25px_60px_rgba(32,76,237,0.14)]"
              style={{ borderRadius: 24 }}
            >
              <div className="flex items-start justify-between border-b border-border px-6 py-4 shrink-0">
                <div>
                  <p className="text-xs font-medium uppercase tracking-widest text-caption">
                    {open.industry}
                  </p>
                  <h3 className="mt-1 font-display text-xl font-semibold">{open.company}</h3>
                </div>
                <button
                  onClick={() => setOpenId(null)}
                  className="text-caption hover:text-foreground"
                >
                  <X className="size-5" />
                </button>
              </div>
              <div className="space-y-5 px-6 py-6 overflow-y-auto flex-1">
                <Row label="Before" value={open.challenge} />
                <Row label="After" value={open.solution} />
                <Row label="Business outcomes" value={open.results} />
                <div className="rounded-2xl bg-surface-alt p-4">
                  <p className="text-xs font-medium uppercase tracking-widest text-primary">ROI</p>
                  <p className="mt-2 font-display text-2xl font-semibold">{open.metric}</p>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-border px-6 py-4 shrink-0">
                <button className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                  <Download className="size-4" /> Download PDF
                </button>
                <button onClick={() => setOpenId(null)} className="btn-primary">
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      <StepNav current="stories" className="mt-auto pt-4 lg:pt-3" />
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-widest text-caption">{label}</p>
      <p className="mt-1.5 text-sm text-foreground">{value}</p>
    </div>
  );
}

function FilterChip({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}
