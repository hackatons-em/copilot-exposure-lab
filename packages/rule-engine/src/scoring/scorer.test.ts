import { describe, expect, it } from "vitest";
import type { ScoringInputs } from "../rules/types.js";
import { bandFor } from "./bands.js";
import { score } from "./scorer.js";
import { WEIGHTS } from "./weights.js";

const zero: ScoringInputs = {
  sensitivity: 0,
  exposureBreadth: 0,
  externalReach: 0,
  agentActionRisk: 0,
  governanceGap: 0,
  businessCriticality: 0,
  confidence: 0,
};

describe("weights", () => {
  it("sum to exactly 100", () => {
    expect(Object.values(WEIGHTS).reduce((a, b) => a + b, 0)).toBe(100);
  });
});

describe("bandFor — boundaries", () => {
  it.each([
    [100, "critical"],
    [90, "critical"],
    [89, "high"],
    [70, "high"],
    [69, "medium"],
    [40, "medium"],
    [39, "low"],
    [10, "low"],
    [9, "info"],
    [0, "info"],
  ])("%i -> %s", (total, expected) => {
    expect(bandFor(total)).toBe(expected);
  });
});

describe("score", () => {
  it("all-zero inputs score 0 / info", () => {
    const r = score(zero);
    expect(r.total).toBe(0);
    expect(r.band).toBe("info");
  });

  it("all-one inputs score exactly 100 / critical", () => {
    const ones: ScoringInputs = {
      sensitivity: 1,
      exposureBreadth: 1,
      externalReach: 1,
      agentActionRisk: 1,
      governanceGap: 1,
      businessCriticality: 1,
      confidence: 1,
    };
    const r = score(ones);
    expect(r.total).toBe(100);
    expect(r.band).toBe("critical");
  });

  it("clamps raw inputs into 0..1", () => {
    const r = score({ ...zero, sensitivity: 5, confidence: -3 });
    const sens = r.components.find((c) => c.key === "sensitivity")!;
    expect(sens.raw).toBe(1);
    expect(sens.points).toBe(WEIGHTS.sensitivity);
  });

  it("computes each component as round(weight * raw)", () => {
    const r = score({ ...zero, exposureBreadth: 0.5 });
    const breadth = r.components.find((c) => c.key === "exposureBreadth")!;
    expect(breadth.points).toBe(Math.round(WEIGHTS.exposureBreadth * 0.5));
  });

  it("is deterministic for identical inputs", () => {
    const inputs: ScoringInputs = { ...zero, sensitivity: 0.7, exposureBreadth: 0.6, confidence: 0.9 };
    expect(score(inputs)).toEqual(score(inputs));
  });
});
