import { Link, useParams, useOutletContext } from "react-router-dom";
import { useEffect, useRef } from "react";
import { ArrowLeft, Check, ChevronRight, Lock } from "lucide-react";
import { VideoBlock } from "@/components/StepNav";
import { useExperience } from "@/lib/experience-store";
import { useApiGet } from "@/lib/use-api";
import { apiSend } from "@/lib/api";
import { embedVideo, listenForVideoEnd } from "@/lib/video-embed";
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
    <div>
      <Link
        to={`/experience/${productSlug}/tour`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All capabilities
      </Link>

      <div className="mt-6">
        <p className="text-xs font-medium uppercase tracking-widest text-primary">
          Capability · {cap.duration}
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold">{cap.title}</h1>
        <p className="mt-3 max-w-3xl text-[15px] text-muted-foreground">{cap.summary}</p>
      </div>

      <div className="mt-8">
        {cap.video_url ? (
          <VideoEmbed
            key={cap.slug}
            url={cap.video_url}
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
            <Lock className="size-3.5" /> Watch the full video to unlock the next capability.
          </p>
        )}
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        <div
          className="rounded-3xl border border-border bg-card p-6 md:col-span-2"
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

          <h2 className="mt-8 font-display text-lg font-semibold">Technical architecture</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            SecOps deploys as a stateless application tier that communicates with SAP via certified
            RFC. No custom development inside SAP, no ABAP transports required. Runs on-premise, on
            your cloud, or fully managed.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {["SAP ECC", "S/4HANA", "HANA", "RISE", "GROW", "Azure / AWS / GCP"].map((t) => (
              <span
                key={t}
                className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div
            className="rounded-3xl border border-border bg-card p-6"
            style={{ borderRadius: 20 }}
          >
            <p className="text-xs font-medium uppercase tracking-widest text-primary">
              Business value
            </p>
            <p className="mt-3 text-sm text-foreground">{cap.value}</p>
          </div>

          <div
            className="rounded-3xl border border-border bg-card p-6"
            style={{ borderRadius: 20 }}
          >
            <p className="text-xs font-medium uppercase tracking-widest text-caption">
              Related FAQs
            </p>
            <ul className="mt-3 space-y-2 text-sm text-foreground">
              <li>How does licensing work?</li>
              <li>Can we pilot on a single system?</li>
              <li>What does a typical rollout look like?</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${
            isDone
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground"
          }`}
        >
          <Check className="size-4" /> {isDone ? "Video watched" : "Not watched yet"}
        </span>
        {next ? (
          isDone ? (
            <Link to={`/experience/${productSlug}/tour/${next.slug}`} className="btn-primary">
              Next: {next.title} <ChevronRight className="size-4" />
            </Link>
          ) : (
            <span
              className="inline-flex cursor-not-allowed items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm font-medium text-muted-foreground"
              title="Finish the video to continue"
            >
              <Lock className="size-3.5" /> Next: {next.title}
            </span>
          )
        ) : isDone ? (
          <Link to={`/experience/${productSlug}/stories`} className="btn-primary">
            Continue to Customer Stories <ChevronRight className="size-4" />
          </Link>
        ) : (
          <span
            className="inline-flex cursor-not-allowed items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm font-medium text-muted-foreground"
            title="Finish the video to continue"
          >
            <Lock className="size-3.5" /> Continue to Customer Stories
          </span>
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
