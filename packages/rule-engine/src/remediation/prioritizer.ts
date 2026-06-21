import type {
  EstimatedEffort,
  Finding,
  RemediationPlan,
  RemediationSimulation,
  RemediationStep,
  ScanResult,
} from "@cel/types";
import { tenantExposureScore } from "../scoring/tenant-score.js";

/**
 * Remediation Planner — turns a pile of findings into a sequenced "fix these first"
 * roadmap, and answers "what's my score if I fix these?".
 *
 * KEY INSIGHT (why this is exact + fast, no re-scan): applying a fix in this engine
 * (`scan({ appliedFixes })`) only flips a finding's status to resolved — the finding
 * SET is derived from the (unchanged) tenant graph, so it never changes. The tenant
 * score excludes resolved findings, therefore the projected score for ANY chosen fix
 * set is computed exactly by re-scoring the existing findings with those marked
 * resolved. No repeated `scan()` → deterministic and sub-millisecond even at scale.
 */

const EFFORT_WEIGHT: Record<EstimatedEffort, number> = { low: 1, medium: 3, high: 8 };
const ACTIVE = (f: Finding): boolean => f.status !== "resolved" && f.status !== "accepted-risk";

/** Tenant exposure (score + band + count) with `excluded` finding ids treated as resolved. */
function exposureExcluding(findings: Finding[], excluded: Set<string>) {
  if (excluded.size === 0) return tenantExposureScore({ findings });
  const adjusted = findings.map((f) => (excluded.has(f.id) ? { ...f, status: "resolved" as const } : f));
  return tenantExposureScore({ findings: adjusted });
}

export interface RemediationPlanOptions {
  /** Max ordered steps to return (default 8). */
  maxSteps?: number;
  /** Evaluate only the top-N active findings by score (default 40) — bounds cost + keeps focus. */
  candidateCap?: number;
}

/**
 * Greedy marginal-gain plan: repeatedly pick the fix with the best score-drop per
 * unit of effort. Deterministic (stable tie-break: ratio, then raw gain, then id).
 */
export function buildRemediationPlan(scanResult: ScanResult, options: RemediationPlanOptions = {}): RemediationPlan {
  const { maxSteps = 8, candidateCap = 40 } = options;
  const findings = scanResult.findings;
  const effortOf = new Map<string, EstimatedEffort>();
  for (const t of scanResult.remediationTasks) effortOf.set(t.findingId, t.estimatedEffort);

  const active = findings
    .filter(ACTIVE)
    .sort((a, b) => b.risk.total - a.risk.total || (a.id < b.id ? -1 : 1));
  const baseline = tenantExposureScore({ findings }).score;
  const candidates = active.slice(0, candidateCap).map((f) => f.id);

  const applied = new Set<string>();
  const steps: RemediationStep[] = [];
  let current = baseline;

  while (steps.length < maxSteps) {
    let best:
      | { id: string; gain: number; after: number; effort: EstimatedEffort; ratio: number }
      | undefined;
    for (const id of candidates) {
      if (applied.has(id)) continue;
      const trial = new Set(applied);
      trial.add(id);
      const after = exposureExcluding(findings, trial).score;
      const gain = current - after;
      if (gain <= 0) continue;
      const effort = effortOf.get(id) ?? "medium";
      const ratio = gain / EFFORT_WEIGHT[effort];
      const better =
        !best ||
        ratio > best.ratio ||
        (ratio === best.ratio && (gain > best.gain || (gain === best.gain && id < best.id)));
      if (better) best = { id, gain, after, effort, ratio };
    }
    if (!best) break;
    applied.add(best.id);
    const f = findings.find((x) => x.id === best.id)!;
    steps.push({
      findingId: best.id,
      title: f.title,
      ruleId: f.ruleId,
      band: f.risk.band,
      estimatedEffort: best.effort,
      scoreBefore: current,
      scoreAfter: best.after,
      scoreDelta: best.gain,
      cumulativeDelta: baseline - best.after,
    });
    current = best.after;
  }

  return {
    baselineScore: baseline,
    projectedScore: current,
    totalDelta: baseline - current,
    steps,
    candidatesConsidered: candidates.length,
    capped: active.length > candidates.length,
  };
}

/** What-if: project the tenant score if `findingIds` were fixed. Deterministic. */
export function simulateRemediation(scanResult: ScanResult, findingIds: string[]): RemediationSimulation {
  const findings = scanResult.findings;
  const activeIds = new Set(findings.filter(ACTIVE).map((f) => f.id));
  const selected = new Set(findingIds.filter((id) => activeIds.has(id)));
  const before = tenantExposureScore({ findings });
  const after = exposureExcluding(findings, selected);
  return {
    baselineScore: before.score,
    projectedScore: after.score,
    baselineBand: before.band,
    projectedBand: after.band,
    scoreDelta: before.score - after.score,
    resolvedFindingIds: [...selected],
    remainingActive: after.findingCount,
  };
}
