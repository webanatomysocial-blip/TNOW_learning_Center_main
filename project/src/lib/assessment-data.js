export const ASSESSMENT_QUESTIONS = [
  {
    id: 1,
    dim: "PROVISIONING",
    q: "How are user access requests approved and provisioned today?",
    opts: [
      {
        text: "Over email, chat or verbal sign-off · admins execute the changes by hand",
        s: 0,
        flag: "Email and chat-based access approvals with manual execution",
      },
      {
        text: "Through a ticketing tool, but with manual steps and admin handoffs in between",
        s: 1,
      },
      {
        text: "Fully automated workflow with role-based, rule-driven provisioning",
        s: 2,
      },
    ],
  },
  {
    id: 2,
    dim: "SOD ANALYSIS",
    q: "When is Segregation of Duties (SoD) analyzed in your access lifecycle?",
    opts: [
      {
        text: "Only during periodic audits or after an issue is flagged by internal controls",
        s: 0,
        flag: "Reactive SoD analysis only during audits",
      },
      {
        text: "Manually checked during request approval using spreadsheets or periodic extracts",
        s: 1,
      },
      {
        text: "Preventively simulated in real-time before access is granted",
        s: 2,
      },
    ],
  },
  {
    id: 3,
    dim: "RESOLUTION SPEED",
    q: "On average, how long does it take to resolve an access-related issue or ticket?",
    opts: [
      {
        text: "More than 4 hours, sometimes several days across multiple handoffs",
        s: 0,
        flag: "Multi-day access provisioning & resolution handoffs",
      },
      {
        text: "Between 1 and 4 hours depending on approver availability",
        s: 1,
      },
      {
        text: "Under an hour, with automated routing and instant provisioning",
        s: 2,
      },
    ],
  },
  {
    id: 4,
    dim: "EMERGENCY ACCESS",
    q: "How is emergency, ad-hoc or firefighter access managed?",
    opts: [
      {
        text: "Shared generic superuser passwords with manual post-activity log checks",
        s: 0,
        flag: "Shared firefighter passwords without session recording",
      },
      {
        text: "Temporary elevated accounts with manual sign-off and review",
        s: 1,
      },
      {
        text: "Self-service elevation with automated workflow, full session replay & audit trails",
        s: 2,
      },
    ],
  },
  {
    id: 5,
    dim: "USER ACCESS REVIEWS",
    q: "How are periodic user access certifications and recertifications conducted?",
    opts: [
      {
        text: "Manual spreadsheets emailed to managers with high administrative burden",
        s: 0,
        flag: "Spreadsheet-driven access recertifications prone to rubber-stamping",
      },
      {
        text: "Semi-automated campaign reports requiring manual reconciliation",
        s: 1,
      },
      {
        text: "Automated campaign manager with one-click attestations and auto-deprovisioning",
        s: 2,
      },
    ],
  },
  {
    id: 6,
    dim: "LIFECYCLE MANAGEMENT",
    q: "How are employee role changes and terminations synchronized with SAP access?",
    opts: [
      {
        text: "HR notifies IT manually; deprovisioning often lags days or weeks",
        s: 0,
        flag: "Manual HR offboarding leaving orphaned SAP accounts active",
      },
      {
        text: "Scheduled batch reviews with semi-manual account deactivations",
        s: 1,
      },
      {
        text: "Real-time event-driven sync directly from HR / IdM system",
        s: 2,
      },
    ],
  },
  {
    id: 7,
    dim: "LICENSE RIGHT-SIZING",
    q: "How does your organization monitor and optimize SAP user license allocations?",
    opts: [
      {
        text: "Reactive true-up scramble before annual audit; mostly guesswork",
        s: 0,
        flag: "Unoptimized SAP license tier assignments ahead of audits",
      },
      {
        text: "Periodic manual LAW extracts and license classification spreadsheets",
        s: 1,
      },
      {
        text: "Continuous automated activity profiling with license downgrade recommendations",
        s: 2,
      },
    ],
  },
  {
    id: 8,
    dim: "AUDIT READINESS",
    q: "How much effort is required to prepare evidence for internal and external audits?",
    opts: [
      {
        text: "Weeks of manual screenshotting, log pulling, and spreadsheet formatting",
        s: 0,
        flag: "Weeks of manual evidence gathering for internal and external audits",
      },
      {
        text: "Several days compiling reports from multiple systems and ticketing tools",
        s: 1,
      },
      {
        text: "Instant, continuous audit-ready reports generated with one click",
        s: 2,
      },
    ],
  },
  {
    id: 9,
    dim: "ROLE GOVERNANCE",
    q: "What is the current health and structure of your SAP authorization role catalog?",
    opts: [
      {
        text: "Heavy role bloat, composite roles with redundant and conflicting authorizations",
        s: 0,
        flag: "Accumulated SAP role bloat with toxic combination risks",
      },
      {
        text: "Partially standardized role design with occasional manual clean-up projects",
        s: 1,
      },
      {
        text: "Clean, business-aligned single roles with automated impact simulation",
        s: 2,
      },
    ],
  },
  {
    id: 10,
    dim: "LANDSCAPE INTEGRATION",
    q: "How are access controls governed across multiple SAP systems (ECC, S/4, BTP, Cloud)?",
    opts: [
      {
        text: "Each SAP instance is managed in silos with disconnected user IDs",
        s: 0,
        flag: "Siloed access governance across disconnected SAP landscapes",
      },
      {
        text: "Centralized ticketing with separate manual administration teams per system",
        s: 1,
      },
      {
        text: "Unified cross-system governance plane covering on-premise, cloud, and hybrid",
        s: 2,
      },
    ],
  },
  {
    id: 11,
    dim: "CONTINUOUS MONITORING",
    q: "How do you detect sensitive transaction usage or unauthorized role changes?",
    opts: [
      {
        text: "Only discovered when an incident occurs or during external audit sampling",
        s: 0,
        flag: "No continuous monitoring for critical transaction usage anomalies",
      },
      {
        text: "Weekly or monthly manual log reviews of SM20 / Security Audit Logs",
        s: 1,
      },
      {
        text: "Real-time automated alerting on critical t-codes and sensitive parameter changes",
        s: 2,
      },
    ],
  },
  {
    id: 12,
    dim: "TEAM CAPACITY",
    q: "How does your team manage the balance between day-to-day access requests and strategic security projects?",
    opts: [
      {
        text: "Team is completely overwhelmed by routine tickets; strategic security is neglected",
        s: 0,
        flag: "Security team capacity consumed entirely by routine ticket toil",
      },
      {
        text: "Struggling to keep up with SLA; occasional project work during quiet periods",
        s: 1,
      },
      {
        text: "Routine requests are largely automated; team focuses on strategic security posture",
        s: 2,
      },
    ],
  },
];

export const RECOMMENDATION_TIERS = {
  option1: {
    id: "option1",
    name: "Option 1",
    tag: "Platform + Business as Usual",
    subtitle: "SecOps Platform, with ToggleNow running BaU",
    readinessLabel: "Manual & exposed",
    readinessCategory: "Full BaU Takeover",
    scoreRange: "0 – 8",
    description:
      "A complete turnkey engagement where ToggleNow deploys the SecOps platform and takes over full operational responsibility for your day-to-day SAP security and user administration.",
    whyFits:
      "Your answers indicate substantial manual overhead and operational exposure across your SAP landscape. Deploying the SecOps platform alongside ToggleNow's managed Business-as-Usual (BaU) operational team will instantly eliminate administrative backlogs, automate routine tasks, and ensure full compliance without burdening your internal team.",
    features: [
      "Full SecOps Platform deployment & configuration",
      "Dedicated ToggleNow managed operations team for day-to-day BaU",
      "24/7 SLA-backed ticket resolution & emergency access support",
      "Automated SoD prevention, joiner/mover/leaver, and UAR campaigns",
      "Continuous license optimization and audit-ready reporting",
    ],
    recommendedFor: "Organizations with high ticket volume, lean teams, or severe audit findings",
  },
  option2: {
    id: "option2",
    name: "Option 2",
    tag: "Platform + Advisory",
    subtitle: "SecOps Platform, with ToggleNow advisory on tap",
    readinessLabel: "Capable but stretched",
    readinessCategory: "Advisory on Tap",
    scoreRange: "9 – 16",
    description:
      "Deploy the SecOps platform to automate routine workflows while retaining ToggleNow's senior GRC and SAP security specialists for architectural guidance, rulebook tuning, and audit readiness.",
    whyFits:
      "Your team possesses solid SAP administration capabilities but is stretched thin across manual checkpoints, periodic reviews, and audit fire drills. SecOps platform automation handles the routine workload, while ToggleNow advisory on tap provides specialized GRC expertise, role redesign assistance, and quarterly audit posture reviews.",
    features: [
      "Full SecOps Platform deployment & workflow automation",
      "On-demand ToggleNow GRC & SAP Security advisory hours",
      "Accelerated role cleanup and SoD rulebook tuning",
      "Automated periodic recertification and self-service catalog",
      "Executive posture reviews and license true-up strategies",
    ],
    recommendedFor: "Teams with established SAP Basis staff seeking automation and expert backup",
  },
  option3: {
    id: "option3",
    name: "Option 3",
    tag: "Platform Only",
    subtitle: "SecOps Platform, run by your own team",
    readinessLabel: "Self-sufficient",
    readinessCategory: "Platform Only",
    scoreRange: "17 – 24",
    description:
      "Empower your existing in-house SAP security engineering team with the complete SecOps software suite to run and govern independently.",
    whyFits:
      "Your organization operates with high security maturity and well-defined governance policies. The SecOps platform provides the powerful, modern automation engine your internal team needs to eliminate remaining manual friction, streamline cross-system SAP workflows, and maintain continuous, effortless audit readiness.",
    features: [
      "SecOps Platform standalone deployment & enterprise connectors",
      "Self-service workflow designer, catalog, and ruleset engine",
      "Real-time preventive SoD simulation and session replay",
      "Automated license classification and usage analytics",
      "Standard platform support and quarterly feature updates",
    ],
    recommendedFor: "Mature enterprise security teams with dedicated SAP authorization engineers",
  },
};

export function getTierFromScore(score) {
  if (score <= 8) return RECOMMENDATION_TIERS.option1;
  if (score <= 16) return RECOMMENDATION_TIERS.option2;
  return RECOMMENDATION_TIERS.option3;
}

export const DEFAULT_ROI_TASKS = [
  {
    id: "pwd-resets",
    name: "Password resets",
    desc: "Self-service unlock & credentials renewal",
    via: "AGENT",
    ticketsPerMonth: 120,
    minManual: 10,
    minSecOps: 1,
  },
  {
    id: "validity-ext",
    name: "Validity extensions",
    desc: "Temporary access window expiration renewal",
    via: "AGENT",
    ticketsPerMonth: 40,
    minManual: 12,
    minSecOps: 1,
  },
  {
    id: "lock-unlock",
    name: "Lock / unlock requests",
    desc: "User status toggles and ad-hoc suspension",
    via: "AGENT",
    ticketsPerMonth: 60,
    minManual: 8,
    minSecOps: 1,
  },
  {
    id: "user-creation",
    name: "User creation / change requests",
    desc: "Joiner/mover/leaver provisioning & role assignments",
    via: "AGENT",
    ticketsPerMonth: 80,
    minManual: 25,
    minSecOps: 4,
  },
  {
    id: "su53-analysis",
    name: "SU53 authorization analysis",
    desc: "Failed check diagnostic and missing object analysis",
    via: "AGENT",
    ticketsPerMonth: 50,
    minManual: 30,
    minSecOps: 6,
  },
  {
    id: "report-gen",
    name: "Report generation",
    desc: "Compliance extract, active user & t-code usage reports",
    via: "AGENT",
    ticketsPerMonth: 30,
    minManual: 20,
    minSecOps: 2,
  },
  {
    id: "periodic-reviews",
    name: "Periodic reviews (UAR / SoD)",
    desc: "Manager recertification campaigns & attestation",
    via: "PLATFORM",
    ticketsPerMonth: 20,
    minManual: 45,
    minSecOps: 7,
  },
  {
    id: "sod-remediation",
    name: "SoD conflict remediation",
    desc: "Conflict simulation, mitigation control assignment",
    via: "PLATFORM",
    ticketsPerMonth: 25,
    minManual: 40,
    minSecOps: 10,
  },
  {
    id: "dormant-id",
    name: "Dormant / critical ID mgmt",
    desc: "Inactive account deactivation & privileged ID audits",
    via: "PLATFORM",
    ticketsPerMonth: 15,
    minManual: 30,
    minSecOps: 5,
  },
  {
    id: "ff-access",
    name: "Emergency (FF) access handling",
    desc: "Firefighter elevation, session capture, log review",
    via: "PLATFORM",
    ticketsPerMonth: 20,
    minManual: 25,
    minSecOps: 3,
  },
];

export const CURRENCIES = {
  USD: {
    code: "USD",
    symbol: "$",
    name: "US Dollar ($)",
    defaultCostPerFte: 85000,
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    name: "Euro (€)",
    defaultCostPerFte: 80000,
  },
  GBP: {
    code: "GBP",
    symbol: "£",
    name: "British Pound (£)",
    defaultCostPerFte: 70000,
  },
  INR: {
    code: "INR",
    symbol: "₹",
    name: "Indian Rupee (₹)",
    defaultCostPerFte: 1800000,
  },
};

export function formatCurrency(amount, currencyCode) {
  const curr = CURRENCIES[currencyCode] || CURRENCIES.USD;
  if (currencyCode === "INR") {
    // Indian numbering format (e.g. ₹14,40,938)
    return curr.symbol + Math.round(amount).toLocaleString("en-IN");
  }
  return curr.symbol + Math.round(amount).toLocaleString("en-US");
}

