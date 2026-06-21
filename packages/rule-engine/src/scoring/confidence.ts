import type { Finding } from "@cel/types";

export interface ConfidenceBand {
  /** Qualitative band derived from the finding's confidence score component. */
  level: "high" | "medium" | "low";
  /** 0..1 raw confidence (the scorer's confidence component input). */
  raw: number;
  /** Short human label, e.g. "High confidence". */
  label: string;
}

/**
 * Surface the deterministic `confidence` score component as a qualitative band.
 * Pure presentation — it reads the component the scorer already computed and never
 * changes severity. Findings without a confidence component default to medium.
 */
export function confidenceBand(finding: Finding): ConfidenceBand {
  const raw = finding.risk.components.find((c) => c.key === "confidence")?.raw ?? 0.6;
  const level = raw >= 0.8 ? "high" : raw >= 0.5 ? "medium" : "low";
  const label = `${level.charAt(0).toUpperCase()}${level.slice(1)} confidence`;
  return { level, raw, label };
}
