import { loadSeedGraph } from "@cel/graph-client";
import { describe, expect, it } from "vitest";
import { simulateCopilotAnswer } from "./copilot-answer.js";

const graph = loadSeedGraph();

describe("simulateCopilotAnswer", () => {
  it("surfaces the exposed salary file when Bob asks about compensation", () => {
    const a = simulateCopilotAnswer(graph, { actorId: "u-bob", prompt: "summarize our 2026 compensation plan" });
    expect(a.exposed).toBe(true);
    expect(a.citations.some((c) => c.resourceId === "f-salary")).toBe(true);
    expect(a.answer).toContain("salary");
  });

  it("names the actor and is deterministic", () => {
    const p = { actorId: "u-bob", prompt: "acquisition strategy" };
    const a = simulateCopilotAnswer(graph, p);
    expect(a.actorName).toBe("Bob Novak");
    expect(simulateCopilotAnswer(graph, p)).toEqual(a);
  });

  it("reports nothing exposed when the actor cannot reach matching sensitive data", () => {
    // Dev Patel (external contractor) is scoped to Project Phoenix only.
    const a = simulateCopilotAnswer(graph, { actorId: "u-dev", prompt: "compensation salary payroll" });
    expect(a.citations.every((c) => c.resourceId !== "f-salary")).toBe(true);
  });
});
