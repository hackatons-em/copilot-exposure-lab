import { loadSeedGraph } from "@cel/graph-client";
import { describe, expect, it } from "vitest";
import { scan } from "../pipeline.js";
import { tenantExposureScore } from "../scoring/tenant-score.js";
import { buildRemediationPlan, simulateRemediation } from "./prioritizer.js";

const graph = loadSeedGraph();
const result = scan(graph, { now: "2026-06-21T00:00:00.000Z" });
const salaryId = result.findings.find((f) => f.resourceId === "f-salary")!.id;

describe("buildRemediationPlan", () => {
  const plan = buildRemediationPlan(result);

  it("starts from the current tenant score and projects a lower one", () => {
    expect(plan.baselineScore).toBe(tenantExposureScore(result).score);
    expect(plan.projectedScore).toBeLessThan(plan.baselineScore);
    expect(plan.totalDelta).toBe(plan.baselineScore - plan.projectedScore);
    expect(plan.steps.length).toBeGreaterThan(0);
  });

  it("ranks the org-wide salary link first (biggest score-drop per effort)", () => {
    expect(plan.steps[0]!.findingId).toBe(salaryId);
    expect(plan.steps[0]!.scoreDelta).toBeGreaterThan(0);
  });

  it("produces a monotonic, consistent cumulative trail", () => {
    let prevAfter = plan.baselineScore;
    let cumulative = 0;
    for (const step of plan.steps) {
      expect(step.scoreBefore).toBe(prevAfter);
      expect(step.scoreAfter).toBeLessThanOrEqual(step.scoreBefore);
      cumulative += step.scoreDelta;
      expect(step.cumulativeDelta).toBe(cumulative);
      prevAfter = step.scoreAfter;
    }
    expect(plan.projectedScore).toBe(prevAfter);
  });

  it("is deterministic", () => {
    const a = buildRemediationPlan(result);
    const b = buildRemediationPlan(result);
    expect(b.steps.map((s) => s.findingId)).toEqual(a.steps.map((s) => s.findingId));
    expect(b.steps.map((s) => s.scoreDelta)).toEqual(a.steps.map((s) => s.scoreDelta));
  });
});

describe("simulateRemediation", () => {
  it("projects a lower score + clears the critical band when the salary link is fixed", () => {
    const sim = simulateRemediation(result, [salaryId]);
    expect(sim.baselineScore).toBeGreaterThanOrEqual(90);
    expect(sim.baselineBand).toBe("critical");
    expect(sim.projectedScore).toBeLessThan(sim.baselineScore);
    expect(sim.scoreDelta).toBeGreaterThan(0);
    expect(sim.resolvedFindingIds).toEqual([salaryId]);
  });

  it("ignores unknown / already-resolved ids", () => {
    const sim = simulateRemediation(result, ["does-not-exist"]);
    expect(sim.resolvedFindingIds).toEqual([]);
    expect(sim.scoreDelta).toBe(0);
    expect(sim.projectedScore).toBe(sim.baselineScore);
  });

  it("fixing everything drops the score to 0 / info", () => {
    const allIds = result.findings.map((f) => f.id);
    const sim = simulateRemediation(result, allIds);
    expect(sim.projectedScore).toBe(0);
    expect(sim.projectedBand).toBe("info");
    expect(sim.remainingActive).toBe(0);
  });
});
