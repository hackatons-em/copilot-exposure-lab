import { loadSeedGraph } from "@cel/graph-client";
import { describe, expect, it } from "vitest";
import { scan } from "../pipeline.js";
import { buildAgentInventory } from "./inventory.js";

const graph = loadSeedGraph();
const result = scan(graph, { now: "2026-06-21T00:00:00.000Z" });

describe("buildAgentInventory", () => {
  const agents = buildAgentInventory(graph, result);

  it("lists every agent resource", () => {
    const agentResourceCount = graph.resources.filter((r) => r.kind === "agent").length;
    expect(agents).toHaveLength(agentResourceCount);
    expect(agents.length).toBeGreaterThan(0);
  });

  it("flags the helpdesk agent: departed owner + egress + findings", () => {
    const helpdesk = agents.find((a) => a.id === "a-helpdesk")!;
    expect(helpdesk.ownerActive).toBe(false); // u-tomas is disabled
    expect(helpdesk.hasEgress).toBe(true); // mail.send
    expect(helpdesk.findingCount).toBeGreaterThan(0);
    expect(["critical", "high", "medium"]).toContain(helpdesk.riskBand);
  });

  it("ranks riskier agents first", () => {
    const order = ["critical", "high", "medium", "low", "info"];
    for (let i = 1; i < agents.length; i += 1) {
      expect(order.indexOf(agents[i - 1]!.riskBand)).toBeLessThanOrEqual(order.indexOf(agents[i]!.riskBand));
    }
  });

  it("is deterministic", () => {
    const a = buildAgentInventory(graph, result);
    expect(a.map((x) => x.id)).toEqual(agents.map((x) => x.id));
  });
});
