import { Link, useParams, useOutletContext } from "react-router-dom";
import { useEffect, useRef } from "react";
import { ArrowLeft, Check, ChevronRight, Info } from "lucide-react";
import { VideoBlock } from "@/components/StepNav";
import { useExperience } from "@/lib/experience-store";
import { useApiGet } from "@/lib/use-api";
import { apiSend } from "@/lib/api";
import { embedVideo, listenForVideoEnd, extractGumletId } from "@/lib/video-embed";
import { useDocumentHead } from "@/lib/use-document-head";

export function CapabilityPage() {
  const { product, productSlug } = useOutletContext();
  useDocumentHead({ meta: [{ title: `Capability — ${product?.name ?? ""} Tour` }] });
  const { capability: capabilitySlug } = useParams();
  const markCapability = useExperience((s) => s.markCapability);
  const viewed = useExperience((s) => s.capabilitiesViewed);
  const incVideos = useExperience((s) => s.incVideos);
  const addAchievement = useExperience((s) => s.addAchievement);
  const inviteId = useExperience((s) => s.inviteId);
  const user = useExperience((s) => s.user);

  const { data, isLoading, isError } = useApiGet(`/api/capabilities?product=${productSlug}`);
  const CAPABILITIES = data ?? [];

  function reportVideoWatched(total) {
    if (!inviteId || !user?.email) return;
    apiSend(`/api/invites/${inviteId}/progress`, "POST", {
      email: user.email,
      pct: 0,
      steps: [],
      videosWatched: viewed.length + 1,
      videosTotal: total,
      productSlug,
    }).catch(() => {});
  }

  if (isLoading) {
    return <p className="py-12 text-center text-sm text-muted-foreground">Loading capability…</p>;
  }

  if (isError) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Couldn't load this capability.</p>
        <Link to={`/experience/${productSlug}/tour`} className="mt-4 inline-block btn-primary">
          Back to tour
        </Link>
      </div>
    );
  }

  const cap = CAPABILITIES.find((c) => c.slug === capabilitySlug);

  if (!cap) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Capability not found.</p>
        <Link to={`/experience/${productSlug}/tour`} className="mt-4 inline-block btn-primary">
          Back to tour
        </Link>
      </div>
    );
  }

  const isDone = viewed.includes(cap.slug);
  const idx = CAPABILITIES.findIndex((c) => c.slug === cap.slug);
  const next = CAPABILITIES[idx + 1];

  return (
    <div className="h-full flex flex-col justify-between overflow-hidden">
      <div className="flex-1 overflow-y-auto pb-6 scrollbar-none">
        <div className="mt-6">
          <p className="text-xs font-medium uppercase tracking-widest text-primary">
            Capability · {cap.duration}
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold">{cap.title}</h1>
          <p className="mt-3 max-w-3xl text-[15px] text-muted-foreground">{cap.summary}</p>
        </div>

        <div className="mt-8">
          {cap.gumlet_id || cap.video_url ? (
            <VideoEmbed
              key={cap.slug}
              url={cap.gumlet_id ? `https://play.gumlet.io/embed/${extractGumletId(cap.gumlet_id)}` : cap.video_url}
              onPlay={() => {
                incVideos();
                addAchievement("firstVideo");
              }}
              onEnded={() => {
                markCapability(cap.slug);
                reportVideoWatched(CAPABILITIES.length);
              }}
            />
          ) : (
            <VideoBlock
              key={cap.slug}
              label={`${cap.title} · ${cap.duration}`}
              onPlay={() => {
                incVideos();
                addAchievement("firstVideo");
              }}
              onComplete={() => {
                markCapability(cap.slug);
                reportVideoWatched(CAPABILITIES.length);
              }}
            />
          )}
          {!isDone && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Info className="size-3.5" /> Watching to the end marks this capability as complete —
              you can still move on anytime.
            </p>
          )}
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {/* Left: product tour progress — how many capability videos watched so far */}
          <div
            className="rounded-3xl border border-border bg-card p-6"
            style={{ borderRadius: 20 }}
          >
            <p className="text-xs font-medium uppercase tracking-widest text-primary">
              Product tour progress
            </p>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="font-display text-2xl font-semibold text-foreground">{viewed.length}</span>
              <span className="text-sm text-muted-foreground">/ {CAPABILITIES.length} watched</span>
            </div>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${CAPABILITIES.length ? (viewed.length / CAPABILITIES.length) * 100 : 0}%` }}
              />
            </div>

            <ul className="mt-5 space-y-2.5">
              {CAPABILITIES.map((c) => {
                const done = viewed.includes(c.slug);
                const isCurrent = c.slug === cap.slug;
                return (
                  <li key={c.slug}>
                    <Link
                      to={`/experience/${productSlug}/tour/${c.slug}`}
                      className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition-colors ${
                        isCurrent ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-muted/60"
                      }`}
                    >
                      <span
                        className={`grid size-5 shrink-0 place-items-center rounded-full border ${
                          done ? "border-primary bg-primary text-white" : "border-border text-transparent"
                        }`}
                      >
                        <Check className="size-3" strokeWidth={3} />
                      </span>
                      <span className="truncate">{c.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Right: this capability's key features + business value */}
          <div className="space-y-4 md:col-span-2">
            <div
              className="rounded-3xl border border-border bg-card p-6"
              style={{ borderRadius: 20 }}
            >
              <h2 className="font-display text-lg font-semibold">Key features</h2>
              <ul className="mt-4 space-y-3">
                {cap.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="mt-0.5 size-4 text-primary" /> {f}
                  </li>
                ))}
              </ul>
            </div>

            <div
              className="rounded-3xl border border-border bg-card p-6"
              style={{ borderRadius: 20 }}
            >
              <p className="text-xs font-medium uppercase tracking-widest text-primary">
                Business value
              </p>
              <p className="mt-3 text-sm text-foreground">{cap.value}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 w-full z-10 backdrop-blur-sm mt-6 lg:mt-4.5 pt-4 lg:pt-3 flex items-center justify-between border-t border-border pb-4 lg:pb-3 pr-16 lg:pr-24">
        <Link
          to={`/experience/${productSlug}/tour`}
          className="inline-flex items-center gap-1.5 text-sm lg:text-xs text-muted-foreground hover:text-foreground font-medium"
        >
          <ArrowLeft className="size-4 lg:size-3.5" /> All capabilities
        </Link>
        {next ? (
          <Link to={`/experience/${productSlug}/tour/${next.slug}`} className="btn-primary lg:py-2 lg:px-4 lg:text-xs">
            Next: {next.title} <ChevronRight className="size-4 lg:size-3.5" />
          </Link>
        ) : (
          <Link to={`/experience/${productSlug}/stories`} className="btn-primary lg:py-2 lg:px-4 lg:text-xs">
            Continue to Customer Stories <ChevronRight className="size-4 lg:size-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}

function VideoEmbed({ url, onPlay, onEnded }) {
  const embed = embedVideo(url);
  const iframeRef = useRef(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (embed.type !== "iframe") return;
    return listenForVideoEnd(iframeRef.current, embed.provider, onEnded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embed.src]);

  const handleFirstPlay = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    onPlay?.();
  };

  if (embed.type === "iframe") {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-2xl border border-border bg-black">
        <iframe
          ref={iframeRef}
          src={embed.src}
          title="Capability video"
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={handleFirstPlay}
        />
      </div>
    );
  }

  if (embed.type === "video") {
    return (
      <video
        controls
        src={embed.src}
        className="aspect-video w-full rounded-2xl border border-border bg-black"
        onPlay={handleFirstPlay}
        onEnded={onEnded}
      />
    );
  }

  return (
    <div className="flex aspect-video w-full items-center justify-center rounded-2xl border border-border bg-card">
      <a
        href={embed.src}
        target="_blank"
        rel="noreferrer"
        onClick={() => {
          handleFirstPlay();
          // Can't observe playback on an external tab — best-effort mark as watched.
          onEnded?.();
        }}
        className="btn-primary"
      >
        Watch video
      </a>
    </div>
  );
}
