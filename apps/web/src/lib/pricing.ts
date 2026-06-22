/**
 * Single source of truth for the marketing pricing model. SaaS self-serve tiers.
 *
 * NUMBERS ARE INDICATIVE — edit here only; both the /pricing page and the landing
 * teaser read from this file. Final plans are set at GA.
 */

export const PRICING_NOTE = "Sample pricing. Final plans are set at launch.";

export interface PricingTier {
  id: "free" | "team" | "enterprise";
  name: string;
  /** Display price, e.g. "$0", "$1,500", "Custom". */
  price: string;
  /** Sub-line under the price, e.g. "/ month", "per tenant · billed annually". */
  unit?: string;
  tagline: string;
  cta: { label: string; href: string };
  /** The featured tier gets the brand emphasis treatment. */
  highlight?: boolean;
  /** Card bullet highlights (kept short; full detail is in the comparison table). */
  features: string[];
}

export const TIERS: PricingTier[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    unit: "one exposure test",
    tagline: "See your exposure once, with no commitment.",
    cta: { label: "Run a test", href: "/overview" },
    features: [
      "One full exposure test",
      "Every finding, with the proof",
      "Your risk score and a map of who can reach what",
      "Read-only — never reads file contents",
    ],
  },
  {
    id: "team",
    name: "Team",
    price: "$1,500",
    unit: "/ month · per organization · billed yearly",
    tagline: "Always-on monitoring that keeps proving the fix held.",
    cta: { label: "Start with Team", href: "/overview" },
    highlight: true,
    features: [
      "Everything in Free, running continuously",
      "Re-tests on a schedule or when things change",
      "The exact Microsoft fix for each finding",
      "Mapped to MITRE, NIST, and CISA security frameworks",
      "Exports to Sentinel, Purview, Jira, and spreadsheets",
      "Board-ready reports",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    unit: "yearly contract",
    tagline: "For large organizations, security service providers, and regulated industries.",
    cta: { label: "Talk to us", href: "mailto:teamwork@loveiq.org?subject=Copilot%20Exposure%20Lab%20%E2%80%94%20Enterprise" },
    features: [
      "Everything in Team",
      "Single sign-on, auto-provisioning, and role-based access",
      "Manage many organizations from one console",
      "API access and audit export",
      "Run it inside your own cloud",
      "Guaranteed support response times and a dedicated contact",
    ],
  },
];

export interface ComparisonRow {
  label: string;
  free: boolean | string;
  team: boolean | string;
  enterprise: boolean | string;
}

export const COMPARISON: { group: string; rows: ComparisonRow[] }[] = [
  {
    group: "The exposure test",
    rows: [
      { label: "Full exposure test", free: true, team: true, enterprise: true },
      { label: "Findings with the supporting evidence", free: true, team: true, enterprise: true },
      { label: "Risk score and how you compare to peers", free: true, team: true, enterprise: true },
      { label: "Visual map of who can reach what", free: true, team: true, enterprise: true },
      { label: "What Copilot would surface (safe test)", free: true, team: true, enterprise: true },
    ],
  },
  {
    group: "Ongoing monitoring and fixes",
    rows: [
      { label: "Re-tests on a schedule", free: false, team: true, enterprise: true },
      { label: "Re-tests when something changes", free: false, team: true, enterprise: true },
      { label: "Track the score and what changed", free: false, team: true, enterprise: true },
      { label: "The exact Microsoft fix for each finding", free: false, team: true, enterprise: true },
      { label: "Mapped to MITRE, NIST, and CISA frameworks", free: false, team: true, enterprise: true },
      { label: "Board-ready reports and exports", free: false, team: true, enterprise: true },
    ],
  },
  {
    group: "Scale and administration",
    rows: [
      { label: "Organizations covered", free: "1", team: "1", enterprise: "Unlimited" },
      { label: "Single sign-on and role-based access", free: false, team: false, enterprise: true },
      { label: "Manage many organizations from one console", free: false, team: false, enterprise: true },
      { label: "API access and audit export", free: false, team: "Read only", enterprise: true },
      { label: "Run it inside your own cloud", free: false, team: false, enterprise: true },
      { label: "Support response guarantee and dedicated contact", free: false, team: "Standard", enterprise: "Custom" },
    ],
  },
];

export const PRICING_FAQ: { q: string; a: string }[] = [
  {
    q: "Is it really read-only?",
    a: "Yes. We ask only for read-only access to Microsoft 365, and only to descriptive details — never to the contents of your files. We have no permission to change anything in your tenant. The fixes we write are for your team to review and run; we never run them for you.",
  },
  {
    q: "Do you store our documents?",
    a: "No. We read only descriptive details — sensitivity labels, who can open what, who is in which group, sharing links, and AI assistant settings. We never store the contents of documents, emails, or Teams messages, or any passwords.",
  },
  {
    q: "How is the risk level decided?",
    a: "By a clear 0–100 model using deterministic scoring (the same inputs always produce the same score — no guessing, fully auditable). AI may help write summaries, but it never decides risk or makes up facts, and you can check every part of every score.",
  },
  {
    q: "Can we run a one-time test instead of subscribing?",
    a: "Yes. The Free plan runs one complete exposure test. The Team plan adds always-on monitoring and fixes, so you can keep proving the fix held over time.",
  },
  {
    q: "Are you SOC 2 certified?",
    a: "Not yet, and we'd rather say so plainly. SOC 2 is an independent audit of how a company protects customer data. We are early-stage, and we built our data handling — read-only, minimum access, full audit trail, easy deletion — to make that audit straightforward. We'll pursue SOC 2 Type II as we take on production customers.",
  },
];
