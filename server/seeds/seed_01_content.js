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
    status: "available",
    cta: "Start Experience",
  },
  {
    id: "reviewnow",
    name: "ReviewNow",
    tagline: "Access recertification without the spreadsheets.",
    description:
      "Automate periodic user access reviews with policy-driven campaigns and audit trails.",
    capabilities: ["Campaigns", "Attestation", "Audit"],
    time: "8 min",
    status: "available",
    cta: "Start Experience",
  },
  {
    id: "gams360",
    name: "GAMS360",
    tagline: "Governance, Access & Monitoring, unified.",
    description: "A single control plane for SAP GRC across systems and landscapes.",
    capabilities: ["GRC", "Monitoring", "Analytics"],
    time: "10 min",
    status: "available",
    cta: "Start Experience",
  },
  {
    id: "digybots",
    name: "Digybots",
    tagline: "Intelligent bots for SAP operations.",
    description: "Automate repetitive SAP Basis and security operations with policy-safe bots.",
    capabilities: ["Automation", "Basis", "Ops"],
    time: "9 min",
    status: "available",
    cta: "Start Experience",
  },
];

const CAPABILITIES = {
  secops: [
    {
      id: "secops-user-management",
      title: "User Management",
      duration: "2:14",
      summary: "Provision and deprovision SAP users across ECC and S/4 landscapes with a single workflow.",
      features: [
        "Cross-system provisioning (ECC, S/4, BW, HANA)",
        "HR-driven joiner/mover/leaver",
        "Role-based approvals",
        "Real-time sync with SAP IdM",
      ],
      value: "Reduce provisioning time from days to minutes and cut helpdesk tickets by up to 50%.",
    },
    {
      id: "secops-self-service",
      title: "Self Service",
      duration: "1:58",
      summary: "Empower business users to request SAP access through a branded, policy-driven portal.",
      features: [
        "Guided access catalog",
        "Business-friendly language",
        "Risk-aware approvals",
        "Full audit trail",
      ],
      value: "Deflect 60%+ of L1 tickets while keeping approvers in control.",
    },
    {
      id: "secops-sod",
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
      id: "secops-license",
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
      id: "secops-workflow",
      title: "Workflow",
      duration: "1:47",
      summary: "Configurable approval flows that mirror how your organization actually works.",
      features: ["No-code designer", "Parallel & conditional steps", "SLA tracking", "Escalations"],
      value: "Standardize governance across regions without slowing the business down.",
    },
    {
      id: "secops-role-management",
      title: "Role Management",
      duration: "2:23",
      summary: "Design, review, and maintain SAP roles with built-in risk analysis.",
      features: ["Role designer", "Impact analysis", "Version control", "Bulk maintenance"],
      value: "Keep your role catalog clean, current, and compliant.",
    },
  ],
  fftrust: [
    {
      id: "fftrust-session-recording",
      title: "Session Recording",
      duration: "3:05",
      summary: "Continuous session video and transaction recording for privileged firefighter sessions.",
      features: [
        "Video-like screen session playback",
        "Command/transaction command-level logs",
        "Integrate with SAP terminal protocol",
        "Zero performance impact",
      ],
      value: "Complete visibility into all privileged actions with zero blind spots.",
    },
    {
      id: "fftrust-risk-scoring",
      title: "Risk Scoring",
      duration: "2:20",
      summary: "AI-driven risk classification for privileged transactions and operations.",
      features: [
        "Real-time transaction risk scoring",
        "Anomalous behavior detection",
        "Privileged activity alerts",
        "Risk density reporting",
      ],
      value: "Instantly isolate and review high-risk commands out of millions of logs.",
    },
    {
      id: "fftrust-log-review",
      title: "Log Review",
      duration: "2:45",
      summary: "Automated review, consolidation and correlation of SAP audit logs.",
      features: [
        "Consolidate SM20, CDHDR, and DBTABLOG logs",
        "Auto-isolate policy deviations",
        "Audit evidence signing",
        "One-click approval workflow",
      ],
      value: "Reduce manual log review times from weeks to minutes.",
    },
  ],
  reviewnow: [
    {
      id: "reviewnow-campaigns",
      title: "Campaigns",
      duration: "2:10",
      summary: "Design and launch structured, automated user access review campaigns.",
      features: [
        "Recurring and ad-hoc UAR campaigns",
        "Target specific roles or critical transactions",
        "Automated email notifications & alerts",
        "SLA tracking and escalations",
      ],
      value: "Ditch the spreadsheets and keep campaigns on track automatically.",
    },
    {
      id: "reviewnow-attestation",
      title: "Attestation",
      duration: "2:30",
      summary: "A self-service portal for business managers to verify and recertify access.",
      features: [
        "Business-friendly role/permission explanations",
        "Smart transaction-based role recommendations",
        "Batch approve/revoke actions",
        "Delegate reviews with context",
      ],
      value: "Boost completion rates and ensure review accuracy.",
    },
    {
      id: "reviewnow-audit-trails",
      title: "Audit Trails",
      duration: "1:55",
      summary: "Generate clean, policy-compliant attestation trails ready for auditors.",
      features: [
        "PDF report generation on demand",
        "Historical signing timestamps",
        "Unmodifiable compliance vault logs",
        "Integration with GRC modules",
      ],
      value: "Fulfill SOX and internal audit compliance checks instantly.",
    },
  ],
  gams360: [
    {
      id: "gams360-unified-grc",
      title: "Unified GRC",
      duration: "3:15",
      summary: "A single executive pane of glass across your entire SAP landscape.",
      features: [
        "ECC, S/4HANA, SuccessFactors & BTP support",
        "Real-time GRC posture score",
        "Security alert console",
        "Cross-system dashboarding",
      ],
      value: "Unify visibility and policy enforcement across heterogeneous environments.",
    },
    {
      id: "gams360-monitoring",
      title: "Monitoring",
      duration: "2:40",
      summary: "Continuous configuration drift and patch level monitoring.",
      features: [
        "System parameter configuration audit",
        "Critical security patch alerts",
        "System baseline comparison",
        "Drift detection & auto-healing alerts",
      ],
      value: "Avoid unauthorized configurations and keep security posture hardened.",
    },
    {
      id: "gams360-analytics",
      title: "Analytics",
      duration: "2:15",
      summary: "Executive financial and operational reporting on SAP access.",
      features: [
        "License cost clawback recommendations",
        "Inactive user detection",
        "SoD risk density maps",
        "Audit-prep readiness gauges",
      ],
      value: "Turn raw access logs into strategic business decisions and savings.",
    },
  ],
  digybots: [
    {
      id: "digybots-automation",
      title: "Automation",
      duration: "2:05",
      summary: "Automate daily SAP Basis and security checklist execution.",
      features: [
        "Daily system checklist builder",
        "Automated execution scheduling",
        "Result logging and archiving",
        "Alerting on checklist failures",
      ],
      value: "Complete daily system health checks in minutes instead of hours.",
    },
    {
      id: "digybots-basis-bots",
      title: "Basis Bots",
      duration: "2:50",
      summary: "Policy-safe digital bots for repetitive administrative chores.",
      features: [
        "Lock table cleaning bots",
        "Database space expansion bots",
        "Buffer quality optimization bots",
        "Spool cleanup automation",
      ],
      value: "Free up Basis administrators from routine tickets and reduce human errors.",
    },
    {
      id: "digybots-ops-bots",
      title: "Ops Bots",
      duration: "2:10",
      summary: "Automated assistants for user password resets and locking.",
      features: [
        "Self-service integration with ticketing",
        "Encrypted credential vault lookup",
        "Intelligent lockout verification",
        "Immediate incident response bots",
      ],
      value: "Resolve routine IT security tickets instantly and securely.",
    },
  ],
};

const STORIES = {
  secops: [
    {
      id: "secops-global-manufacturer",
      industry: "Manufacturing",
      company: "Global Industrial Group",
      metric: "62% ticket reduction",
      challenge: "20,000 SAP users across 14 plants, manual provisioning taking 4–6 days per request.",
      solution: "Deployed SecOps with HR-driven joiner/mover/leaver and self-service catalog.",
      results: "Provisioning reduced to under 12 minutes; L1 tickets dropped 62% in six months.",
    },
    {
      id: "secops-pharma-compliance",
      industry: "Pharma",
      company: "Top-10 Pharmaceutical",
      metric: "100% audit ready",
      challenge: "FDA and SOX pressure with legacy SAP GRC unable to close SoD conflicts fast enough.",
      solution: "SecOps SoD simulation + mitigating controls integrated into every access request.",
      results: "Zero material audit findings for two consecutive years; 40% faster access requests.",
    },
    {
      id: "secops-bank-license",
      industry: "Banking",
      company: "European Retail Bank",
      metric: "$3.2M saved",
      challenge: "Overspending on SAP Professional licenses across 8,000 users with unclear usage.",
      solution: "License optimization module identified reclassification candidates.",
      results: "$3.2M annual savings and full transparency ahead of SAP true-up.",
    },
    {
      id: "secops-utility-audit",
      industry: "Utilities",
      company: "National Utility",
      metric: "Days → minutes",
      challenge: "Emergency access approvals taking 2–3 days, blocking incident response.",
      solution: "Firefighter workflow with policy-based approvals and session recording.",
      results: "Emergency access granted in under 3 minutes with full audit evidence.",
    },
  ],
  fftrust: [
    {
      id: "fftrust-energy-grid",
      industry: "Utilities",
      company: "Global Grid & Utilities",
      metric: "95% audit prep cut",
      challenge: "Struggled to audit privileged firefighter sessions across 8 countries, taking weeks to correlate raw logs.",
      solution: "Implemented FF Trust for session video recording and automatic log correlation.",
      results: "Reduced firefighter audit preparation time by 95% and resolved policy deviations within minutes.",
    },
    {
      id: "fftrust-vanguard-bank",
      industry: "Banking",
      company: "Vanguard Trust Corp",
      metric: "< 2 min detection",
      challenge: "Auditors flagged lack of visibility into DBTABLOG and direct database mutations by administrators.",
      solution: "Deployed FF Trust Basis agents to record and score privileged transactions.",
      results: "Achieved continuous session tracking with instant notifications on anomalous data changes.",
    },
  ],
  reviewnow: [
    {
      id: "reviewnow-hypermart",
      industry: "Retail",
      company: "HyperMart Worldwide",
      metric: "90% UAR time cut",
      challenge: "Access reviews for 45,000 employees managed on spreadsheets, leading to review fatigue and errors.",
      solution: "Automated campaign scheduling and manager attestation portal with ReviewNow.",
      results: "UAR execution time cut from 3 months to 10 days; 100% completion rate achieved.",
    },
    {
      id: "reviewnow-carealliance",
      industry: "Healthcare",
      company: "CareAlliance Health",
      metric: "100% SOX compliant",
      challenge: "Inability to prove timely deprovisioning of terminated employee access during HIPAA audits.",
      solution: "Integrated ReviewNow with Active Directory for automated termination campaign triggers.",
      results: "Deprovisioning latency reduced to under an hour with absolute compliance trails.",
    },
  ],
  gams360: [
    {
      id: "gams360-transglobal",
      industry: "Logistics",
      company: "TransGlobal Logistics",
      metric: "$450k saved yearly",
      challenge: "No central view of SAP licensing and security drift across ECC, S/4, and SuccessFactors.",
      solution: "Consolidated all SAP tenants into GAMS360 unified console.",
      results: "Identified $450k in idle licenses and unified SoD rulesets across regions.",
    },
    {
      id: "gams360-aeroparts",
      industry: "Manufacturing",
      company: "AeroParts International",
      metric: "Zero drift incidents",
      challenge: "System configuration changes made directly in production without proper change request audits.",
      solution: "Active configuration drift monitoring using GAMS360.",
      results: "Reduced unauthorized production drifts to zero and streamlined audit reporting.",
    },
  ],
  digybots: [
    {
      id: "digybots-apex",
      industry: "Services",
      company: "Apex Consulting Services",
      metric: "85% ticket reduction",
      challenge: "Helpdesk overwhelmed by routine password reset and locking tickets, delaying project work.",
      solution: "Implemented Digybots self-service Basis automation.",
      results: "Auto-resolved 85% of standard user lockout tickets, freeing up senior administrators.",
    },
    {
      id: "digybots-biogenics",
      industry: "Pharma",
      company: "Biogenics Research",
      metric: "Zero human errors",
      challenge: "Critical backup and table expansion tasks failing due to manual scripting mistakes.",
      solution: "Standardized Basis operations via policy-safe Digybots.",
      results: "Eliminated human operational error from routine Basis maintenance; health checks down to 10 min.",
    },
  ],
};

const WHY_FEATURES = {
  secops: [
    { icon: "Timer", title: "Faster Provisioning", description: "Automate access requests in minutes." },
    { icon: "ShieldCheck", title: "Real-Time SoD", description: "Detect conflicts before approvals." },
    { icon: "CreditCard", title: "License Optimization", description: "Reduce SAP licensing costs." },
    { icon: "Users", title: "Unified Governance", description: "Manage users and compliance centrally." },
  ],
  fftrust: [
    { icon: "Timer", title: "Session Replay", description: "Watch video-like replay of firefighter sessions." },
    { icon: "ShieldCheck", title: "Anomalous Alerts", description: "Real-time alerts on risk deviation." },
    { icon: "CreditCard", title: "Correlation Engine", description: "Aggregate SM20, CDHDR, and DBTABLOG automatically." },
    { icon: "Users", title: "Low Footprint", description: "Certified Basis agent that doesn't impact production speed." },
  ],
  reviewnow: [
    { icon: "Timer", title: "Auto Campaigns", description: "Trigger reviews based on dates or HR events." },
    { icon: "ShieldCheck", title: "Attestation Portal", description: "Frictionless UI for business reviewers." },
    { icon: "CreditCard", title: "Deprovision Engine", description: "Instantly disable revoked access in SAP." },
    { icon: "Users", title: "Smart Insights", description: "Usage-based role recommendations." },
  ],
  gams360: [
    { icon: "Timer", title: "Unified Console", description: "ECC, S/4HANA, BTP, and SuccessFactors in one place." },
    { icon: "ShieldCheck", title: "Drift Prevention", description: "Detect configuration change deviations." },
    { icon: "CreditCard", title: "License Clawbacks", description: "Reclaim cost from idle accounts." },
    { icon: "Users", title: "Risk Density maps", description: "Clear visibility into team access risks." },
  ],
  digybots: [
    { icon: "Timer", title: "Basis Checklist", description: "Run system checklists automatically on schedules." },
    { icon: "ShieldCheck", title: "Error Free", description: "Eliminate manual mistakes in command execution." },
    { icon: "CreditCard", title: "IT Ticketing Sync", description: "Connect with ServiceNow, Jira, etc." },
    { icon: "Users", title: "Vault Security", description: "Execute actions securely with certified credentials." },
  ],
};

const AI_QA = {
  secops: [
    { topic: "Business Value", question: "What is the typical ROI timeline?",
      answer: "Most enterprises achieve full payback in 4 to 6 months. Savings are driven by immediate SAP license optimization (typically 15-30% spend reduction), 50%+ reduction in IT helpdesk ticket volume, and eliminating audit-prep manual fire drills." },
    { topic: "Compliance", question: "How does this fit our compliance and audit cycle?",
      answer: "SecOps is built for continuous compliance. It replaces manual periodic fire drills with real-time Segregation of Duties (SoD) checking and auto-generates audit evidence on demand. It turns compliance into a frictionless background process." },
    { topic: "Implementation", question: "What does implementation require from our team?",
      answer: "Very little. SecOps connects via secure, standard SAP RFCs without any ABAP custom code. It requires about 2-3 hours of an SAP Basis administrator's time for configuration, and a security analyst to review the out-of-the-box rulesets." },
    { topic: "Commercial", question: "How is licensing priced?",
      answer: "Licensing is per named SAP user, tiered by module. Typical enterprises see 3–5x ROI in year one through license optimization alone." },
    { topic: "Compatibility", question: "Does SecOps support SAP ECC?",
      answer: "Yes — SecOps supports SAP ECC 6.0 EhP7 and above via a certified RFC connector. Existing PFCG roles, user master data, and SUIM extracts continue to work without change." },
    { topic: "Compatibility", question: "Does SecOps support S/4HANA?",
      answer: "Yes. SecOps is certified for S/4HANA on-premise and RISE/GROW deployments, including Fiori catalog-based authorization and business role composition." },
    { topic: "Deployment", question: "Is there a cloud deployment option?",
      answer: "SecOps runs on-premise, on your private cloud (AWS, Azure, GCP), or fully managed by ToggleNow. All deployment modes share the same feature set." },
    { topic: "Architecture", question: "What does the architecture look like?",
      answer: "A stateless application tier (Java + React) communicates with SAP via secure RFC. Data is stored in your database of choice (HANA, Postgres, Oracle). Zero footprint inside SAP." },
    { topic: "Migration", question: "How do you handle migration from SAP GRC?",
      answer: "We provide a GRC accelerator that imports rulesets, mitigating controls, and role definitions, cutting migration effort by 60%." },
  ],
  fftrust: [
    { topic: "Storage", question: "Does session recording impact database size?",
      answer: "FF Trust uses advanced delta-compression. Typical session videos use less than 2MB per hour of active session, making long-term storage extremely cost-effective." },
    { topic: "Connectivity", question: "How does FF Trust connect to SAP?",
      answer: "It connects via standard secure RFCs, requiring a small certified Basis transport package with read-only permissions for log directories." },
    { topic: "Real-time", question: "Can it alert in real-time?",
      answer: "Yes. While logs are checked periodically, critical transaction triggers (like executing SE16 or modifying tables) send instant alerts to your security team." },
    { topic: "Compliance", question: "Is firefighter review mandatory?",
      answer: "Yes, FF Trust automates compliance by automatically prompting reviewers to sign off on recorded firefighter logs and recording their approval status." },
  ],
  reviewnow: [
    { topic: "Clarity", question: "How do managers know what they are approving?",
      answer: "ReviewNow translates cryptic SAP role names (e.g. Z_FI_AP_02) into plain business language and shows which transactions the user actually ran." },
    { topic: "Campaigns", question: "Can we run reviews on-demand?",
      answer: "Yes, you can launch ad-hoc campaigns for specific audit requests, high-risk roles, or departments at any time." },
    { topic: "Deprovisioning", question: "What happens when a manager revokes access?",
      answer: "ReviewNow can automatically trigger deprovisioning via our integration engine, or queue a standard ticketing workflow for Basis." },
    { topic: "Compliance", question: "How does it help with SOX compliance?",
      answer: "ReviewNow maintains an unmodifiable record of every review, approval, rejection, and subsequent deprovisioning, producing auditor-ready PDFs." },
  ],
  gams360: [
    { topic: "Systems", question: "Which SAP systems are supported?",
      answer: "We support ECC 6.0 and above, S/4HANA (on-prem/RISE), SuccessFactors, and BTP integrations out-of-the-box." },
    { topic: "Monitoring", question: "How is security drift monitored?",
      answer: "GAMS360 compares system profile parameters (RZ10/RZ11) and client settings against a secure baseline hourly, flagging any unauthorized changes." },
    { topic: "Licensing", question: "How does it optimize licensing costs?",
      answer: "By checking active transaction logs, it identifies users with expensive professional licenses who only perform read-only actions, suggesting downgrades." },
    { topic: "Architecture", question: "Does it require additional hardware?",
      answer: "No. GAMS360 runs in the cloud or as a lightweight virtual appliance in your private network." },
  ],
  digybots: [
    { topic: "Safety", question: "Are Digybots safe to run on production?",
      answer: "Yes. Digybots execute actions using predefined, restricted SAP accounts and adhere to strict policy rulesets with manual approval gates if needed." },
    { topic: "Capabilities", question: "Can they handle user administration?",
      answer: "Yes, they can lock/unlock accounts, reset passwords, and assign basic roles based on approved helpdesk tickets." },
    { topic: "Audit", question: "How do we monitor bot activity?",
      answer: "Every action taken by a Digybot is logged in a separate audit trail, including transaction codes run and responses received." },
    { topic: "Scripting", question: "Is custom scripting required?",
      answer: "No. Digybots come with pre-built templates for common Basis tasks, allowing you to configure parameters without writing code." },
  ],
};

const EXPERIENCE_PAGES = {
  secops: [
    {
      page: "why",
      headline: "Why enterprise SAP teams choose SecOps",
      description: "A quick tour of the problems SecOps solves, why the manual approach breaks down, and what changes on day one.",
      extra: { videoTitle: "Walkthrough Demo", videoDuration: "2 min 48 sec", videoUrl: "" },
    },
    {
      page: "ai",
      headline: "Ask the SecOps expert anything",
      description: "Get instant, accurate answers about SAP compatibility, architecture, licensing, and rollout — with references you can hand to your team.",
      extra: { introMessage: "I'm the SecOps expert. Ask me about compatibility, architecture, licensing, or implementation. Pick a suggested question or type your own." },
    },
    {
      page: "book",
      headline: "Book a SecOps Workshop",
      description: "Schedule a custom, 45-minute working session with our team to map SecOps against your current SAP landscape.",
      extra: { calendlyUrl: "https://tidycal.com/togglenow/product-demo" },
    },
  ],
  fftrust: [
    {
      page: "why",
      headline: "Why enterprise SAP teams choose FF Trust",
      description: "Understand the risks of privileged session auditing, how FF Trust provides zero blind spots, and how reviews are automated.",
      extra: { videoTitle: "FF Trust Demo", videoDuration: "3 min 15 sec", videoUrl: "" },
    },
    {
      page: "ai",
      headline: "Ask the FF Trust expert anything",
      description: "Get immediate answers about firefighter session recording, log consolidation, and compliance reporting.",
      extra: { introMessage: "I'm the FF Trust expert. Ask me about video logging, risk scoring, or audit readiness. Select a suggested question below or write your own." },
    },
    {
      page: "book",
      headline: "Book an FF Trust Workshop",
      description: "Schedule a deep dive session to explore how FF Trust captures privileged user actions without degrading performance.",
      extra: { calendlyUrl: "https://tidycal.com/togglenow/product-demo" },
    },
  ],
  reviewnow: [
    {
      page: "why",
      headline: "Why enterprise SAP teams choose ReviewNow",
      description: "See how automated UAR campaigns eliminate review fatigue and help you stay SOX-compliant without spreadsheet chaos.",
      extra: { videoTitle: "ReviewNow Demo", videoDuration: "2 min 30 sec", videoUrl: "" },
    },
    {
      page: "ai",
      headline: "Ask the ReviewNow expert anything",
      description: "Get instant responses regarding manager attestation, automated campaigns, and ticketing integrations.",
      extra: { introMessage: "I'm the ReviewNow expert. Ask me about campaign setup, role mapping, or auto-deprovisioning." },
    },
    {
      page: "book",
      headline: "Book a ReviewNow Workshop",
      description: "Ready to automate access reviews? Pick a time to set up a scoping session for your campaign rules.",
      extra: { calendlyUrl: "https://tidycal.com/togglenow/product-demo" },
    },
  ],
  gams360: [
    {
      page: "why",
      headline: "Why enterprise SAP teams choose GAMS360",
      description: "Discover how GAMS360 provides a single pane of glass for ECC, S/4HANA, SuccessFactors, and BTP.",
      extra: { videoTitle: "GAMS360 Overview", videoDuration: "3 min", videoUrl: "" },
    },
    {
      page: "ai",
      headline: "Ask the GAMS360 expert anything",
      description: "Learn how GAMS360 monitors configuration drift and unifies security policy across systems.",
      extra: { introMessage: "I'm the GAMS360 expert. Ask me about dashboard consolidation, parameter drift tracking, or license reclamation." },
    },
    {
      page: "book",
      headline: "Book a GAMS360 Workshop",
      description: "Let's structure a unified GRC dashboard demo using your multi-system landscape requirements.",
      extra: { calendlyUrl: "https://tidycal.com/togglenow/product-demo" },
    },
  ],
  digybots: [
    {
      page: "why",
      headline: "Why enterprise SAP teams choose Digybots",
      description: "Learn how policy-safe digital assistants automate daily Basis tasks and user management safely.",
      extra: { videoTitle: "Digybots Demo", videoDuration: "2 min 15 sec", videoUrl: "" },
    },
    {
      page: "ai",
      headline: "Ask the Digybots expert anything",
      description: "Ask questions about Basis checklist execution, ServiceNow synchronization, and credential security.",
      extra: { introMessage: "I'm the Digybots expert. Ask me about task automation, script safety, or audit logging." },
    },
    {
      page: "book",
      headline: "Book a Digybots Workshop",
      description: "Book a technical workshop to discuss which Basis operations you can automate on day one.",
      extra: { calendlyUrl: "https://tidycal.com/togglenow/product-demo" },
    },
  ],
};

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

  const productRows = await knex("products").select("id", "slug");
  const productsBySlug = Object.fromEntries(productRows.map((p) => [p.slug, p.id]));

  for (const [slug, capabilities] of Object.entries(CAPABILITIES)) {
    const productId = productsBySlug[slug];
    if (!productId) continue;

    await knex("capabilities").insert(
      capabilities.map((c, idx) => ({
        product_id: productId,
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
  }

  for (const [slug, stories] of Object.entries(STORIES)) {
    const productId = productsBySlug[slug];
    if (!productId) continue;

    await knex("stories").insert(
      stories.map((s, idx) => ({
        product_id: productId,
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
  }

  for (const [slug, features] of Object.entries(WHY_FEATURES)) {
    const productId = productsBySlug[slug];
    if (!productId) continue;

    await knex("why_features").insert(
      features.map((f, idx) => ({
        product_id: productId,
        icon: f.icon,
        title: f.title,
        description: f.description,
        sort_order: idx + 1,
      })),
    );
  }

  for (const [slug, qaList] of Object.entries(AI_QA)) {
    const productId = productsBySlug[slug];
    if (!productId) continue;

    await knex("ai_qa").insert(
      qaList.map((qa, idx) => ({
        product_id: productId,
        sort_order: idx + 1,
        topic: qa.topic,
        question: qa.question,
        answer: qa.answer,
      })),
    );
  }

  for (const [slug, pages] of Object.entries(EXPERIENCE_PAGES)) {
    const productId = productsBySlug[slug];
    if (!productId) continue;

    await knex("experience_pages").insert(
      pages.map((p) => ({
        product_id: productId,
        page: p.page,
        headline: p.headline,
        description: p.description,
        extra: JSON.stringify(p.extra),
      })),
    );
  }
};
