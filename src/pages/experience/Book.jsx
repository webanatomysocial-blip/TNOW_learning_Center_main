import { useNavigate, useOutletContext } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  CalendarClock,
  Sparkles,
  Users,
  Video,
  CalendarX,
  Check,
} from "lucide-react";
import { SectionHeader, StepNav } from "@/components/StepNav";
import { useExperience } from "@/lib/experience-store";
import { useApiGet } from "@/lib/use-api";
import { apiGet, apiSend } from "@/lib/api";
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

// TidyCal's public API has no endpoint to list a booking type's custom questions —
// these IDs were read from the TidyCal dashboard's internal booking-type-detail
// response (dashboard → Booking Types → Product Demo → Advanced → Questions, via
// browser DevTools Network tab) for the default "Product Demo" booking type
// (id 107167). All nine are marked required on TidyCal's side. If the admin points
// a product at a different TidyCal booking type, or edits these questions, this map
// needs updating the same way — there's no way to keep it in sync automatically.
const TIDYCAL_QUESTIONS = {
  sapVersion: { id: 9657560, type: "text" },
  hasGrc: { id: 9657561, type: "radio", options: ["Yes", "No"] },
  activeUsers: { id: 9657562, type: "text" },
  solutions: {
    id: 9657563,
    type: "checkbox",
    options: [
      "ToggleNow SecOps for SAP GRC",
      "ToggleNow SecOps for SAP S/4HANA",
      "FF Trust",
      "ReviewNow",
      "ThreatOps for SAP",
    ],
  },
  companyName: { id: 9657564, type: "text" },
  designation: { id: 9657565, type: "text" },
  mobileNo: { id: 9657566, type: "text" },
  email: { id: 9657567, type: "text" },
  otherInfo: { id: 9657568, type: "text" },
};

// TidyCal only supports prefill via its own embed script (data-name/data-email
// attributes), not via query params on the iframe URL — unlike Calendly, whose
// documented embed API does accept name/email/UTM params directly on the URL.
// See https://help.tidycal.com/article/141-embeding-tidycal-on-your-site
const TIDYCAL_EMBED_SCRIPT_SRC = "https://asset-tidycal.b-cdn.net/js/embed.js";
// TidyCal's script scans the DOM for `.tidycal-embed` divs once, when it loads —
// it has no documented API to re-scan later. In this SPA the div doesn't exist
// yet on first page load, so a fresh <script> tag is appended each time the
// scheduler is shown; script *execution* always reruns on insertion even with a
// repeated src (only the network fetch is cache-deduped), which re-triggers the scan.
function runTidyCalEmbedScript() {
  const script = document.createElement("script");
  script.src = TIDYCAL_EMBED_SCRIPT_SRC;
  script.async = true;
  document.body.appendChild(script);
  return script;
}

function tidycalPathFromUrl(url) {
  try {
    return new URL(url).pathname.split("/").filter(Boolean).join("/");
  } catch {
    return "";
  }
}

// Used for every product unless an admin overrides it with a per-product link in
// Product Detail → Book Workshop.
const DEFAULT_SCHEDULER_URL = "https://tidycal.com/togglenow/experience-center";

const EXPECTATIONS = [
  { icon: CalendarClock, label: "45 minutes", desc: "Focused working session, not a sales pitch." },
  { icon: Users, label: "Your consultant", desc: "Matched to what you explored in this tour." },
  { icon: Video, label: "Live walkthrough", desc: "Screen-share tailored to your SAP landscape." },
];

export function BookPage() {
  const { product, productSlug } = useOutletContext();
  useDocumentHead({ meta: [{ title: `Book Workshop — ${product?.name ?? ""} Experience` }] });
  const { complete, addAchievement, user, inviteId } = useExperience();
  const [stage, setStage] = useState("details"); // details | schedule
  const [name, setName] = useState(user?.name || "");
  const [interests, setInterests] = useState(productSlug ? [productSlug] : []);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [scheduled, setScheduled] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  
  // Custom TidyCal scheduling states
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [submittingBooking, setSubmittingBooking] = useState(false);

  // TidyCal's required custom questions (see TIDYCAL_QUESTIONS above) — collected
  // here since TidyCal's API doesn't accept these via the embed, only a real
  // booking_questions payload on the create-booking call.
  const [sapVersion, setSapVersion] = useState("");
  const [hasGrc, setHasGrc] = useState("");
  const [activeUsers, setActiveUsers] = useState("");
  const [solutions, setSolutions] = useState([]);
  const [companyName, setCompanyName] = useState("");
  const [designation, setDesignation] = useState("");
  const [mobileNo, setMobileNo] = useState("");

  const tidycalContainerRef = useRef(null);
  const navigate = useNavigate();

  const { data: pageData } = useApiGet(`/api/experience-pages?product=${productSlug}&page=book`);
  const { data: productsData } = useApiGet("/api/products");
  const products = productsData ?? [];
  const headline = pageData?.headline || "Let's tailor a workshop for your team";
  const description =
    pageData?.description ||
    "A 45-minute working session with a consultant, shaped by everything you've explored.";
  const schedulerUrl = pageData?.extra?.calendlyUrl || DEFAULT_SCHEDULER_URL;
  const provider = detectScheduler(schedulerUrl);
  const hasScheduler = !!provider;

  function toggleInterest(slug) {
    setInterests((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  }

  function toggleSolution(option) {
    setSolutions((prev) => (prev.includes(option) ? prev.filter((s) => s !== option) : [...prev, option]));
  }

  const tidycalFieldsValid =
    provider !== "tidycal" ||
    (sapVersion.trim() &&
      hasGrc &&
      activeUsers.trim() &&
      solutions.length > 0 &&
      companyName.trim() &&
      designation.trim() &&
      mobileNo.trim());

  async function handleSubmitDetails(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (inviteId && user?.email) {
        await apiSend(`/api/invites/${inviteId}/workshop-request`, "POST", {
          email: user.email,
          name: name.trim() || user.name,
          productSlug,
          interests,
          notes: notes.trim(),
        });
      }
    } catch {
      // best-effort — still let them proceed to scheduling
    } finally {
      setSubmitting(false);
      setStage("schedule");
    }
  }

  function schedule() {
    if (scheduled) return;
    setScheduled(true);
    addAchievement("workshopReady");
    complete("book");
    navigate(`/experience/${productSlug}/success`);
  }

  // Fetch TidyCal slots via backend proxy
  useEffect(() => {
    if (provider !== "tidycal" || stage !== "schedule") return;
    setLoadingSlots(true);
    apiGet(
      `/api/tidycal/slots?slug=${encodeURIComponent(
        schedulerUrl
      )}&starts_at=${encodeURIComponent(new Date().toISOString())}`
    )
      .then((data) => {
        if (data.slots) {
          setSlots(data.slots);
          
          // Group and auto-select first available date
          const grouped = {};
          data.slots.forEach((slot) => {
            const dateKey = new Date(slot.starts_at).toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            });
            if (!grouped[dateKey]) grouped[dateKey] = [];
            grouped[dateKey].push(slot);
          });
          const dates = Object.keys(grouped);
          if (dates.length > 0) {
            setSelectedDate(dates[0]);
          }
        }
      })
      .catch((err) => {
        console.error("Error loading TidyCal slots:", err);
      })
      .finally(() => {
        setLoadingSlots(false);
      });
  }, [provider, stage, schedulerUrl]);

  // Handle booking slot via backend proxy
  const handleBookSlot = async () => {
    if (!selectedSlot) return;
    setSubmittingBooking(true);
    try {
      const booking_questions = [
        { booking_type_question_id: TIDYCAL_QUESTIONS.sapVersion.id, answer: sapVersion.trim() },
        { booking_type_question_id: TIDYCAL_QUESTIONS.hasGrc.id, answer: hasGrc },
        { booking_type_question_id: TIDYCAL_QUESTIONS.activeUsers.id, answer: activeUsers.trim() },
        { booking_type_question_id: TIDYCAL_QUESTIONS.solutions.id, answer: solutions },
        { booking_type_question_id: TIDYCAL_QUESTIONS.companyName.id, answer: companyName.trim() },
        { booking_type_question_id: TIDYCAL_QUESTIONS.designation.id, answer: designation.trim() },
        { booking_type_question_id: TIDYCAL_QUESTIONS.mobileNo.id, answer: mobileNo.trim() },
        { booking_type_question_id: TIDYCAL_QUESTIONS.email.id, answer: user?.email || "" },
        { booking_type_question_id: TIDYCAL_QUESTIONS.otherInfo.id, answer: notes.trim() },
      ];

      const data = await apiSend("/api/tidycal/bookings", "POST", {
        slug: schedulerUrl,
        starts_at: selectedSlot.starts_at,
        name,
        email: user?.email,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        booking_questions,
      });

      if (data.success) {
        schedule();
      } else {
        alert(data.error || "Failed to book appointment. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert(err.body?.error || "An error occurred while booking. Please try again.");
    } finally {
      setSubmittingBooking(false);
    }
  };

  // Group slots by formatted date string
  const slotsByDate = {};
  slots.forEach((slot) => {
    const dateKey = new Date(slot.starts_at).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    if (!slotsByDate[dateKey]) {
      slotsByDate[dateKey] = [];
    }
    slotsByDate[dateKey].push(slot);
  });

  const availableDates = Object.keys(slotsByDate);

  const formatTime = (timeStr) => {
    return new Date(timeStr).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calendly posts a window message when the visitor actually books a slot in the
  // embedded widget — that's the real signal a workshop was scheduled, not just that
  // the page was viewed.
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

  let embedSrc = schedulerUrl;
  if (provider === "calendly") {
    const prefillParams = new URLSearchParams();
    if (name) prefillParams.set("name", name);
    if (user?.email) prefillParams.set("email", user.email);
    const embedParams = new URLSearchParams({
      embed_domain: typeof window !== "undefined" ? window.location.hostname : "",
      embed_type: "Inline",
      background_color: "ffffff",
      text_color: "0f172a",
      primary_color: "204ced",
      hide_gdpr_banner: "1",
      ...Object.fromEntries(prefillParams),
    });
    embedSrc = `${schedulerUrl}${schedulerUrl.includes("?") ? "&" : "?"}${embedParams.toString()}`;
  }

  return (
    <div className="h-full flex flex-col justify-between overflow-hidden">
      <div className="flex-1 overflow-y-auto pb-6 scrollbar-none">
        <SectionHeader
          eyebrow="Step 6 · Book Workshop"
          title={headline}
          description={
            stage === "details"
              ? description
              : "Pick a time — we already sent your details along."
          }
        />

        {stage === "details" ? (
          <form id="booking-form" onSubmit={handleSubmitDetails} className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left: the actual request form (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="glass-card p-6 lg:p-5.5">
                <label className="font-display text-sm font-semibold">Your name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-2 w-full rounded-xl border border-[#E3EBFF] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all duration-200"
                  style={{ borderRadius: 12 }}
                />
                {user?.email && (
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    We'll use <span className="font-medium text-foreground">{user.email}</span> to send
                    the invite.
                  </p>
                )}
              </div>

              <div className="glass-card p-6 lg:p-5.5">
                <label className="font-display text-sm font-semibold">
                  Which products are you interested in?
                </label>
                <div className="mt-3 flex flex-wrap gap-2">
                  {products.map((p) => {
                    const active = interests.includes(p.slug);
                    return (
                      <button
                        type="button"
                        key={p.slug}
                        onClick={() => toggleInterest(p.slug)}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                          active
                            ? "border-primary bg-primary text-white"
                            : "border-[#E3EBFF] bg-white text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        {active && <Check className="size-3" strokeWidth={3} />}
                        {p.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="glass-card p-6 lg:p-5.5">
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

              {provider === "tidycal" && (
                <div className="glass-card p-6 lg:p-5.5 space-y-4">
                  <p className="font-display text-sm font-semibold">
                    A few more details for your consultant
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Company name</label>
                      <input
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        required
                        className="mt-1.5 w-full rounded-xl border border-[#E3EBFF] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Designation</label>
                      <input
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        required
                        className="mt-1.5 w-full rounded-xl border border-[#E3EBFF] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Mobile no.</label>
                      <input
                        value={mobileNo}
                        onChange={(e) => setMobileNo(e.target.value)}
                        required
                        className="mt-1.5 w-full rounded-xl border border-[#E3EBFF] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Current SAP version</label>
                      <input
                        value={sapVersion}
                        onChange={(e) => setSapVersion(e.target.value)}
                        required
                        className="mt-1.5 w-full rounded-xl border border-[#E3EBFF] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Active SAP users</label>
                      <input
                        value={activeUsers}
                        onChange={(e) => setActiveUsers(e.target.value)}
                        required
                        className="mt-1.5 w-full rounded-xl border border-[#E3EBFF] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">SAP GRC in place?</label>
                      <div className="mt-1.5 flex gap-2">
                        {TIDYCAL_QUESTIONS.hasGrc.options.map((opt) => (
                          <button
                            type="button"
                            key={opt}
                            onClick={() => setHasGrc(opt)}
                            className={`flex-1 rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                              hasGrc === opt
                                ? "border-primary bg-primary text-white"
                                : "border-[#E3EBFF] bg-white text-muted-foreground hover:border-primary/40"
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      Solution(s) you wish to explore
                    </label>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {TIDYCAL_QUESTIONS.solutions.options.map((opt) => {
                        const active = solutions.includes(opt);
                        return (
                          <button
                            type="button"
                            key={opt}
                            onClick={() => toggleSolution(opt)}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                              active
                                ? "border-primary bg-primary text-white"
                                : "border-[#E3EBFF] bg-white text-muted-foreground hover:border-primary/40"
                            }`}
                          >
                            {active && <Check className="size-3" strokeWidth={3} />}
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right: what to expect + actions (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="glass-card p-6 lg:p-5.5">
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
            </div>
          </form>
        ) : (
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left Column: Calendly/TidyCal scheduler (9 cols) */}
            <div className="lg:col-span-9">
              <div className="glass-card overflow-hidden">
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
                      {/* Custom TidyCal API Scheduler UI */}
                      {provider === "tidycal" ? (
                        <div style={{ minHeight: 500 }}>
                          {loadingSlots ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-20 bg-white">
                              <div className="size-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                              <p className="text-xs text-muted-foreground">Finding available slots…</p>
                            </div>
                          ) : slots.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-20 bg-white text-center">
                              <div className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
                                <CalendarX className="size-5" />
                              </div>
                              <div>
                                <p className="font-display text-sm font-semibold text-foreground">No slots available</p>
                                <p className="mt-1 max-w-xs text-xs text-muted-foreground">There are currently no slots configured or available for scheduling.</p>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-2">
                              {/* Date Selection list */}
                              <div className="md:col-span-5 space-y-1 max-h-[480px] overflow-y-auto pr-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-2 px-1">Select Date</label>
                                {availableDates.map((date) => (
                                  <button
                                    key={date}
                                    onClick={() => {
                                      setSelectedDate(date);
                                      setSelectedSlot(null);
                                    }}
                                    className={`w-full text-left px-4 py-3 rounded-xl border text-xs font-semibold transition-all ${
                                      selectedDate === date
                                        ? "border-primary bg-primary/5 text-primary"
                                        : "border-[#E3EBFF] bg-white text-foreground hover:border-primary/30"
                                    }`}
                                  >
                                    {date}
                                  </button>
                                ))}
                              </div>

                              {/* Time Slots selector */}
                              <div className="md:col-span-7 space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-2 px-1">Select Time</label>
                                {selectedDate && slotsByDate[selectedDate] ? (
                                  <div className="grid grid-cols-2 gap-2 max-h-[440px] overflow-y-auto p-1">
                                    {slotsByDate[selectedDate].map((slot) => {
                                      const isSelected = selectedSlot?.starts_at === slot.starts_at;
                                      return (
                                        <button
                                          key={slot.starts_at}
                                          onClick={() => setSelectedSlot(slot)}
                                          className={`py-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                                            isSelected
                                              ? "border-primary bg-primary text-white shadow-md shadow-primary/10"
                                              : "border-[#E3EBFF] bg-white text-foreground hover:border-primary/30"
                                          }`}
                                        >
                                          {formatTime(slot.starts_at)}
                                        </button>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="h-40 flex items-center justify-center border border-dashed border-[#E3EBFF] rounded-xl text-xs text-muted-foreground">
                                    Please select a date first
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Calendly standard iframe embed */
                        <>
                          {!iframeLoaded && (
                            <div
                              className="absolute inset-3 flex flex-col items-center justify-center gap-3 rounded-2xl bg-white"
                              style={{ minHeight: 760 }}
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
                              height: 760,
                              border: "none",
                              opacity: iframeLoaded ? 1 : 0,
                              transition: "opacity 0.3s ease",
                            }}
                          />
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: expectations (3 cols) */}
            <div className="lg:col-span-3 flex flex-col gap-4">
              <div className="glass-card p-6 lg:p-5.5">
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
            </div>
          </div>
        )}
      </div>
      <div className="w-full shrink-0 h-20 lg:h-16 backdrop-blur-sm mt-auto flex items-center justify-between border-t border-border pr-16 lg:pr-24">
        {stage === "details" ? (
          <>
            <button
              type="button"
              onClick={() => navigate(`/experience/${productSlug}/ai`)}
              className="inline-flex items-center gap-1.5 text-sm lg:text-xs text-muted-foreground hover:text-foreground font-medium shrink-0"
            >
              <ArrowLeft className="size-4 lg:size-3.5" />
              <span className="hidden sm:inline">Back to AI</span>
              <span className="inline sm:hidden">Back</span>
            </button>
            <button
              type="submit"
              form="booking-form"
              disabled={submitting || !name.trim() || !tidycalFieldsValid}
              className="btn-primary lg:py-2 lg:px-4 lg:text-xs disabled:opacity-60 flex items-center gap-1.5 h-10 px-4 shrink-0"
            >
              {submitting ? (
                "Sending…"
              ) : (
                <>
                  <span className="hidden sm:inline">Continue to Scheduling</span>
                  <span className="inline sm:hidden">Continue</span>
                </>
              )}
              <ArrowRight className="size-4 lg:size-3.5" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setStage("details")}
              className="inline-flex items-center gap-1.5 text-sm lg:text-xs text-muted-foreground hover:text-foreground font-medium shrink-0"
            >
              <ArrowLeft className="size-4 lg:size-3.5" />
              <span className="hidden sm:inline">Back to details</span>
              <span className="inline sm:hidden">Back</span>
            </button>
            {provider === "tidycal" ? (
              <button
                onClick={handleBookSlot}
                disabled={submittingBooking || !selectedSlot}
                className="btn-primary lg:py-2 lg:px-4 lg:text-xs disabled:opacity-60 flex items-center gap-1.5 h-10 px-4 shrink-0"
              >
                <CalendarCheck className="size-4 lg:size-3.5" />
                <span>{submittingBooking ? "Booking Slot…" : "Confirm Booking"}</span>
              </button>
            ) : (
              <button
                onClick={schedule}
                disabled={scheduled}
                className="btn-primary lg:py-2 lg:px-4 lg:text-xs disabled:opacity-60 flex items-center gap-1.5 h-10 px-4 shrink-0"
              >
                <CalendarCheck className="size-4 lg:size-3.5" />
                <span className="hidden sm:inline">I've scheduled my session</span>
                <span className="inline sm:hidden">Scheduled</span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

