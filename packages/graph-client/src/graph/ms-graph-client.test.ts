import { describe, expect, it } from "vitest";
import { MsGraphClient, type Checkpoint } from "./ms-graph-client.js";
import type { GraphPage, GraphRequester } from "./requester.js";

/** A scripted, network-free Graph requester for testing normalization + paging. */
function fakeRequester(): GraphRequester {
  return {
    async get<T>(url: string): Promise<GraphPage<T>> {
      const page = (value: unknown[], nextLink?: string): GraphPage<T> => ({ value: value as T[], nextLink });
      if (url.includes("/permissions")) {
        return page([{ id: "perm1", roles: ["read"], link: { scope: "organization", type: "view" } }]);
      }
      if (url.includes("/root/children")) {
        return page([{ id: "item1", name: "2026_salary_plan.xlsx", file: {}, webUrl: "https://x" }]);
      }
      if (url.includes("/drives")) return page([{ id: "drive1" }]);
      if (url.includes("/members")) return page([{ id: "user1" }]);
      if (url.includes("users-page2")) return page([{ id: "user2", displayName: "Bob", accountEnabled: true }]);
      if (url.includes("/users")) {
        return page([{ id: "user1", displayName: "Alice", accountEnabled: true }], "https://graph/users-page2");
      }
      if (url.includes("/groups")) return page([{ id: "group1", displayName: "Everyone", groupTypes: ["Unified"] }]);
      if (url.includes("/sites")) return page([{ id: "site1", displayName: "HR Portal", webUrl: "https://s" }]);
      return page([]);
    },
  };
}

const client = new MsGraphClient(fakeRequester(), {
  workspace: { id: "ws-live", name: "Contoso" },
  tenantName: "contoso.onmicrosoft.com",
});

describe("MsGraphClient", () => {
  it("pages through users via @odata.nextLink", async () => {
    const users = await client.listUsers();
    expect(users.map((u) => u.id)).toEqual(["user1", "user2"]);
  });

  it("normalizes groups with a membership kind", async () => {
    const groups = await client.listGroups();
    expect(groups[0]!.kind).toBe("group");
    expect(groups[0]!.membershipKind).toBe("m365");
  });

  it("maps an org-wide sharing link to an orgwide grant", async () => {
    const grants = await client.listPermissions();
    expect(grants[0]!.via).toBe("orgwide");
    expect(grants[0]!.linkScope).toBe("org-wide");
  });

  it("loads a valid TenantGraph with memberships, resources, and checkpoints", async () => {
    const checkpoints: Checkpoint[] = [];
    const c = new MsGraphClient(fakeRequester(), {
      workspace: { id: "ws-live", name: "Contoso" },
      tenantName: "contoso.onmicrosoft.com",
      onCheckpoint: (cp) => checkpoints.push(cp),
    });
    const graph = await c.loadTenantGraph();
    expect(graph.connection.mode).toBe("live-graph");
    expect(graph.principals.some((p) => p.kind === "group")).toBe(true);
    // user1 is a member of group1 (resolved via membership pass)
    expect(graph.principals.find((p) => p.id === "user1")!.memberOf).toContain("group1");
    expect(graph.resources.some((r) => r.kind === "file" && r.name.includes("salary"))).toBe(true);
    expect(graph.scenarios).toHaveLength(5);
    expect(checkpoints.map((c2) => c2.phase)).toEqual(["users", "groups", "memberships", "resources", "permissions"]);
  });
});
