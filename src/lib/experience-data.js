// PRODUCTS, CAPABILITIES, and STORIES now come from the CMS API (see src/lib/api.js)
// and are fetched via react-query in the routes that need them.

export const INDUSTRIES = [
  "Manufacturing",
  "Retail",
  "Pharma",
  "Banking",
  "Energy",
  "Utilities",
  "Public Sector",
];

export const AI_SUGGESTIONS = [
  { q: "What is the typical ROI timeline?", topic: "Business Value" },
  { q: "How does this fit our compliance and audit cycle?", topic: "Compliance" },
  { q: "What does implementation require from our team?", topic: "Implementation" },
  { q: "How is licensing priced?", topic: "Commercial" },
  { q: "Does SecOps support SAP ECC?", topic: "Compatibility" },
  { q: "Does SecOps support S/4HANA?", topic: "Compatibility" },
  { q: "Is there a cloud deployment option?", topic: "Deployment" },
  { q: "What does the architecture look like?", topic: "Architecture" },
  { q: "How do you handle migration from SAP GRC?", topic: "Migration" },
];

export const AI_ANSWERS = {
  "What is the typical ROI timeline?":
    "Most enterprises achieve full payback in 4 to 6 months. Savings are driven by immediate SAP license optimization (typically 15-30% spend reduction), 50%+ reduction in IT helpdesk ticket volume, and eliminating audit-prep manual fire drills.",
  "How does this fit our compliance and audit cycle?":
    "SecOps is built for continuous compliance. It replaces manual periodic fire drills with real-time Segregation of Duties (SoD) checking and auto-generates audit evidence on demand. It turns compliance into a frictionless background process.",
  "What does implementation require from our team?":
    "Very little. SecOps connects via secure, standard SAP RFCs without any ABAP custom code. It requires about 2-3 hours of an SAP Basis administrator's time for configuration, and a security analyst to review the out-of-the-box rulesets.",
  "Does SecOps support SAP ECC?":
    "Yes — SecOps supports SAP ECC 6.0 EhP7 and above via a certified RFC connector. Existing PFCG roles, user master data, and SUIM extracts continue to work without change.",
  "Does SecOps support S/4HANA?":
    "Yes. SecOps is certified for S/4HANA on-premise and RISE/GROW deployments, including Fiori catalog-based authorization and business role composition.",
  "Is there a cloud deployment option?":
    "SecOps runs on-premise, on your private cloud (AWS, Azure, GCP), or fully managed by ToggleNow. All deployment modes share the same feature set.",
  "How is licensing priced?":
    "Licensing is per named SAP user, tiered by module. Typical enterprises see 3–5x ROI in year one through license optimization alone.",
  "What does the architecture look like?":
    "A stateless application tier (Java + React) communicates with SAP via secure RFC. Data is stored in your database of choice (HANA, Postgres, Oracle). Zero footprint inside SAP.",
  "How do you handle migration from SAP GRC?":
    "We provide a GRC accelerator that imports rulesets, mitigating controls, and role definitions, cutting migration effort by 60%.",
};

export const ACHIEVEMENTS = {
  firstVideo: "First video watched",
  firstStory: "First customer story explored",
  firstAi: "First question asked",
  workshopReady: "Workshop ready",
};
