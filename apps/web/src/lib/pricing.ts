/**
 * Single source of truth for the marketing pricing model. SaaS self-serve tiers.
 *
 * NUMBERS ARE INDICATIVE — edit here only; both the /pricing page and the landing
 * teaser read from this file. Final plans are set at GA.
 */

export const PRICING_NOTE = "Indicative pricing — final plans are set at general availability.";

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
    unit: "one exposure scan",
    tagline: "See your exposure once — no commitment.",
    cta: { label: "Run a scan", href: "/overview" },
    features: [
      "One deterministic exposure scan",
      "Full findings + evidence chains",
      "Tenant exposure score + attack graph",
      "Read-only, metadata-only",
    ],
  },
  {
    id: "team",
    name: "Team",
    price: "$1,500",
    unit: "/ month · per tenant · billed annually",
    tagline: "Continuous monitoring that proves the fix.",
    cta: { label: "Start with Team", href: "/overview" },
    highlight: true,
    features: [
      "Everything in Free, always-on",
      "Scheduled + change-driven re-scans",
      "Exact Microsoft fix scripts",
      "Threat model (MITRE / NIST / CISA)",
      "Sentinel · Purview · Jira · CSV exports",
      "Board-grade reports",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    unit: "annual contract",
    tagline: "For large estates, MSSPs, and regulated orgs.",
    cta: { label: "Talk to us", href: "mailto:teamwork@loveiq.org?subject=Copilot%20Exposure%20Lab%20%E2%80%94%20Enterprise" },
    features: [
      "Everything in Team",
      "SSO / SCIM + role-based access",
      "Multi-tenant & MSSP console",
      "API access + audit export",
      "Deploy in your own cloud",
      "SLA + dedicated support",
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
    group: "Assessment",
    rows: [
      { label: "Deterministic exposure scan", free: true, team: true, enterprise: true },
      { label: "Findings + evidence chains", free: true, team: true, enterprise: true },
      { label: "Tenant exposure score + peer percentile", free: true, team: true, enterprise: true },
      { label: "Visual attack / exposure graph", free: true, team: true, enterprise: true },
      { label: "What Copilot would surface (simulation)", free: true, team: true, enterprise: true },
    ],
  },
  {
    group: "Continuous & remediation",
    rows: [
      { label: "Scheduled re-scans", free: false, team: true, enterprise: true },
      { label: "Change-notification re-scans", free: false, team: true, enterprise: true },
      { label: "Exposure trend + drift", free: false, team: true, enterprise: true },
      { label: "Exact Microsoft fix scripts", free: false, team: true, enterprise: true },
      { label: "Threat model (MITRE / NIST / CISA)", free: false, team: true, enterprise: true },
      { label: "Board-grade reports + exports", free: false, team: true, enterprise: true },
    ],
  },
  {
    group: "Scale & governance",
    rows: [
      { label: "Tenants", free: "1", team: "1", enterprise: "Unlimited" },
      { label: "SSO / SCIM + RBAC", free: false, team: false, enterprise: true },
      { label: "Multi-tenant / MSSP console", free: false, team: false, enterprise: true },
      { label: "API access + audit export", free: false, team: "Read", enterprise: true },
      { label: "Deploy in your own cloud", free: false, team: false, enterprise: true },
      { label: "SLA + dedicated support", free: false, team: "Standard", enterprise: "Custom" },
    ],
  },
];

export const PRICING_FAQ: { q: string; a: string }[] = [
  {
    q: "Is it really read-only?",
    a: "Yes. The connector requests read-only, metadata-only Microsoft Graph scopes. There are no write scopes — the product cannot modify your tenant. Fix scripts are generated for you to review and run; they're never executed automatically.",
  },
  {
    q: "Do you store our documents?",
    a: "No. We process metadata only — labels, permissions, group membership, sharing links, agent configuration. Document contents, email bodies, Teams messages, and credentials are never stored.",
  },
  {
    q: "How is severity decided?",
    a: "By a transparent, deterministic 0–100 model — same input, same score, every time. LLMs may summarize, but never decide severity or invent facts. You can audit every component of every score.",
  },
  {
    q: "Can we run a one-off assessment instead of subscribing?",
    a: "Yes — the Free tier runs a complete one-time exposure scan. Team adds continuous monitoring and remediation so you can prove the fix over time.",
  },
  {
    q: "Are you SOC 2 certified?",
    a: "Not yet — we're early-stage and we say so plainly. The data handling (metadata-only, least privilege, audit, deletion) is designed to make that path straightforward, and we'll pursue SOC 2 Type II as we take on production customers.",
  },
];
