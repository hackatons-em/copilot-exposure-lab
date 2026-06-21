import { describe, expect, it } from "vitest";
import { SeedGraphClient, loadSeedGraph } from "./seed-graph-client.js";

describe("loadSeedGraph (Acme demo company)", () => {
  const graph = loadSeedGraph();

  it("validates the real seed against @cel/types", () => {
    expect(graph.workspace.name).toBe("Acme Health Finance Ltd");
    expect(graph.connection.mode).toBe("demo-seed");
  });

  it("has the expected cast: 9 users + 8 groups, 7 sites, 5 files, 1 agent", () => {
    const users = graph.principals.filter((p) => p.kind === "user");
    const groups = graph.principals.filter((p) => p.kind === "group");
    const sites = graph.resources.filter((r) => r.kind === "site");
    const files = graph.resources.filter((r) => r.kind === "file");
    const agents = graph.resources.filter((r) => r.kind === "agent");
    expect(users).toHaveLength(9);
    expect(groups).toHaveLength(8);
    expect(sites).toHaveLength(7);
    expect(files).toHaveLength(5);
    expect(agents).toHaveLength(1);
  });

  it("encodes issue 1: salary file reachable via an org-wide link to Everyone", () => {
    const g = graph.grants.find((x) => x.resourceId === "f-salary")!;
    expect(g.via).toBe("orgwide");
    expect(g.linkScope).toBe("org-wide");
    expect(g.principalId).toBe("g-everyone");
    const bob = graph.principals.find((p) => p.id === "u-bob")!;
    expect(bob.memberOf).toContain("g-everyone");
  });

  it("encodes issue 2: broad Sales group (42) granted on Customer Contracts", () => {
    const sales = graph.principals.find((p) => p.id === "g-sales")!;
    expect(sales.memberCount).toBe(42);
    expect(graph.grants.some((x) => x.resourceId === "s-contracts" && x.principalId === "g-sales")).toBe(true);
  });

  it("encodes issue 4: contractor guest grant with a past expiration", () => {
    const dev = graph.principals.find((p) => p.id === "u-dev")!;
    expect(dev.isExternal).toBe(true);
    const g = graph.grants.find((x) => x.principalId === "u-dev" && x.resourceId === "s-phoenix")!;
    expect(g.via).toBe("guest");
    expect(new Date(g.expirationAt!).getTime()).toBeLessThan(new Date("2026-06-01").getTime());
  });

  it("encodes issue 5: sensitive security doc has no sensitivity label", () => {
    const token = graph.resources.find((r) => r.id === "f-token")!;
    expect(token.sensitivityLabel).toBeNull();
    expect(token.sensitivityTags).toEqual(expect.arrayContaining(["token", "secret"]));
  });

  it("encodes issues 6 & 7: helpdesk agent can mail.send and is owned by a departed maker", () => {
    const agent = graph.resources.find((r) => r.id === "a-helpdesk")!;
    expect(agent.agentActions).toContain("mail.send");
    const owner = graph.principals.find((p) => p.id === agent.ownerPrincipalId)!;
    expect(owner.active).toBe(false);
  });

  it("is metadata-only: no resource exposes document content", () => {
    const forbidden = ["content", "body", "text", "bytes", "fileContent"];
    for (const r of graph.resources) {
      for (const key of forbidden) {
        expect(Object.prototype.hasOwnProperty.call(r, key)).toBe(false);
      }
    }
  });
});

describe("SeedGraphClient", () => {
  const client = new SeedGraphClient();

  it("reports demo-seed mode", () => {
    expect(client.mode).toBe("demo-seed");
  });

  it("resolves 'Everyone Except External Users' to 7 active internal members", async () => {
    const members = await client.listGroupMembers("g-everyone");
    expect(members).toHaveLength(7);
    expect(members.every((m) => m.isExternal !== true)).toBe(true);
    // The external contractor and the offboarded maker are not members.
    expect(members.some((m) => m.id === "u-dev")).toBe(false);
    expect(members.some((m) => m.id === "u-tomas")).toBe(false);
  });

  it("slices users, groups, sites, and scenarios", async () => {
    expect(await client.listUsers()).toHaveLength(9);
    expect(await client.listGroups()).toHaveLength(8);
    expect(await client.listSites()).toHaveLength(7);
    expect(await client.listScenarios()).toHaveLength(5);
  });
});
