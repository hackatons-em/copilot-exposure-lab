import { generateLargeTenant } from "@cel/graph-client";
import { describe, expect, it } from "vitest";
import { scan } from "./pipeline.js";
import { tenantExposureScore } from "./scoring/tenant-score.js";

/**
 * Enterprise-scale proof: the deterministic engine must run a full scan over a
 * realistic ~1k-user / ~5k-resource / ~6k-grant tenant quickly and stably.
 *
 * Threshold is intentionally generous (CI runners are slower and noisier than a
 * dev box, where this scan lands ≈220ms). The point is "comfortably sub-second
 * work, never minutes", not a micro-benchmark — see docs/spec/PERFORMANCE_BENCHMARK.md.
 */
const SCAN_BUDGET_MS = 5000;
const NOW = "2026-06-21T00:00:00.000Z";

describe("enterprise-scale scan", () => {
  const graph = generateLargeTenant({ seed: 1337 });

  it("generates a credible enterprise-sized tenant", () => {
    expect(graph.principals.length).toBeGreaterThan(1000);
    expect(graph.resources.length).toBeGreaterThan(4000);
    // Real tenants carry more ACL entries than objects — grants must outnumber resources.
    expect(graph.grants.length).toBeGreaterThan(graph.resources.length);
  });

  it("scans the full tenant within budget and surfaces a large finding pile", () => {
    const start = performance.now();
    const result = scan(graph, { now: NOW });
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(SCAN_BUDGET_MS);
    // At scale, manual triage is hopeless — hundreds of findings is the whole point.
    expect(result.findings.length).toBeGreaterThan(500);
    expect(result.findings.some((f) => f.risk.band === "critical")).toBe(true);

    const exposure = tenantExposureScore(result);
    expect(exposure.score).toBeGreaterThanOrEqual(90);
    expect(exposure.band).toBe("critical");
  });

  it("is fully deterministic — same seed → identical findings", () => {
    const a = scan(generateLargeTenant({ seed: 1337 }), { now: NOW });
    const b = scan(generateLargeTenant({ seed: 1337 }), { now: NOW });
    expect(b.findings.length).toBe(a.findings.length);
    expect(b.findings.map((f) => f.id)).toEqual(a.findings.map((f) => f.id));
    expect(b.findings.map((f) => f.risk.total)).toEqual(a.findings.map((f) => f.risk.total));
  });

  it("varies by seed — a different tenant yields a different shape", () => {
    const other = generateLargeTenant({ seed: 9001 });
    const base = generateLargeTenant({ seed: 1337 });
    expect(other.grants.length).not.toBe(base.grants.length);
  });
});
