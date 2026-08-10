import { useNavigate, useOutletContext } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarCheck,
  CalendarClock,
  Sparkles,
  Users,
  Video,
  CalendarX,
} from "lucide-react";
import { SectionHeader } from "@/components/StepNav";
import { useExperience } from "@/lib/experience-store";
import { useApiGet } from "@/lib/use-api";
import { useDocumentHead } from "@/lib/use-document-head";

// Admin can paste either a Calendly or a TidyCal scheduling link. A real one always
// has a path with two segments — /your-handle/event-type — e.g.
// https://calendly.com/togglenow/workshop or https://tidycal.com/togglenow/workshop.
// Anything without that (a bare domain root, or nothing configured at all) isn't
// embeddable as a scheduler — the provider's own marketing site loads instead, which
// is worse than just telling the admin it isn't set up yet.
function detectScheduler(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    const segments = u.pathname.split("/").filter(Boolean);
    if (segments.length < 1) return null;
    if (host === "calendly.com") return "calendly";
    if (host === "tidycal.com") return "tidycal";
    return null;
  } catch {
    return null;
  }
}

const PROVIDER_LABEL = { calendly: "Calendly", tidycal: "TidyCal" };

const EXPECTATIONS = [
  { icon: CalendarClock, label: "45 minutes", desc: "Focused working session, not a sales pitch." },
  { icon: Users, label: "Your consultant", desc: "Matched to what you explored in this tour." },
  { icon: Video, label: "Live walkthrough", desc: "Screen-share tailored to your SAP landscape." },
];

export function BookPage() {
  const { product, productSlug } = useOutletContext();
  useDocumentHead({ meta: [{ title: `Book Workshop — ${product?.name ?? ""} Experience` }] });
  const { complete, addAchievement } = useExperience();
  const [notes, setNotes] = useState("");
  const [scheduled, setScheduled] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const navigate = useNavigate();

  const { data: pageData } = useApiGet(`/api/experience-pages?product=${productSlug}&page=book`);
  const headline = pageData?.headline || "Let's tailor a workshop for your team";
  const description =
    pageData?.description ||
    "A 45-minute working session with a consultant, shaped by everything you've explored.";
  const schedulerUrl = pageData?.extra?.calendlyUrl || "";
  const provider = detectScheduler(schedulerUrl);
  const hasScheduler = !!provider;

  function schedule() {
    if (scheduled) return;
    setScheduled(true);
    addAchievement("workshopReady");
    complete("book");
    navigate(`/experience/${productSlug}/success`);
  }

  // Calendly posts a window message when the visitor actually books a slot in the
  // embedded widget — that's the real signal a workshop was scheduled, not just that
  // the page was viewed. TidyCal doesn't document an equivalent postMessage event, so
  // for TidyCal the "I've scheduled my session" button below is the only confirmation
  // path.
  useEffect(() => {
    if (provider !== "calendly") return;
    function handleMessage(e) {
      if (typeof e.data !== "object" || !e.data) return;
      if (e.data.event === "calendly.event_scheduled") {
        schedule();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productSlug, provider]);

  // Calendly supports theming/embed query params; TidyCal's embed doesn't document an
  // equivalent, so its URL is passed through unmodified.
  let embedSrc = schedulerUrl;
  if (provider === "calendly") {
    const embedParams = new URLSearchParams({
      embed_domain: typeof window !== "undefined" ? window.location.hostname : "",
      embed_type: "Inline",
      background_color: "ffffff",
      text_color: "0f172a",
      primary_color: "204ced",
      hide_gdpr_banner: "1",
    });
    embedSrc = `${schedulerUrl}${schedulerUrl.includes("?") ? "&" : "?"}${embedParams.toString()}`;
  }

  return (
    <div className="lg:h-full lg:flex lg:flex-col lg:justify-between">
      <div>
        <SectionHeader
          eyebrow="Step 6 · Book Workshop"
          title={headline}
          description={description}
        />

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Calendly scheduler (7 cols) */}
          <div className="lg:col-span-7">
            <div
              className="border border-[#E3EBFF] bg-linear-to-b from-white to-[#F7FAFF] shadow-[0_12px_40px_rgba(32,76,237,0.05)] overflow-hidden"
              style={{ borderRadius: 20 }}
            >
              <div className="flex items-center gap-2.5 border-b border-[#E3EBFF] px-5 py-3.5">
                <div className="grid size-8 place-items-center rounded-full bg-primary/10 text-primary">
                  <CalendarCheck className="size-4" />
                </div>
                <div>
                  <p className="font-display text-sm font-semibold leading-tight">
                    Pick a time that works for you
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {hasScheduler ? `Powered by ${PROVIDER_LABEL[provider]}` : "Powered by Calendly or TidyCal"}
                  </p>
                </div>
              </div>

              <div className="relative p-3">
                {!hasScheduler ? (
                  <div
                    className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-[#FAFBFF] px-6 text-center"
                    style={{ minHeight: 500 }}
                  >
                    <div className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
                      <CalendarX className="size-5" />
                    </div>
                    <div>
                      <p className="font-display text-sm font-semibold text-foreground">
                        Scheduler not set up yet
                      </p>
                      <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                        An admin needs to add a Calendly or TidyCal link in Product Detail →
                        Book Workshop before this page can show real available times.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {!iframeLoaded && (
                      <div
                        className="absolute inset-3 flex flex-col items-center justify-center gap-3 rounded-2xl bg-white"
                        style={{ minHeight: 620 }}
                      >
                        <div className="size-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                        <p className="text-xs text-muted-foreground">Loading scheduler…</p>
                      </div>
                    )}
                    <iframe
                      title="Book a workshop"
                      src={embedSrc}
                      onLoad={() => setIframeLoaded(true)}
                      className="w-full rounded-2xl"
                      style={{
                        height: 640,
                        border: "none",
                        opacity: iframeLoaded ? 1 : 0,
                        transition: "opacity 0.3s ease",
                      }}
                    />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: What to expect + Focus Notes + Actions (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div
              className="border border-[#E3EBFF] bg-linear-to-b from-[#FCFDFF] to-[#F7FAFF] p-5 shadow-[0_12px_40px_rgba(32,76,237,0.05)]"
              style={{ borderRadius: 20 }}
            >
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary">
                <Sparkles className="size-3" /> What to expect
              </p>
              <ul className="mt-3.5 space-y-3">
                {EXPECTATIONS.map((item) => (
                  <li key={item.label} className="flex items-start gap-2.5">
                    <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                      <item.icon className="size-3.5" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-foreground leading-tight">
                        {item.label}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                        {item.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div
              className="border border-[#E3EBFF] bg-linear-to-b from-[#FCFDFF] to-[#F7FAFF] p-5 shadow-[0_12px_40px_rgba(32,76,237,0.05)]"
              style={{ borderRadius: 20 }}
            >
              <label className="font-display text-sm font-semibold">
                What should our consultant focus on?
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="e.g. Migration from SAP GRC, S/4 rollout, license optimization..."
                className="mt-3.5 w-full rounded-xl border border-[#E3EBFF] bg-white px-3.5 py-2.5 text-xs outline-none placeholder:text-caption focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all duration-200 resize-none"
                style={{ borderRadius: 12 }}
              />
            </div>

            {scheduled && (
              <div className="rounded-2xl bg-emerald-500/5 border border-emerald-500/20 p-3.5">
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                  Workshop scheduled
                </p>
                <p className="text-xs font-semibold text-foreground mt-0.5">
                  Taking you to your confirmation…
                </p>
              </div>
            )}

            <div className="flex items-center justify-between px-1 pr-16 md:pr-44">
              <button
                onClick={() => navigate(`/experience/${productSlug}/ai`)}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium"
              >
                <ArrowLeft className="size-3.5" /> Back to AI
              </button>
              <button
                onClick={schedule}
                className="btn-primary disabled:opacity-60 text-xs py-2 px-4.5 h-10"
              >
                <CalendarCheck className="size-3.5" /> I've scheduled my session
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
