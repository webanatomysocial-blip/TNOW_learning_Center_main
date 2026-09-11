import { Link } from "react-router-dom";
import { useState } from "react";
import {
  MagnifyingGlass,
  ArrowRight,
  ArrowLeft,
  Clock,
  Lightning,
  SignOut,
  ShieldCheck,
  Fire,
  ListChecks,
  Gauge,
  Robot,
  X,
  EnvelopeSimple,
  Cpu,
  Coins,
  TrendUp,
  CheckCircle,
  LockSimple,
} from "@phosphor-icons/react";
import { useExperience } from "@/lib/experience-store";
import { UserProfileMenu } from "@/components/UserProfileMenu";
import { useApiGet } from "@/lib/use-api";
import { apiSend } from "@/lib/api";
import { useDocumentHead } from "@/lib/use-document-head";

const PRODUCT_TEASERS = {
  fftrust: {
    tagline: "Firefighter access with zero blind spots.",
    description:
      "FF Trust introduces AI-driven risk classification and session replay logs for privileged firefighters. Traditional logs are millions of lines of raw transactions; FF Trust aggregates, scores, and isolates high-risk actions instantly.",
    features: [
      "Continuous Session Video & Transaction Recording",
      "Dynamic Risk Scoring (Low / Medium / High)",
      "Automated Security Log Correlation (SM20, CDHDR, DBTABLOG)",
      "Instant Deviation Alerts for anomalous firefighter behavior",
    ],
    metrics: [
      { value: "0", label: "Undetected privileged mutations" },
      { value: "98%", label: "Faster audit reviews of firefighter logs" },
      { value: "< 2 min", label: "Mean time to detect privileged policy deviations" },
    ],
    architecture: [
      "SAP certified RFC integrations",
      "Low-footprint Basis agent with zero performance impact",
      "Military-grade log encryption and compression",
    ],
    timeline: "Launching Q4 2026",
  },
  reviewnow: {
    tagline: "Access recertification without the spreadsheets.",
    description:
      "ReviewNow automates the tedious, manual periodic user access reviews (UAR). Instead of sending thousands of spreadsheets to business managers, launch structured, self-service recertification campaigns with context-aware role recommendations.",
    features: [
      "Self-service Manager Attestation Portal",
      "Smart Role Recommendations based on actual transaction usage",
      "Automated standard GRC compliance trails",
      "One-click remediation & deprovisioning of revoked access",
    ],
    metrics: [
      { value: "90%", label: "Reduction in access review administrative hours" },
      { value: "100%", label: "Audit-ready GRC signing trails" },
      { value: "4.8x", label: "Increase in business owner completion rates" },
    ],
    architecture: [
      "SaaS / Private Cloud control plane",
      "OData and RFC connectivity to SAP landscapes",
      "AD / Microsoft Entra ID hybrid sync support",
    ],
    timeline: "Beta launching Q1 2027",
  },
  gams360: {
    tagline: "Governance, Access & Monitoring, unified.",
    description:
      "GAMS360 provides a single, unified executive pane of glass across your entire SAP ecosystem (including ECC, S/4HANA, SuccessFactors, and BTP). Monitor SoD risk density, licensing costs, and critical system configuration drift in one place.",
    features: [
      "Unified GRC Dashboard across heterogeneous SAP systems",
      "Continuous Configuration Drift & Patch level monitoring",
      "Executive Financial & Operational Licensing reports",
      "Cross-system Segregation of Duties (SoD) analysis",
    ],
    metrics: [
      { value: "Single Pane", label: "For ECC, S/4, SuccessFactors, and BTP" },
      { value: "$300k+", label: "Average annual license clawback identification" },
      { value: "Real-Time", label: "Security posture monitoring and alerts" },
    ],
    architecture: [
      "Multi-tenant or Single-tenant private instance",
      "Secure HTTPS Rest Gateway connections",
      "Integrates with SAP Solution Manager and Focus Run",
    ],
    timeline: "Launching Q2 2027",
  },
  digybots: {
    tagline: "Intelligent bots for SAP operations.",
    description:
      "Digybots are fully secure, audit-compliant digital assistants that automate repetitive Basis administration chores. From system health-checks and buffer monitoring to safe password resets, let Digybots handle the toil while maintaining full audit logs.",
    features: [
      "Automated Daily Basis Checklist execution",
      "Intelligent User Lockout Assistance and Verification",
      "Buffer, Database & Lock table anomaly detection",
      "Policy-safe automated database expansion approvals",
    ],
    metrics: [
      { value: "85%", label: "Fewer manual password reset tickets" },
      { value: "10 min", label: "SAP system daily health-check completion" },
      { value: "0", label: "Human administrative errors during emergency restarts" },
    ],
    architecture: [
      "Encrypted credential vault integration",
      "Standard SAP GUI and SAP GUI scripting compatibility",
      "Adheres strictly to SAP security note standards",
    ],
    timeline: "Developer Preview Q3 2026",
  },
};

export function ProductSelection() {
  useDocumentHead({
    meta: [
      { title: "Choose your experience — ToggleNow" },
      {
        name: "description",
        content:
          "Choose the SAP Security & Governance product most relevant to your organization and launch a guided 10–15 minute experience.",
      },
    ],
  });
  const { data, isLoading, isError } = useApiGet("/api/products");
  const inviteId = useExperience((s) => s.inviteId);
  const { data: allowedData, refetch: refetchAllowed } = useApiGet(
    `/api/invites/${inviteId}/allowed-products`,
    { enabled: !!inviteId },
  );
  const allowedSlugs = allowedData?.allowed_product_slugs ?? [];
  const pendingRequestSlugs = allowedData?.pending_product_requests ?? [];
  const ALL_PRODUCTS = data ?? [];
  // Every product stays visible — one scoped to specific products doesn't hide the
  // rest, it shows them locked with a way to request access instead.
  const PRODUCTS = ALL_PRODUCTS.map((p) => ({
    ...p,
    locked: allowedSlugs.length > 0 && p.status === "available" && !allowedSlugs.includes(p.slug),
  }));
  const [query, setQuery] = useState("");
  const [selectedTeaserId, setSelectedTeaserId] = useState(null);
  const [teaserTab, setTeaserTab] = useState("overview");
  const [teaserRequested, setTeaserRequested] = useState({});
  const [requestLoading, setRequestLoading] = useState(false);
  const [lockedProductSlug, setLockedProductSlug] = useState(null);
  const [lockedRequestSubmitting, setLockedRequestSubmitting] = useState(false);
  const [locallyRequested, setLocallyRequested] = useState({});

  const user = useExperience((s) => s.user);
  const reset = useExperience((s) => s.reset);

  const handleCardClick = (productId, available, locked) => {
    if (locked) {
      setLockedProductSlug(productId);
    } else if (!available) {
      setSelectedTeaserId(productId);
      setTeaserTab("overview");
    }
  };

  async function handleRequestPriority() {
    if (!selectedTeaserId || !user?.email) return;
    setRequestLoading(true);
    try {
      await apiSend("/api/notify-me", "POST", {
        email: user.email,
        name: user.name,
        productSlug: selectedTeaserId,
      });
      setTeaserRequested((prev) => ({ ...prev, [selectedTeaserId]: true }));
    } catch {
      // best-effort — the confirmed state below still tells them what to expect
      setTeaserRequested((prev) => ({ ...prev, [selectedTeaserId]: true }));
    } finally {
      setRequestLoading(false);
    }
  }

  async function handleRequestProductAccess() {
    if (!lockedProductSlug || !inviteId || !user?.email) return;
    setLockedRequestSubmitting(true);
    try {
      await apiSend(`/api/invites/${inviteId}/request-product-access`, "POST", {
        email: user.email,
        productSlug: lockedProductSlug,
      });
      setLocallyRequested((prev) => ({ ...prev, [lockedProductSlug]: true }));
      refetchAllowed();
    } catch {
      // best-effort — the button state below still reflects local intent
      setLocallyRequested((prev) => ({ ...prev, [lockedProductSlug]: true }));
    } finally {
      setLockedRequestSubmitting(false);
    }
  }

  const selectedProduct = PRODUCTS.find((p) => p.slug === selectedTeaserId);
  const teaserData = selectedTeaserId ? PRODUCT_TEASERS[selectedTeaserId] : null;
  const lockedProduct = PRODUCTS.find((p) => p.slug === lockedProductSlug);
  const lockedAlreadyRequested =
    !!lockedProductSlug &&
    (locallyRequested[lockedProductSlug] || pendingRequestSlugs.includes(lockedProductSlug));

  const filtered = PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.description.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <main className="min-h-dvh bg-[#FFFFFF] text-foreground relative overflow-hidden bg-[radial-gradient(circle_at_top,rgba(32,76,237,0.06),transparent_45%)]">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4">
          <Link to="/experience" className="flex items-center">
            <img src="/logo.png" alt="ToggleNow" className="h-8 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <UserProfileMenu />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1400px] px-6 py-14">
        <h1 className="font-display text-4xl font-normal leading-tight md:text-5xl">
          Choose your experience
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] text-muted-foreground">
          Explore the SAP solution most relevant to your organization. Every experience takes 10–15
          minutes and ends with a workshop tailored to you.
        </p>

        <div className="mt-8 relative w-full md:max-w-sm">
          <MagnifyingGlass className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-caption" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products"
            className="w-full rounded-2xl border border-border bg-background py-3 pl-11 pr-4 text-[15px] outline-none placeholder:text-caption focus:ring-2 focus:ring-primary/15"
            style={{ borderRadius: 16 }}
          />
        </div>

        {/* Grid Layout (3x2 format for 5 cards) */}
        {isLoading ? (
          <p className="mt-12 text-sm text-muted-foreground">Loading products…</p>
        ) : isError ? (
          <p className="mt-12 text-sm text-destructive">
            Couldn't load products. Please refresh the page.
          </p>
        ) : (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((p) => (
              <div key={p.slug} className="w-full">
                <ProductCard
                  product={p}
                  onClick={() => handleCardClick(p.slug, p.status === "available", p.locked)}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Teaser Detail Modal */}
      {selectedTeaserId && selectedProduct && teaserData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className="relative w-full max-w-2xl rounded-3xl border border-border bg-card p-6 shadow-float overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            style={{ borderRadius: 24 }}
          >
            {/* Top Close */}
            <button
              onClick={() => setSelectedTeaserId(null)}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-surface border border-border text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close Preview"
            >
              <X className="size-4" weight="bold" />
            </button>

            {/* Product Header */}
            <div className="flex items-start gap-4 pr-10 border-b border-border/60 pb-5">
              <div className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                {getProductIcon(selectedProduct.slug)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-2xl font-bold">{selectedProduct.name}</h2>
                  <span className="rounded-full bg-foreground/5 px-2.5 py-0.5 text-[10px] font-bold text-caption uppercase tracking-wider">
                    Coming Soon
                  </span>
                </div>
                <p className="text-sm font-semibold text-primary mt-1">{teaserData.tagline}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Target timeline: {teaserData.timeline}
                </p>
              </div>
            </div>

            {/* Tab Controls */}
            <div className="mt-5 inline-flex w-full border-b border-border/40 gap-6">
              {[
                { id: "overview", label: "Product Overview" },
                { id: "features", label: "Features & ROI Metrics" },
                { id: "architecture", label: "Integration & Tech" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setTeaserTab(tab.id)}
                  className={`pb-3 text-sm font-semibold transition-all relative ${
                    teaserTab === tab.id
                      ? "text-primary border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="mt-5 min-h-47.5 py-1 text-sm text-foreground">
              {teaserTab === "overview" && (
                <div className="space-y-4">
                  <p className="leading-relaxed text-muted-foreground">{teaserData.description}</p>
                  <div className="rounded-2xl bg-primary/5 border border-primary/10 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">
                      Interactive Roadmap Note
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      We are currently engineering this module with several early-adopter Global
                      2000 partners. Register your priority interest below to coordinate a custom
                      briefing session.
                    </p>
                  </div>
                </div>
              )}

              {teaserTab === "features" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-3 gap-3">
                    {teaserData.metrics.map((m, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl border border-border bg-background p-3.5 text-center"
                      >
                        <p className="font-display text-lg font-bold text-foreground">{m.value}</p>
                        <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">
                          {m.label}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-caption mb-2">
                      Key Core Features
                    </h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {teaserData.features.map((f, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-muted-foreground bg-surface-alt p-2 rounded-xl border border-border/30"
                        >
                          <span className="text-primary font-bold">✓</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {teaserTab === "architecture" && (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    ToggleNow modules are designed to run alongside standard SAP Basis structures
                    with absolute safety and compliance integrity:
                  </p>
                  <div className="space-y-2">
                    {teaserData.architecture.map((a, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 rounded-2xl border border-border bg-background p-3"
                      >
                        <div className="p-1 rounded bg-primary/10 text-primary mt-0.5">
                          <Cpu className="size-4" weight="fill" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">{a}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Form Action */}
            <div className="mt-6 border-t border-border/60 pt-5 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                {user && (
                  <p className="text-xs text-muted-foreground">
                    Notified at:{" "}
                    <strong className="text-foreground">{user.email}</strong>
                  </p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setSelectedTeaserId(null)}
                  className="whitespace-nowrap rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold hover:bg-surface transition-colors"
                >
                  Close
                </button>
                {teaserRequested[selectedTeaserId] ? (
                  <button
                    disabled
                    className="whitespace-nowrap rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <CheckCircle className="size-4" weight="fill" /> We'll notify you
                  </button>
                ) : (
                  <button
                    onClick={handleRequestPriority}
                    disabled={requestLoading}
                    className="whitespace-nowrap rounded-full bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold hover:bg-primary-hover transition-all flex items-center gap-1.5 disabled:opacity-60"
                  >
                    <EnvelopeSimple className="size-4" weight="fill" />{" "}
                    {requestLoading ? "Sending…" : "Notify Me"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Locked Product — Request Access Modal */}
      {lockedProductSlug && lockedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-float animate-in fade-in zoom-in-95 duration-200"
            style={{ borderRadius: 24 }}
          >
            <button
              onClick={() => setLockedProductSlug(null)}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-surface border border-border text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X className="size-4" weight="bold" />
            </button>

            <div className="flex items-center gap-3 mb-1">
              <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <LockSimple className="size-5" weight="duotone" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-lg font-bold">{lockedProduct.name}</h2>
                  <span className="rounded-full bg-foreground/5 px-2.5 py-0.5 text-[10px] font-bold text-caption uppercase tracking-wider">
                    Locked
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Not included in your invite</p>
              </div>
            </div>

            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              You don't currently have access to {lockedProduct.name}. Request access and we'll email you
              the moment it's approved.
            </p>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setLockedProductSlug(null)}
                className="rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold hover:bg-surface transition-colors"
              >
                Close
              </button>
              {lockedAlreadyRequested ? (
                <button
                  disabled
                  className="rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <CheckCircle className="size-4" weight="fill" /> Request sent
                </button>
              ) : (
                <button
                  onClick={handleRequestProductAccess}
                  disabled={lockedRequestSubmitting}
                  className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold hover:bg-primary-hover transition-all flex items-center gap-1.5 disabled:opacity-60"
                >
                  <EnvelopeSimple className="size-4" weight="fill" />{" "}
                  {lockedRequestSubmitting ? "Sending…" : "Request Access"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function getProductIcon(id) {
  switch (id) {
    case "secops":
      return <ShieldCheck className="size-5" weight="duotone" />;
    case "fftrust":
      return <Fire className="size-5" weight="duotone" />;
    case "reviewnow":
      return <ListChecks className="size-5" weight="duotone" />;
    case "gams360":
      return <Gauge className="size-5" weight="duotone" />;
    case "digybots":
      return <Robot className="size-5" weight="duotone" />;
    default:
      return <Lightning className="size-5" weight="duotone" />;
  }
}

const CARD_THEMES = {
  secops: {
    bg: "bg-[#FFF2EA]",
    border: "border-orange-100",
    dotColor: "bg-[#FF5A1F]",
    badgeText: "Available",
    accentSvg: (
      <svg
        className="absolute right-0 bottom-0 top-0 h-full w-[45%] text-orange-500/10 pointer-events-none"
        viewBox="0 0 150 300"
        fill="currentColor"
      >
        <rect x="35" y="40" width="85" height="42" rx="21" transform="rotate(-30 35 40)" />
        <rect x="70" y="115" width="85" height="42" rx="21" transform="rotate(-30 70 115)" />
        <rect x="30" y="190" width="85" height="42" rx="21" transform="rotate(-30 30 190)" />
        <rect x="80" y="240" width="85" height="42" rx="21" transform="rotate(-30 80 240)" />
      </svg>
    ),
  },
  fftrust: {
    bg: "bg-[#F5F5F3]",
    border: "border-gray-200/80",
    dotColor: "bg-zinc-800",
    badgeText: "Coming Soon",
    accentSvg: (
      <svg
        className="absolute right-0 bottom-0 top-0 h-full w-[45%] text-gray-400/10 pointer-events-none"
        viewBox="0 0 150 300"
        fill="currentColor"
      >
        <circle cx="85" cy="80" r="35" />
        <path d="M 50 170 A 35 35 0 0 1 120 170 Z" />
        <circle cx="85" cy="240" r="35" />
      </svg>
    ),
  },
  reviewnow: {
    bg: "bg-[#F2EFFB]",
    border: "border-purple-100",
    dotColor: "bg-[#7C5EE3]",
    badgeText: "Coming Soon",
    accentSvg: (
      <svg
        className="absolute right-0 bottom-0 top-0 h-full w-[45%] text-[#7C5EE3]/10 pointer-events-none"
        viewBox="0 0 150 300"
        fill="currentColor"
      >
        <circle cx="100" cy="150" r="60" stroke="currentColor" strokeWidth="12" fill="none" />
        <circle cx="100" cy="150" r="35" stroke="currentColor" strokeWidth="10" fill="none" />
        <circle cx="100" cy="150" r="12" />
      </svg>
    ),
  },
  gams360: {
    bg: "bg-[#ECF6EE]",
    border: "border-emerald-100",
    dotColor: "bg-[#107C41]",
    badgeText: "Coming Soon",
    accentSvg: (
      <svg
        className="absolute right-0 bottom-0 top-0 h-full w-[45%] text-emerald-500/10 pointer-events-none"
        viewBox="0 0 150 300"
        fill="currentColor"
      >
        <rect x="40" y="40" width="55" height="55" rx="14" />
        <rect x="105" y="105" width="55" height="55" rx="14" />
        <rect x="40" y="170" width="55" height="55" rx="14" />
      </svg>
    ),
  },
  digybots: {
    bg: "bg-[#EDF6FA]",
    border: "border-sky-100",
    dotColor: "bg-[#0078D4]",
    badgeText: "Coming Soon",
    accentSvg: (
      <svg
        className="absolute right-0 bottom-0 top-0 h-full w-[45%] text-sky-500/10 pointer-events-none"
        viewBox="0 0 150 300"
        fill="none"
        stroke="currentColor"
        strokeWidth="12"
        strokeLinecap="round"
      >
        <path d="M20,60 C60,20 100,100 140,60" />
        <path d="M20,130 C60,90 100,170 140,130" />
        <path d="M20,200 C60,160 100,240 140,200" />
      </svg>
    ),
  },
};

function ProductCard({ product, onClick }) {
  const available = product.status === "available";
  const locked = !!product.locked;
  const theme = CARD_THEMES[product.slug] || CARD_THEMES.secops;

  const body = (
    <article
      className={`group relative flex h-65 flex-col rounded-xl border ${theme.border} ${theme.bg} p-6 overflow-hidden transition-all duration-180 ease-out hover:shadow-[0_12px_30px_rgba(32,76,237,0.06)] hover:border-primary/40 hover:-translate-y-0.75 cursor-pointer select-none ${locked ? "opacity-75" : ""}`}
    >
      {/* Decorative Accent Graphic */}
      <div className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity pointer-events-none">
        {theme.accentSvg}
      </div>

      {/* Top Badge */}
      <div className="z-10 self-start">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[10px] font-normal text-[#111111] shadow-sm border border-black/4">
          <span className={`size-1.5 rounded-full ${
            locked ? "bg-red-500" : available ? "bg-emerald-500" : "bg-amber-500"
          }`} />
          {locked ? "Locked" : available ? "Unlocked" : "Coming Soon"}
        </div>
      </div>

      {/* Content */}
      <div className="z-10 mt-4 flex-1 flex flex-col justify-center">
        <h3 className="font-sans text-xl font-normal text-[#111111] leading-none tracking-tight">
          {product.name}
        </h3>
        <p className="mt-2 text-[13px] text-[#555555] leading-relaxed max-w-[90%] font-normal line-clamp-3">
          {product.description}
        </p>
      </div>

      {/* CTA bottom left */}
      <div className="z-10 mt-auto pt-3">
        <span className="inline-block border-b border-current pb-0.5 font-bold text-[11px] tracking-wide text-foreground hover:opacity-85 transition-opacity">
          {locked ? "Request access" : available ? "Start Experience" : product.cta} →
        </span>
      </div>
    </article>
  );

  if (locked || !available) {
    return (
      <div onClick={onClick} className="block h-full">
        {body}
      </div>
    );
  }
  const startPath =
    product.slug === "secops"
      ? `/experience/${product.slug}/assessment`
      : `/experience/${product.slug}`;

  return (
    <Link to={startPath} className="block h-full">
      {body}
    </Link>
  );
}
