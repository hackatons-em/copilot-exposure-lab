import { loadSeedGraph } from "@cel/graph-client";
import { describe, expect, it } from "vitest";
import { identityAudit } from "./least-privilege.js";

const graph = loadSeedGraph();

describe("identityAudit", () => {
  const audit = identityAudit(graph);

  it("returns ranked, internal, active identities with reachable sensitive resources", () => {
    expect(audit.length).toBeGreaterThan(0);
    for (const a of audit) {
      expect(a.reachableSensitive).toBeGreaterThan(0);
      expect(a.topSensitivity).toBeGreaterThan(0);
      expect(a.recommendations.length).toBeGreaterThan(0);
    }
    // Ranked descending by reachable sensitive count.
    for (let i = 1; i < audit.length; i += 1) {
      expect(audit[i - 1]!.reachableSensitive).toBeGreaterThanOrEqual(audit[i]!.reachableSensitive);
    }
  });

  it("flags Bob Novak reaching sensitive data, with a removal recommendation", () => {
    const bob = audit.find((a) => a.principalId === "u-bob");
    expect(bob).toBeDefined();
    expect(bob!.reachableSensitive).toBeGreaterThan(0);
    expect(bob!.recommendations[0]!.sensitiveCut).toBeGreaterThan(0);
  });

  it("recommends revoking whole-org access rather than 'removing from Everyone'", () => {
    const everyoneRecs = audit.flatMap((a) => a.recommendations).filter((r) => r.label === "whole-organization access");
    // The org-wide / inherited grants surface as link-type removals, never group-removal from Everyone.
    expect(everyoneRecs.every((r) => r.kind === "link")).toBe(true);
  });

  it("is deterministic", () => {
    const a = identityAudit(graph);
    const b = identityAudit(graph);
    expect(b.map((x) => x.principalId)).toEqual(a.map((x) => x.principalId));
    expect(b.map((x) => x.reachableSensitive)).toEqual(a.map((x) => x.reachableSensitive));
  });
});
