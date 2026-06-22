/**
 * Single source of truth for the marketing pricing model. SaaS self-serve tiers
 * that ladder from a free one-time assessment up to enterprise, priced per
 * Microsoft 365 organization and banded by user count, billed annually.
 *
 * NUMBERS ARE INDICATIVE — edit here only; both the /pricing page and the landing
 * teaser read from this file. Final plans are set at GA.
 */

export const PRICING_NOTE = "Sample pricing. Final plans are set at launch.";

export type PricingTierId = "free" | "starter" | "growth" | "enterprise";

export interface PricingTier {
  id: PricingTierId;
  name: string;
  /** Display price, e.g. "$0", "$490", "Custom". */
  price: string;
  /** Sub-line under the price, e.g. "/ month · per tenant · billed annually". */
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
    unit: "one assessment · no card",
    tagline: "See your exposure once, with no commitment.",
    cta: { label: "Run a free assessment", href: "/overview" },
    features: [
      "One full exposure assessment",
      "Every finding, with the proof",
      "Your risk score and a map of who can reach what",
      "Read-only — never reads file contents",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    price: "$490",
    unit: "/ month · per tenant · up to 250 users · billed annually",
    tagline: "Always-on protection for a single SME or team.",
    cta: { label: "Start with Starter", href: "/overview" },
    features: [
      "Everything in Free, running continuously",
      "Re-tests on a schedule or when things change",
      "The exact Microsoft fix for each finding",
      "Remediation planner that proves the fix held",
      "Board-ready report",
      "Email support",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: "$1,490",
    unit: "/ month · per tenant · up to 2,500 users · billed annually",
    tagline: "For growing mid-market security teams.",
    cta: { label: "Start with Growth", href: "/overview" },
    highlight: true,
    features: [
      "Everything in Starter",
      "Threat-model mapping to MITRE, NIST, and CISA",
      "Identity least-privilege audit",
      "Copilot-agent governance",
      "Exports to Sentinel, Purview, and Jira",
      "Priority support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    unit: "annual contract",
    tagline: "Large organizations, security service providers, and regulated industries.",
    cta: { label: "Talk to us", href: "mailto:teamwork@loveiq.org?subject=Copilot%20Exposure%20Lab%20%E2%80%94%20Enterprise" },
    features: [
      "Everything in Growth",
      "Single sign-on, SCIM provisioning, and role-based access",
      "Manage many organizations from one console",
      "API access and audit export",
      "Run it inside your own cloud",
      "Guaranteed support response times and a dedicated contact",
    ],
  },
];

export interface ComparisonRow {
  label: string;
  values: Record<PricingTierId, boolean | string>;
}

export const COMPARISON: { group: string; rows: ComparisonRow[] }[] = [
  {
    group: "The exposure assessment",
    rows: [
      { label: "Full exposure assessment", values: { free: true, starter: true, growth: true, enterprise: true } },
      { label: "Findings with the supporting evidence", values: { free: true, starter: true, growth: true, enterprise: true } },
      { label: "Risk score and how you compare to peers", values: { free: true, starter: true, growth: true, enterprise: true } },
      { label: "Visual map of who can reach what", values: { free: true, starter: true, growth: true, enterprise: true } },
      { label: "What Copilot would surface (safe test)", values: { free: true, starter: true, growth: true, enterprise: true } },
    ],
  },
  {
    group: "Always-on monitoring and fixes",
    rows: [
      { label: "Re-tests on a schedule", values: { free: false, starter: true, growth: true, enterprise: true } },
      { label: "Re-tests when something changes", values: { free: false, starter: true, growth: true, enterprise: true } },
      { label: "Track the score and what changed", values: { free: false, starter: true, growth: true, enterprise: true } },
      { label: "The exact Microsoft fix for each finding", values: { free: false, starter: true, growth: true, enterprise: true } },
      { label: "Remediation planner that proves the fix held", values: { free: false, starter: true, growth: true, enterprise: true } },
      { label: "Board-ready reports", values: { free: false, starter: true, growth: true, enterprise: true } },
    ],
  },
  {
    group: "Governance and integrations",
    rows: [
      { label: "Threat model (MITRE, NIST, CISA)", values: { free: false, starter: false, growth: true, enterprise: true } },
      { label: "Identity least-privilege audit", values: { free: false, starter: false, growth: true, enterprise: true } },
      { label: "Copilot-agent governance", values: { free: false, starter: false, growth: true, enterprise: true } },
      { label: "Exports to Sentinel, Purview, and Jira", values: { free: false, starter: false, growth: true, enterprise: true } },
      { label: "Support", values: { free: false, starter: "Email", growth: "Priority", enterprise: "Dedicated" } },
    ],
  },
  {
    group: "Scale and administration",
    rows: [
      { label: "Users covered", values: { free: "1 assessment", starter: "250", growth: "2,500", enterprise: "Unlimited" } },
      { label: "Single sign-on and role-based access", values: { free: false, starter: false, growth: false, enterprise: true } },
      { label: "Manage many organizations from one console", values: { free: false, starter: false, growth: false, enterprise: true } },
      { label: "API access and audit export", values: { free: false, starter: false, growth: "Read only", enterprise: true } },
      { label: "Run it inside your own cloud", values: { free: false, starter: false, growth: false, enterprise: true } },
      { label: "Support response guarantee and dedicated contact", values: { free: false, starter: false, growth: false, enterprise: true } },
    ],
  },
];

export const PRICING_FAQ: { q: string; a: string }[] = [
  {
    q: "How is it priced?",
    a: "Per Microsoft 365 organization, by the number of users, billed annually. Start free, then Starter for a single SME or team, or Growth as you scale. Enterprise is custom for large organizations or anyone managing many organizations at once.",
  },
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
    q: "Can we run a one-time assessment instead of subscribing?",
    a: "Yes. The Free plan runs one complete exposure assessment with every finding and your risk score. Starter and Growth add always-on monitoring and fixes, so you can keep proving the fix held over time.",
  },
  {
    q: "Are you SOC 2 certified?",
    a: "Not yet, and we'd rather say so plainly. SOC 2 is an independent audit of how a company protects customer data. We are early-stage, and we built our data handling — read-only, minimum access, full audit trail, easy deletion — to make that audit straightforward. We'll pursue SOC 2 Type II as we take on production customers.",
  },
];
