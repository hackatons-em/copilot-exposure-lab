import { loadSeedGraph } from "@cel/graph-client";
import { describe, expect, it } from "vitest";
import { simulateRetrieval } from "./simulate.js";

const graph = loadSeedGraph();

describe("simulateRetrieval — what Copilot could surface to an actor", () => {
  it("surfaces the org-wide salary file to Bob, ranked at/near the top", () => {
    const result = simulateRetrieval(graph, { actorId: "u-bob" });
    expect(result.actorName).toBe("Bob Novak");

    const salaryIndex = result.items.findIndex((i) => i.resourceId === "f-salary");
    expect(salaryIndex).toBeGreaterThanOrEqual(0);
    const salary = result.items[salaryIndex]!;
    expect(salary.reachable).toBe(true);
    expect(salary.via.toLowerCase()).toContain("organization-wide");

    // f-salary is ranked at/near the top (highest-sensitivity reachable files lead).
    expect(salaryIndex).toBeLessThanOrEqual(1);
    expect(result.items.every((i) => i.reachable && i.sensitivity > 0)).toBe(true);
  });

  it("omits files an actor cannot reach (Bob has no path to the Sales-only contract)", () => {
    const result = simulateRetrieval(graph, { actorId: "u-bob" });
    expect(result.items.some((i) => i.resourceId === "f-msa")).toBe(false);
  });

  it("respects the limit", () => {
    const result = simulateRetrieval(graph, { actorId: "u-bob", limit: 1 });
    expect(result.items).toHaveLength(1);
    // Whichever the top reachable file is, it must be sensitive and reachable.
    expect(result.items[0]!.reachable).toBe(true);
    expect(result.items[0]!.sensitivity).toBeGreaterThan(0);
  });

  it("is deterministic (two calls produce identical results)", () => {
    expect(simulateRetrieval(graph, { actorId: "u-bob" })).toEqual(
      simulateRetrieval(graph, { actorId: "u-bob" }),
    );
  });
});
