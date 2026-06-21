import type { Band } from "@cel/types";

/** Severity bands from the risk scoring model. */
export function bandFor(total: number): Band {
  if (total >= 90) return "critical";
  if (total >= 70) return "high";
  if (total >= 40) return "medium";
  if (total >= 10) return "low";
  return "info";
}

/** Display label for a band (UI/report). */
export function bandLabel(band: Band): string {
  return band.charAt(0).toUpperCase() + band.slice(1);
}
