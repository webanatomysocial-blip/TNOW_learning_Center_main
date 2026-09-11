import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { createPortal } from "react-dom";
import { ArrowRight, Download, X } from "lucide-react";
import { SectionHeader, StepNav } from "@/components/StepNav";
import { INDUSTRIES } from "@/lib/experience-data";
import { useExperience } from "@/lib/experience-store";
import { useApiGet } from "@/lib/use-api";
import { useDocumentHead } from "@/lib/use-document-head";
import { API_URL } from "@/lib/api";

function resolveImage(url) {
  if (!url) return null;
  return url.startsWith("/") ? `${API_URL}${url}` : url;
}

// Single source of truth for both the card badges and the popup stat tiles —
// stat1/stat2 (set in the admin) drive both, falling back to the older
// free-text `metric` field only when stat1 was never filled in, so the card
// and popup can't show two different numbers for the same story.
function getStats(story) {
  return [
    story.stat1_value
      ? { value: story.stat1_value, label: story.stat1_label, description: story.stat1_description }
      : story.metric && { value: story.metric, label: "Result", description: story.results },
    story.stat2_value && { value: story.stat2_value, label: story.stat2_label, description: story.stat2_description },
  ].filter(Boolean);
}

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
    <div className="h-full flex flex-col justify-between overflow-hidden">
      <div className="flex-1 overflow-y-auto pb-6 scrollbar-none">
        <SectionHeader
          eyebrow="Step 4 · Customer Stories"
          title={`Hear from Enterprise SAP Teams Who've Experienced the Benefits of ${product?.name ?? ""}`}
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
        <div className="mt-4 lg:mt-3 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <StoryCard key={s.slug} story={s} read={read.includes(s.slug)} onOpen={() => openStory(s.slug)} />
          ))}
        </div>
        )}
      </div>

      {open && <StoryModal story={open} onClose={() => setOpenId(null)} />}

      <StepNav current="stories" />
    </div>
  );
}

function StoryCard({ story, read, onOpen }) {
  const photo = resolveImage(story.photo_url);
  const stats = getStats(story);
  return (
    <div
      onClick={onOpen}
      className={`flex flex-col overflow-hidden glass-card glass-card-hover cursor-pointer ${
        read ? "border-[#6C3BFF]/45 shadow-[0_4px_20px_0_rgba(108,59,255,0.06)]" : ""
      }`}
    >
      <div
        className="relative h-[160px] p-5 flex flex-col justify-between overflow-hidden"
        style={{
          background: photo
            ? undefined
            : "linear-gradient(135deg, #12143A 0%, #1E2159 60%, #2B2F82 100%)",
        }}
      >
        {photo && (
          <>
            <img src={photo} alt="" className="absolute inset-0 size-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-black/60" />
          </>
        )}
        <div className="relative flex items-start justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-white/80 pt-0.5">
            {story.industry}
          </span>
          <div className="flex flex-wrap justify-end gap-1.5">
            {stats.map((stat, i) => (
              <span
                key={i}
                className="rounded-full bg-black/40 backdrop-blur-sm border border-white/20 px-2.5 py-0.5 text-[10px] font-semibold text-white whitespace-nowrap"
              >
                {stat.value} {stat.label}
              </span>
            ))}
          </div>
        </div>
        <h3 className="relative font-display text-lg font-semibold text-white leading-snug">
          {story.company}
        </h3>
      </div>

      <div className="flex flex-col flex-1 -mt-px p-5">
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-1">
          {story.challenge}
        </p>
        <button
          onClick={onOpen}
          className="mt-4 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-foreground hover:text-primary transition-colors"
        >
          Read More <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

function StoryModal({ story, onClose }) {
  const photo = resolveImage(story.photo_url);
  // Always render the quote + stat-tile layout — fall back to derived values
  // (company/industry, the metric badge) instead of a different plain layout
  // when an admin hasn't filled in the dedicated testimonial fields yet. The
  // name itself has no sensible fallback though — showing the company name
  // where a person's name goes reads as if that were the person's name, so
  // when person_name isn't set, just show the title alone with no name line.
  const personName = story.person_name || "";
  const personTitle = story.person_title || story.industry;
  const stats = [
    story.stat1_value
      ? { value: story.stat1_value, label: story.stat1_label, description: story.stat1_description }
      : { value: story.metric, label: "Result", description: story.results },
    story.stat2_value && { value: story.stat2_value, label: story.stat2_label, description: story.stat2_description },
  ].filter(Boolean);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className="relative w-full max-w-7xl max-h-[90vh] flex flex-col overflow-hidden rounded-3xl border border-white/40 bg-white shadow-[0_25px_60px_rgba(32,76,237,0.14)]"
        style={{ borderRadius: 24 }}
      >
        <div className="flex items-start justify-between border-b border-border px-6 py-4 shrink-0">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-caption">{story.industry}</p>
            <h3 className="mt-1 font-display text-xl font-semibold">{story.company}</h3>
          </div>
          <button onClick={onClose} className="text-caption hover:text-foreground">
            <X className="size-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-8 py-8">
          <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_280px] items-center">
            <div className="flex gap-5 items-start">
              {photo && (
                <img
                  src={photo}
                  alt={personName || personTitle || story.company}
                  className="max-w-[7rem] max-h-28 w-auto h-auto shrink-0 object-contain"
                />
              )}
              <div>
                <p className="font-display text-lg text-foreground leading-relaxed">
                  “{[story.challenge, story.solution, story.results].filter(Boolean).join(" ")}”
                </p>
                {personName && <p className="mt-4 text-sm font-semibold text-foreground">{personName}</p>}
                {personTitle && (
                  <p className={`text-xs text-primary font-medium ${personName ? "" : "mt-4"}`}>
                    {personTitle}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-4">
              {stats.map((stat, i) => (
                <div key={i} className="rounded-2xl border border-[#E3EBFF] bg-[#F7FAFF] p-5">
                  <p className="font-display text-2xl font-bold text-primary">{stat.value}</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">{stat.label}</p>
                  {stat.description && (
                    <p className="text-xs text-muted-foreground mt-1 leading-snug">{stat.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border px-6 py-4 shrink-0">
          {story.download_url ? (
            <a
              href={resolveImage(story.download_url)}
              download
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <Download className="size-4" /> Download Case Study PDF
            </a>
          ) : (
            <span />
          )}
          <button onClick={onClose} className="btn-primary">
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
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
