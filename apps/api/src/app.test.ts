import { DEFAULT_SCENARIOS, type GraphProvider } from "@cel/graph-client";
import type { PermissionGrant, Principal, Resource, TenantGraph } from "@cel/types";
import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "./app.js";
import { MemoryStore } from "./store/memory.js";

let app: FastifyInstance;
let wsId: string;

beforeAll(async () => {
  app = buildApp({ store: new MemoryStore() });
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe("workspace lifecycle + scan", () => {
  it("creates a workspace", async () => {
    const res = await app.inject({ method: "POST", url: "/api/workspaces", payload: { name: "Test Co" } });
    expect(res.statusCode).toBe(201);
    wsId = res.json().id as string;
    expect(wsId).toBeTruthy();
  });

  it("seeds the demo company", async () => {
    const res = await app.inject({ method: "POST", url: `/api/workspaces/${wsId}/connections/demo/seed` });
    expect(res.statusCode).toBe(201);
    expect(res.json().counts.resources).toBe(14);
  });

  it("runs a scan and returns the band distribution", async () => {
    const res = await app.inject({ method: "POST", url: `/api/workspaces/${wsId}/scans`, payload: {} });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.findingCount).toBe(9);
    expect(body.bands.critical).toBeGreaterThanOrEqual(1);
  });

  it("lists findings and filters by severity", async () => {
    const all = await app.inject({ method: "GET", url: `/api/workspaces/${wsId}/findings` });
    expect(all.json()).toHaveLength(9);
    const critical = await app.inject({ method: "GET", url: `/api/workspaces/${wsId}/findings?severity=critical` });
    expect(critical.json()).toHaveLength(1);
  });

  it("returns a finding with its evidence chain", async () => {
    const list = await app.inject({ method: "GET", url: `/api/workspaces/${wsId}/findings?severity=critical` });
    const fid = list.json()[0].id as string;
    const detail = await app.inject({ method: "GET", url: `/api/workspaces/${wsId}/findings/${fid}` });
    const body = detail.json();
    expect(body.evidence.length).toBeGreaterThan(0);
    expect(body.evidence.every((e: { sourceObjectId: string }) => Boolean(e.sourceObjectId))).toBe(true);
    expect(body.remediation).toBeTruthy();
  });

  it("applies a fix (proof-of-fix) and marks the finding resolved", async () => {
    const list = await app.inject({ method: "GET", url: `/api/workspaces/${wsId}/findings?severity=critical` });
    const fid = list.json()[0].id as string;
    const res = await app.inject({
      method: "PATCH",
      url: `/api/workspaces/${wsId}/findings/${fid}`,
      payload: { applyFix: true },
    });
    expect(res.json().status).toBe("resolved");
  });

  it("records audit events for writes", async () => {
    const res = await app.inject({ method: "GET", url: `/api/workspaces/${wsId}/audit-events` });
    const actions = res.json().map((e: { action: string }) => e.action);
    expect(actions).toEqual(expect.arrayContaining(["connection.demo.seed", "scan.run", "finding.update"]));
  });

  it("returns a scenario run", async () => {
    const res = await app.inject({ method: "GET", url: `/api/workspaces/${wsId}/scenarios/normal-employee/run` });
    expect(res.statusCode).toBe(200);
    expect(res.json().findingIds.length).toBeGreaterThan(0);
  });

  it("generates and downloads a markdown report", async () => {
    const created = await app.inject({
      method: "POST",
      url: `/api/workspaces/${wsId}/reports`,
      payload: { format: "markdown" },
    });
    expect(created.statusCode).toBe(201);
    const rid = created.json().id as string;
    const dl = await app.inject({ method: "GET", url: `/api/workspaces/${wsId}/reports/${rid}/download` });
    expect(dl.statusCode).toBe(200);
    expect(dl.headers["content-disposition"]).toContain("attachment");
    expect(dl.body).toContain("# Copilot Exposure Assessment Report");
  });

  it("downloads a deterministic security-tool export and rejects unknown formats", async () => {
    const csv = await app.inject({ method: "GET", url: `/api/workspaces/${wsId}/exports/csv` });
    expect(csv.statusCode).toBe(200);
    expect(csv.headers["content-disposition"]).toContain("attachment");
    expect(csv.body).toContain("f-salary");

    const list = await app.inject({ method: "GET", url: `/api/workspaces/${wsId}/exports` });
    expect(list.json()).toHaveLength(6);

    const bad = await app.inject({ method: "GET", url: `/api/workspaces/${wsId}/exports/pdf` });
    expect(bad.statusCode).toBe(400);
  });
});

// A network-free live-Graph provider returning a tiny org-wide-exposed graph.
const liveGraph: TenantGraph = {
  workspace: { id: "x", name: "x" },
  connection: { id: "c", workspaceId: "x", mode: "live-graph", tenantName: "contoso.onmicrosoft.com", scopes: ["User.Read.All"] },
  principals: [
    { id: "u-b", sourceId: "u-b", kind: "user", displayName: "Bob", memberOf: ["g-all"], active: true } as Principal,
    {
      id: "g-all",
      sourceId: "g-all",
      kind: "group",
      displayName: "Everyone Except External Users",
      membershipKind: "everyone-except-external",
      memberCount: 1,
      memberOf: [],
      active: true,
    } as Principal,
  ],
  resources: [
    {
      id: "f-pay",
      sourceId: "f-pay",
      kind: "file",
      name: "salary_plan.xlsx",
      sensitivityLabel: "Confidential",
      sensitivityTags: ["salary"],
      businessCriticality: "critical",
      agentActions: [],
      connectors: [],
    } as Resource,
  ],
  grants: [{ id: "p1", resourceId: "f-pay", principalId: "g-all", right: "read", via: "orgwide", linkScope: "org-wide" } as PermissionGrant],
  scenarios: DEFAULT_SCENARIOS,
};

class FakeGraphProvider implements GraphProvider {
  readonly mode = "live-graph" as const;
  async loadTenantGraph() {
    return liveGraph;
  }
  async listUsers() {
    return liveGraph.principals.filter((p) => p.kind === "user");
  }
  async listGroups() {
    return liveGraph.principals.filter((p) => p.kind === "group");
  }
  async listGroupMembers() {
    return [];
  }
  async listSites() {
    return [];
  }
  async listResources() {
    return liveGraph.resources;
  }
  async listPermissions() {
    return liveGraph.grants;
  }
  async listScenarios() {
    return liveGraph.scenarios;
  }
}

describe("live Microsoft Graph connection", () => {
  let liveApp: FastifyInstance;
  const wsLive = "ws-live";

  beforeAll(async () => {
    const store = new MemoryStore();
    await store.createWorkspace({ id: wsLive, name: "Contoso" });
    liveApp = buildApp({ store, graphProviderFactory: () => new FakeGraphProvider() });
    await liveApp.ready();
  });
  afterAll(async () => {
    await liveApp.close();
  });

  it("ingests a live tenant (metadata-only) and records a live-graph connection", async () => {
    const res = await liveApp.inject({
      method: "POST",
      url: `/api/workspaces/${wsLive}/connections/microsoft/start`,
      payload: { tenantId: "t", clientId: "c", clientSecret: "s", tenantName: "contoso.onmicrosoft.com" },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().connection.mode).toBe("live-graph");
    expect(res.json().counts.resources).toBe(1);
  });

  it("scans the live graph through the same pipeline", async () => {
    const res = await liveApp.inject({ method: "POST", url: `/api/workspaces/${wsLive}/scans`, payload: {} });
    expect(res.statusCode).toBe(201);
    expect(res.json().findingCount).toBeGreaterThanOrEqual(1);
    expect(res.json().bands.critical).toBeGreaterThanOrEqual(1);
  });

  it("never returns the client secret in the audit log", async () => {
    const res = await liveApp.inject({ method: "GET", url: `/api/workspaces/${wsLive}/audit-events` });
    expect(JSON.stringify(res.json())).not.toContain("\"s\"");
    expect(JSON.stringify(res.json())).not.toContain("clientSecret");
  });

  it("rejects a connect request missing credentials (400)", async () => {
    const res = await liveApp.inject({
      method: "POST",
      url: `/api/workspaces/${wsLive}/connections/microsoft/start`,
      payload: { tenantId: "t" },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("workspace isolation", () => {
  it("404s for an unknown workspace", async () => {
    const res = await app.inject({ method: "GET", url: "/api/workspaces/ws-nope/findings" });
    expect(res.statusCode).toBe(404);
  });

  it("validation error is 400", async () => {
    const res = await app.inject({ method: "POST", url: "/api/workspaces", payload: {} });
    expect(res.statusCode).toBe(400);
  });
});
