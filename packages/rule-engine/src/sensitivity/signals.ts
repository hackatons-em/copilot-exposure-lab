/**
 * Sensitivity keyword table. Deterministic, transparent, auditable — these
 * weights (0..1) are the only thing that decides how sensitive a resource is.
 * Drawn from docs/spec/02_PRODUCT/07_RISK_SCORING_MODEL.md sensitivity signals.
 *
 * Matching is case-insensitive against the resource name, path, label, and
 * classification tags.
 */
export interface SensitivityKeyword {
  /** Lowercase token to match as a whole word / tag. */
  term: string;
  weight: number;
}

export const SENSITIVITY_KEYWORDS: readonly SensitivityKeyword[] = [
  // Highest — direct exposure of regulated / crown-jewel data.
  { term: "salary", weight: 0.95 },
  { term: "payroll", weight: 0.95 },
  { term: "compensation", weight: 0.9 },
  { term: "password", weight: 0.95 },
  { term: "secret", weight: 0.9 },
  { term: "token", weight: 0.85 },
  { term: "acquisition", weight: 0.9 },
  { term: "board", weight: 0.85 },
  // High — confidential business data.
  { term: "contract", weight: 0.7 },
  { term: "customer", weight: 0.65 },
  { term: "confidential", weight: 0.7 },
  { term: "legal", weight: 0.6 },
  { term: "executive", weight: 0.6 },
  { term: "security", weight: 0.6 },
  { term: "incident", weight: 0.55 },
  { term: "financial", weight: 0.6 },
  // Moderate — departmental context.
  { term: "hr", weight: 0.4 },
  { term: "finance", weight: 0.4 },
  { term: "launch", weight: 0.35 },
  { term: "project", weight: 0.25 },
];

/** Sensitivity labels that themselves indicate elevated sensitivity. */
export const SENSITIVE_LABELS: readonly { match: string; weight: number }[] = [
  { match: "highly confidential", weight: 0.9 },
  { match: "confidential", weight: 0.6 },
  { match: "restricted", weight: 0.7 },
  { match: "secret", weight: 0.9 },
];
