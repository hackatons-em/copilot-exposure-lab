import { describe, expect, it } from "vitest";
import { parseTenantGraph } from "./entities.js";

const minimal = {
  workspace: { id: "ws1", name: "Test Co" },
  connection: { id: "c1", workspaceId: "ws1", mode: "demo-seed", tenantName: "Acme" },
  principals: [],
  resources: [],
  grants: [],
  scenarios: [],
};

describe("tenantGraphSchema / parseTenantGraph", () => {
  it("parses a minimal valid graph", () => {
    const g = parseTenantGraph(minimal);
    expect(g.workspace.id).toBe("ws1");
    expect(g.connection.mode).toBe("demo-seed");
  });

  it("applies defaults for principal memberOf and active", () => {
    const g = parseTenantGraph({
      ...minimal,
      principals: [{ id: "p1", sourceId: "s1", kind: "user", displayName: "Alice" }],
    });
    const alice = g.principals[0]!;
    expect(alice.memberOf).toEqual([]);
    expect(alice.active).toBe(true);
  });

  it("applies defaults for resource arrays", () => {
    const g = parseTenantGraph({
      ...minimal,
      resources: [{ id: "r1", sourceId: "s1", kind: "file", name: "x.docx" }],
    });
    const r = g.resources[0]!;
    expect(r.sensitivityTags).toEqual([]);
    expect(r.agentActions).toEqual([]);
  });

  it("rejects an unknown principal kind", () => {
    expect(() =>
      parseTenantGraph({
        ...minimal,
        principals: [{ id: "p1", sourceId: "s1", kind: "robot", displayName: "Bad" }],
      }),
    ).toThrow();
  });

  it("rejects a grant with an unknown via", () => {
    expect(() =>
      parseTenantGraph({
        ...minimal,
        grants: [{ id: "g1", resourceId: "r1", principalId: "p1", right: "read", via: "telepathy" }],
      }),
    ).toThrow();
  });
});
