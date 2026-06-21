import type { Band, EstimatedEffort, FindingStatus, ScoreComponentKey } from "@cel/types";

/** Severity bands ordered most-severe-first — used for sorting + filter lists. */
export const BAND_ORDER: Band[] = ["critical", "high", "medium", "low", "info"];

const BAND_RANK: Record<Band, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

/** Numeric rank so findings can be sorted most-severe first. */
export function bandRank(band: Band): number {
  return BAND_RANK[band];
}

export const FINDING_STATUSES: FindingStatus[] = [
  "open",
  "acknowledged",
  "remediating",
  "resolved",
  "accepted-risk",
];

export function titleCase(value: string): string {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const SCORE_COMPONENT_LABELS: Record<ScoreComponentKey, string> = {
  sensitivity: "Sensitivity",
  exposureBreadth: "Exposure breadth",
  externalReach: "External reach",
  agentActionRisk: "Agent / action risk",
  governanceGap: "Governance gap",
  businessCriticality: "Business criticality",
  confidence: "Confidence",
};

export function scoreComponentLabel(key: ScoreComponentKey): string {
  return SCORE_COMPONENT_LABELS[key] ?? titleCase(key);
}

const EFFORT_LABELS: Record<EstimatedEffort, string> = {
  low: "Low effort",
  medium: "Medium effort",
  high: "High effort",
};

export function effortLabel(effort: EstimatedEffort): string {
  return EFFORT_LABELS[effort] ?? titleCase(effort);
}

export function formatDateTime(iso?: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(iso?: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}
