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
        text: "Through a ticketing tool, but with manual steps in between",
        s: 1,
      },
      {
        text: "Fully automated workflow with role-based, rule-driven provisioning using SAP GRC/other GRC solutions",
        s: 2,
      },
    ],
  },
  {
    id: 2,
    dim: "CREDENTIALS",
    q: "How are password resets and account unlocks handled?",
    opts: [
      {
        text: "Manually by the security or Basis team on each request",
        s: 0,
        flag: "Manual password resets and account unlocks handled per request",
      },
      {
        text: "Self-service for some users, manual for the rest",
        s: 1,
      },
      {
        text: "End-to-end self-service · no manual intervention",
        s: 2,
      },
    ],
  },
  {
    id: 3,
    dim: "RESOLUTION SPEED",
    q: "On average, how long does it take to resolve an access-related issue? The typical SU53 journey.",
    opts: [
      {
        text: "Around 4 and 6 hours, often next business day",
        s: 0,
        flag: "Multi-hour, next-business-day access issue resolution",
      },
      {
        text: "Between 1 and 4 hours",
        s: 1,
      },
      {
        text: "Under an hour, against tracked SLAs",
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
        text: "Access granted on ad-hoc basis, with little or no logging",
        s: 0,
        flag: "Ad-hoc firefighter access granted with little or no logging",
      },
      {
        text: "Time-bound access, but logs are reviewed manually at a later stage",
        s: 1,
      },
      {
        text: "Controlled firefighter with automated log review and closure",
        s: 2,
      },
    ],
  },
  {
    id: 5,
    dim: "SEGREGATION OF DUTIES",
    q: "How do you check for Segregation of Duties conflicts before granting access?",
    opts: [
      {
        text: "We do only periodic off-line review or only when an audit forces. No simulations.",
        s: 0,
        flag: "Only periodic, reactive SoD review with no request-time simulation",
      },
      {
        text: "Periodic manual checks after the fact",
        s: 1,
      },
      {
        text: "Real-time preventive SoD simulation at request time using GRC tools",
        s: 2,
      },
    ],
  },
  {
    id: 6,
    dim: "RECERTIFICATION",
    q: "How are periodic user access reviews and recertifications run?",
    opts: [
      {
        text: "No process in place. We don't do it.",
        s: 0,
        flag: "No periodic user access review or recertification process",
      },
      {
        text: "Spreadsheets emailed to managers, consolidated by hand",
        s: 1,
      },
      {
        text: "Automated campaigns with dashboards, reminders and evidence capture",
        s: 2,
      },
    ],
  },
  {
    id: 7,
    dim: "TEAM CAPACITY",
    q: "Do you have a dedicated team with real bandwidth to run daily access operations?",
    opts: [
      {
        text: "No dedicated team. Only Basis handles security tasks too",
        s: 0,
        flag: "No dedicated access operations team — Basis absorbs security tasks",
      },
      {
        text: "A small team that fits it around other responsibilities",
        s: 1,
      },
      {
        text: "A dedicated, adequately staffed operations team",
        s: 2,
      },
    ],
  },
  {
    id: 8,
    dim: "EXPERTISE",
    q: "How would you rate your team's SAP security & GRC expertise?",
    opts: [
      {
        text: "Limited. We often utilize SIs for most critical activities",
        s: 0,
        flag: "Limited in-house SAP security & GRC expertise, reliant on SIs",
      },
      {
        text: "Competent on routine work, gaps on complex or new scenarios",
        s: 1,
      },
      {
        text: "Deep, current in-house expertise across the stack",
        s: 2,
      },
    ],
  },
  {
    id: 9,
    dim: "VOLUME",
    q: "How well do you keep up with the monthly volume of access changes?",
    opts: [
      {
        text: "High volume and frequent org change. We struggle to keep pace",
        s: 0,
        flag: "Struggling to keep pace with monthly access-change volume",
      },
      {
        text: "Moderate and mostly manageable",
        s: 1,
      },
      {
        text: "Comfortably within capacity",
        s: 2,
      },
    ],
  },
  {
    id: 10,
    dim: "AUDIT HISTORY",
    q: "Have you had audit or compliance findings related to access controls?",
    opts: [
      {
        text: "Yes, we have a few access controls gaps as recurring finding",
        s: 0,
        flag: "Recurring audit findings related to access controls",
      },
      {
        text: "Occasionally, and minor",
        s: 1,
      },
      {
        text: "Clean, access controls hold up under review",
        s: 2,
      },
    ],
  },
  {
    id: 11,
    dim: "OPERATING MODEL",
    q: "What operating model do you want for access governance going forward?",
    opts: [
      {
        text: "We want a partner to fully own and run it for us",
        s: 0,
        flag: "Prefers a partner to fully own and run access governance",
      },
      {
        text: "We want to run it ourselves, with expert guidance on tap",
        s: 1,
      },
      {
        text: "We want to own it fully, just give us the platform and training",
        s: 2,
      },
    ],
  },
  {
    id: 12,
    dim: "KEY-PERSON RISK",
    q: "What happens to access operations when a key person is unavailable?",
    opts: [
      {
        text: "Operations stall — it is a genuine single point of failure",
        s: 0,
        flag: "Access operations stall without a key person — single point of failure",
      },
      {
        text: "Some disruption, but it gets covered",
        s: 1,
      },
      {
        text: "Fully documented and cross-covered. No dependency",
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
    minSecOps: 4,
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
    minSecOps: 5,
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
    minSecOps: 2,
  },
  {
    id: "itgc-reporting",
    name: "ITGC/Access Governance Reporting",
    desc: "Generation of various reports needed",
    via: "PLATFORM",
    ticketsPerMonth: 10,
    minManual: 60,
    minSecOps: 5,
  },
  {
    id: "licensing-audit",
    name: "Licensing Audit/Optimization",
    desc: "Identify the licensing impact and optimization",
    via: "PLATFORM",
    ticketsPerMonth: 1,
    minManual: 1200,
    minSecOps: 10,
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

