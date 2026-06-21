import { loadSeedGraph } from "@cel/graph-client";
import { describe, expect, it } from "vitest";
import { scan } from "../pipeline.js";
import { tenantExposureScore } from "./tenant-score.js";

const graph = loadSeedGraph();
const result = scan(graph, { now: "2026-06-21T00:00:00.000Z" });

describe("tenantExposureScore", () => {
  it("scores the demo tenant critical (dominated by the org-wide salary link + volume)", () => {
    const t = tenantExposureScore(result);
    expect(t.score).toBeGreaterThanOrEqual(90);
    expect(t.band).toBe("critical");
    expect(t.findingCount).toBe(9);
    expect(t.drivers[0]).toBeTruthy();
  });

  it("drops when the critical finding is resolved (proof-of-fix moves the needle)", () => {
    const resolvedSalary = {
      findings: result.findings.map((f) => (f.resourceId === "f-salary" ? { ...f, status: "resolved" as const } : f)),
    };
    const after = tenantExposureScore(resolvedSalary);
    const before = tenantExposureScore(result);
    expect(after.score).toBeLessThan(before.score);
    expect(after.bands.critical).toBe(0);
  });

  it("returns 0 / info for a clean tenant", () => {
    expect(tenantExposureScore({ findings: [] })).toMatchObject({ score: 0, band: "info", findingCount: 0 });
  });
});
