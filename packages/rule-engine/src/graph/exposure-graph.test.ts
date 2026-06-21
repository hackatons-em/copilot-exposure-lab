import { loadSeedGraph } from "@cel/graph-client";
import { describe, expect, it } from "vitest";
import { scan } from "../pipeline.js";
import { buildExposureGraphModel } from "./exposure-graph.js";

const graph = loadSeedGraph();
const result = scan(graph, { now: "2026-06-21T00:00:00.000Z" });
const model = buildExposureGraphModel(result);

describe("buildExposureGraphModel", () => {
  it("includes the hero path nodes (Bob, Everyone, org-wide link, salary file)", () => {
    const ids = model.nodes.map((n) => n.id);
    expect(ids).toContain("u-bob");
    expect(ids).toContain("g-everyone");
    expect(ids).toContain("f-salary");
    expect(model.nodes.some((n) => n.type === "link")).toBe(true);
  });

  it("marks the salary node critical and connects an edge into it", () => {
    const salary = model.nodes.find((n) => n.id === "f-salary")!;
    expect(salary.risk).toBe("critical");
    expect(model.edges.some((e) => e.target === "f-salary")).toBe(true);
  });

  it("merges shared hub nodes across findings (Everyone group reached by multiple paths)", () => {
    const everyone = model.nodes.find((n) => n.id === "g-everyone")!;
    expect(everyone.findingIds.length).toBeGreaterThanOrEqual(1);
  });

  it("is deterministic", () => {
    expect(buildExposureGraphModel(result)).toEqual(model);
  });
});
