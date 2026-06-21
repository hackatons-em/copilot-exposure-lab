import type { Band, Finding } from "@cel/types";
import { bandFor } from "./bands.js";

export interface TenantExposure {
  /** 0-100 tenant-level exposure score (deterministic aggregate of findings). */
  score: number;
  band: Band;
  /** Count of unresolved findings. */
  findingCount: number;
  /** Unresolved findings by band. */
  bands: Record<Band, number>;
  /** Titles of the top contributing findings. */
  drivers: string[];
}

const emptyBands = (): Record<Band, number> => ({ critical: 0, high: 0, medium: 0, low: 0, info: 0 });

/**
 * A single headline exposure number for a whole tenant — dominated by the worst
 * finding, lifted by the volume of critical/high/medium findings. Deterministic
 * (no LLM, no time). Resolved findings are excluded, so applying a fix and
 * re-scanning makes the score drop. Pins at 100 for a badly-exposed tenant.
 */
export function tenantExposureScore(scanResult: { findings: Finding[] }): TenantExposure {
  const active = scanResult.findings.filter((f) => f.status !== "resolved" && f.status !== "accepted-risk");
  const bands = emptyBands();
  for (const f of active) bands[f.risk.band] += 1;
  if (active.length === 0) return { score: 0, band: "info", findingCount: 0, bands, drivers: [] };

  const max = active.reduce((m, f) => Math.max(m, f.risk.total), 0);
  const raw = max + 2 * bands.critical + bands.high + 0.3 * bands.medium;
  const score = Math.max(0, Math.min(100, Math.round(raw)));
  const drivers = [...active]
    .sort((a, b) => b.risk.total - a.risk.total || (a.id < b.id ? -1 : 1))
    .slice(0, 3)
    .map((f) => f.title);

  return { score, band: bandFor(score), findingCount: active.length, bands, drivers };
}
