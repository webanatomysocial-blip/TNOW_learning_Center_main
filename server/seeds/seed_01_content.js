const PRODUCTS = [
  {
    id: "secops",
    name: "SecOps",
    tagline: "SAP Security Operations, automated.",
    description:
      "Automate SAP user provisioning, SoD analysis, license optimization, and emergency access — end to end.",
    capabilities: ["User Mgmt", "SoD", "Licenses", "Workflow"],
    time: "12 min",
    status: "available",
    cta: "Start Experience",
  },
  {
    id: "fftrust",
    name: "FF Trust",
    tagline: "Firefighter access with zero blind spots.",
    description: "Session recording, log analytics, and risk scoring for privileged SAP access.",
    capabilities: ["Firefighter", "Log Review", "Risk Scoring"],
    time: "10 min",
    status: "coming",
    cta: "Notify Me",
  },
  {
    id: "reviewnow",
    name: "ReviewNow",
    tagline: "Access recertification without the spreadsheets.",
    description:
      "Automate periodic user access reviews with policy-driven campaigns and audit trails.",
    capabilities: ["Campaigns", "Attestation", "Audit"],
    time: "8 min",
    status: "coming",
    cta: "Notify Me",
  },
  {
    id: "gams360",
    name: "GAMS360",
    tagline: "Governance, Access & Monitoring, unified.",
    description: "A single control plane for SAP GRC across systems and landscapes.",
    capabilities: ["GRC", "Monitoring", "Analytics"],
    time: "10 min",
    status: "coming",
    cta: "Notify Me",
  },
  {
    id: "digybots",
    name: "Digybots",
    tagline: "Intelligent bots for SAP operations.",
    description: "Automate repetitive SAP Basis and security operations with policy-safe bots.",
    capabilities: ["Automation", "Basis", "Ops"],
    time: "9 min",
    status: "coming",
    cta: "Notify Me",
  },
];

const CAPABILITIES = [
  {
    id: "user-management",
    title: "User Management",
    duration: "2:14",
    summary:
      "Provision and deprovision SAP users across ECC and S/4 landscapes with a single workflow.",
    features: [
      "Cross-system provisioning (ECC, S/4, BW, HANA)",
      "HR-driven joiner/mover/leaver",
      "Role-based approvals",
      "Real-time sync with SAP IdM",
    ],
    value: "Reduce provisioning time from days to minutes and cut helpdesk tickets by up to 50%.",
  },
  {
    id: "self-service",
    title: "Self Service",
    duration: "1:58",
    summary:
      "Empower business users to request SAP access through a branded, policy-driven portal.",
    features: [
      "Guided access catalog",
      "Business-friendly language",
      "Risk-aware approvals",
      "Full audit trail",
    ],
    value: "Deflect 60%+ of L1 tickets while keeping approvers in control.",
  },
  {
    id: "sod",
    title: "Segregation of Duties",
    duration: "2:41",
    summary: "Detect and remediate SoD conflicts before they hit production, not after the audit.",
    features: [
      "Real-time SoD simulation",
      "Ruleset library (SAP + custom)",
      "Mitigating controls",
      "Executive dashboards",
    ],
    value: "Ship access changes with confidence and stay continuously audit-ready.",
  },
  {
    id: "license",
    title: "License Optimization",
    duration: "2:02",
    summary: "Right-size SAP licenses by matching actual usage to license type — automatically.",
    features: [
      "Usage classification",
      "License reclassification",
      "Cost forecasts",
      "SAP LAW integration",
    ],
    value: "Typical savings of 15–30% on annual SAP license spend.",
  },
  {
    id: "workflow",
    title: "Workflow",
    duration: "1:47",
    summary: "Configurable approval flows that mirror how your organization actually works.",
    features: ["No-code designer", "Parallel & conditional steps", "SLA tracking", "Escalations"],
    value: "Standardize governance across regions without slowing the business down.",
  },
  {
    id: "role-management",
    title: "Role Management",
    duration: "2:23",
    summary: "Design, review, and maintain SAP roles with built-in risk analysis.",
    features: ["Role designer", "Impact analysis", "Version control", "Bulk maintenance"],
    value: "Keep your role catalog clean, current, and compliant.",
  },
];

const STORIES = [
  {
    id: "global-manufacturer",
    industry: "Manufacturing",
    company: "Global Industrial Group",
    metric: "62% ticket reduction",
    challenge:
      "20,000 SAP users across 14 plants, manual provisioning taking 4–6 days per request.",
    solution: "Deployed SecOps with HR-driven joiner/mover/leaver and self-service catalog.",
    results: "Provisioning reduced to under 12 minutes; L1 tickets dropped 62% in six months.",
  },
  {
    id: "pharma-compliance",
    industry: "Pharma",
    company: "Top-10 Pharmaceutical",
    metric: "100% audit ready",
    challenge:
      "FDA and SOX pressure with legacy SAP GRC unable to close SoD conflicts fast enough.",
    solution: "SecOps SoD simulation + mitigating controls integrated into every access request.",
    results: "Zero material audit findings for two consecutive years; 40% faster access requests.",
  },
  {
    id: "bank-license",
    industry: "Banking",
    company: "European Retail Bank",
    metric: "$3.2M saved",
    challenge: "Overspending on SAP Professional licenses across 8,000 users with unclear usage.",
    solution: "License optimization module identified reclassification candidates.",
    results: "$3.2M annual savings and full transparency ahead of SAP true-up.",
  },
  {
    id: "utility-audit",
    industry: "Utilities",
    company: "National Utility",
    metric: "Days → minutes",
    challenge: "Emergency access approvals taking 2–3 days, blocking incident response.",
    solution: "Firefighter workflow with policy-based approvals and session recording.",
    results: "Emergency access granted in under 3 minutes with full audit evidence.",
  },
];

exports.seed = async function (knex) {
  await knex("capabilities").del();
  await knex("stories").del();
  await knex("why_features").del();
  await knex("ai_qa").del();
  await knex("experience_pages").del();
  await knex("products").del();

  await knex("products").insert(
    PRODUCTS.map((p, idx) => ({
      slug: p.id,
      name: p.name,
      tagline: p.tagline,
      description: p.description,
      capabilities_tags: JSON.stringify(p.capabilities),
      time: p.time,
      status: p.status,
      cta: p.cta,
      sort_order: idx + 1,
    })),
  );

  // Capabilities/Stories/Why Features/AI Q&A all belong to a specific product —
  // this seed only ever populates the original SecOps content, so resolve its id
  // once and stamp every row with it (a NULL product_id here means the row never
  // shows up under /api/capabilities?product=secops, effectively invisible).
  const secops = await knex("products").where({ slug: "secops" }).first();

  await knex("capabilities").insert(
    CAPABILITIES.map((c, idx) => ({
      product_id: secops.id,
      slug: c.id,
      title: c.title,
      duration: c.duration,
      summary: c.summary,
      features: JSON.stringify(c.features),
      value: c.value,
      video_url: null,
      sort_order: idx + 1,
    })),
  );

  await knex("stories").insert(
    STORIES.map((s, idx) => ({
      product_id: secops.id,
      slug: s.id,
      industry: s.industry,
      company: s.company,
      metric: s.metric,
      challenge: s.challenge,
      solution: s.solution,
      results: s.results,
      sort_order: idx + 1,
    })),
  );

  await knex("why_features").insert([
    { product_id: secops.id, icon: "Timer", title: "Faster Provisioning", description: "Automate access requests in minutes.", sort_order: 1 },
    { product_id: secops.id, icon: "ShieldCheck", title: "Real-Time SoD", description: "Detect conflicts before approvals.", sort_order: 2 },
    { product_id: secops.id, icon: "CreditCard", title: "License Optimization", description: "Reduce SAP licensing costs.", sort_order: 3 },
    { product_id: secops.id, icon: "Users", title: "Unified Governance", description: "Manage users and compliance centrally.", sort_order: 4 },
  ]);

  await knex("ai_qa").insert([
    { product_id: secops.id, sort_order: 1, topic: "Business Value", question: "What is the typical ROI timeline?",
      answer: "Most enterprises achieve full payback in 4 to 6 months. Savings are driven by immediate SAP license optimization (typically 15-30% spend reduction), 50%+ reduction in IT helpdesk ticket volume, and eliminating audit-prep manual fire drills." },
    { product_id: secops.id, sort_order: 2, topic: "Compliance", question: "How does this fit our compliance and audit cycle?",
      answer: "SecOps is built for continuous compliance. It replaces manual periodic fire drills with real-time Segregation of Duties (SoD) checking and auto-generates audit evidence on demand. It turns compliance into a frictionless background process." },
    { product_id: secops.id, sort_order: 3, topic: "Implementation", question: "What does implementation require from our team?",
      answer: "Very little. SecOps connects via secure, standard SAP RFCs without any ABAP custom code. It requires about 2-3 hours of an SAP Basis administrator's time for configuration, and a security analyst to review the out-of-the-box rulesets." },
    { product_id: secops.id, sort_order: 4, topic: "Commercial", question: "How is licensing priced?",
      answer: "Licensing is per named SAP user, tiered by module. Typical enterprises see 3–5x ROI in year one through license optimization alone." },
    { product_id: secops.id, sort_order: 5, topic: "Compatibility", question: "Does SecOps support SAP ECC?",
      answer: "Yes — SecOps supports SAP ECC 6.0 EhP7 and above via a certified RFC connector. Existing PFCG roles, user master data, and SUIM extracts continue to work without change." },
    { product_id: secops.id, sort_order: 6, topic: "Compatibility", question: "Does SecOps support S/4HANA?",
      answer: "Yes. SecOps is certified for S/4HANA on-premise and RISE/GROW deployments, including Fiori catalog-based authorization and business role composition." },
    { product_id: secops.id, sort_order: 7, topic: "Deployment", question: "Is there a cloud deployment option?",
      answer: "SecOps runs on-premise, on your private cloud (AWS, Azure, GCP), or fully managed by ToggleNow. All deployment modes share the same feature set." },
    { product_id: secops.id, sort_order: 8, topic: "Architecture", question: "What does the architecture look like?",
      answer: "A stateless application tier (Java + React) communicates with SAP via secure RFC. Data is stored in your database of choice (HANA, Postgres, Oracle). Zero footprint inside SAP." },
    { product_id: secops.id, sort_order: 9, topic: "Migration", question: "How do you handle migration from SAP GRC?",
      answer: "We provide a GRC accelerator that imports rulesets, mitigating controls, and role definitions, cutting migration effort by 60%." },
  ]);

  await knex("experience_pages").insert([
    {
      product_id: secops.id,
      page: "why",
      headline: "Why enterprise SAP teams choose SecOps",
      description: "A quick tour of the problems SecOps solves, why the manual approach breaks down, and what changes on day one.",
      extra: JSON.stringify({ videoTitle: "Walkthrough Demo", videoDuration: "2 min 48 sec", videoUrl: "" }),
    },
    {
      product_id: secops.id,
      page: "ai",
      headline: "Ask the SecOps expert anything",
      description: "Get instant, accurate answers about SAP compatibility, architecture, licensing, and rollout — with references you can hand to your team.",
      extra: JSON.stringify({ introMessage: "I'm the SecOps expert. Ask me about compatibility, architecture, licensing, or implementation. Pick a suggested question or type your own." }),
    },
  ]);
};
