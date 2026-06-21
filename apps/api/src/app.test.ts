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

  it("returns a tenant exposure score", async () => {
    const res = await app.inject({ method: "GET", url: `/api/workspaces/${wsId}/exposure` });
    expect(res.statusCode).toBe(200);
    expect(res.json().score).toBeGreaterThanOrEqual(90);
    expect(res.json().band).toBe("critical");
    expect(res.json().findingCount).toBe(9);
  });

  it("simulates what Copilot would surface for a prompt", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/workspaces/${wsId}/copilot-sim`,
      payload: { prompt: "summarize our compensation plan" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().exposed).toBe(true);
    expect(res.json().citations.some((c: { resourceId: string }) => c.resourceId === "f-salary")).toBe(true);
  });

  it("returns the visual exposure graph", async () => {
    const res = await app.inject({ method: "GET", url: `/api/workspaces/${wsId}/graph` });
    expect(res.statusCode).toBe(200);
    const ids = res.json().nodes.map((n: { id: string }) => n.id);
    expect(ids).toContain("f-salary");
    expect(res.json().edges.some((e: { target: string }) => e.target === "f-salary")).toBe(true);
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

  it("explains why a finding's resource scored sensitive", async () => {
    const list = await app.inject({ method: "GET", url: `/api/workspaces/${wsId}/findings?severity=critical` });
    const fid = list.json()[0].id as string;
    const detail = await app.inject({ method: "GET", url: `/api/workspaces/${wsId}/findings/${fid}` });
    const body = detail.json();
    expect(body.sensitivity).toBeTruthy();
    expect(body.sensitivity.rawScore).toBeGreaterThan(0);
    expect(body.finding.threat.techniques.length).toBeGreaterThan(0);
  });

  it("generates an advisory fix script wired to the finding", async () => {
    const list = await app.inject({ method: "GET", url: `/api/workspaces/${wsId}/findings?severity=critical` });
    const fid = list.json()[0].id as string;
    const res = await app.inject({ method: "GET", url: `/api/workspaces/${wsId}/findings/${fid}/fix-script` });
    expect(res.statusCode).toBe(200);
    expect(res.json().language).toBe("powershell");
    expect(res.json().script).toContain("Remove-MgDriveItemPermission");
    expect(res.json().caveats.join(" ")).toMatch(/review/i);
  });

  it("returns the threat-model matrix", async () => {
    const res = await app.inject({ method: "GET", url: `/api/workspaces/${wsId}/threat-model` });
    expect(res.statusCode).toBe(200);
    expect(res.json().rows.length).toBeGreaterThan(0);
    expect(res.json().techniques.some((t: { id: string }) => t.id === "T1213.002")).toBe(true);
  });

  it("paginates findings and reports the total count", async () => {
    const res = await app.inject({ method: "GET", url: `/api/workspaces/${wsId}/findings?limit=2&offset=0` });
    expect(res.json()).toHaveLength(2);
    expect(res.headers["x-total-count"]).toBe("9");
  });

  it("serves an OpenAPI spec and a Swagger UI page", async () => {
    const spec = await app.inject({ method: "GET", url: "/openapi.json" });
    expect(spec.statusCode).toBe(200);
    expect(spec.json().openapi).toBe("3.0.3");
    expect(spec.json().paths["/api/workspaces/{id}/findings"]).toBeTruthy();
    const docs = await app.inject({ method: "GET", url: "/docs" });
    expect(docs.statusCode).toBe(200);
    expect(docs.body).toContain("swagger-ui");
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

  it("simulates Copilot retrieval for the default actor and a chosen actor", async () => {
    // Default actor (normal-employee scenario -> Bob) surfaces the org-wide salary file.
    const def = await app.inject({ method: "GET", url: `/api/workspaces/${wsId}/retrieval` });
    expect(def.statusCode).toBe(200);
    const body = def.json() as { actorId: string; actorName: string; items: { resourceId: string; via: string }[] };
    expect(body.actorId).toBe("u-bob");
    expect(body.items.some((i) => i.resourceId === "f-salary")).toBe(true);

    // Explicit actor id is honored.
    const explicit = await app.inject({ method: "GET", url: `/api/workspaces/${wsId}/retrieval?actorId=u-bob` });
    expect(explicit.statusCode).toBe(200);
    expect(explicit.json().actorId).toBe("u-bob");
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

  it("tracks exposure history + drift across scans", async () => {
    // A scan already ran and the critical was fixed; re-scan to make a 2nd snapshot.
    await app.inject({ method: "POST", url: `/api/workspaces/${wsId}/scans`, payload: {} });
    const res = await app.inject({ method: "GET", url: `/api/workspaces/${wsId}/scan-history` });
    const body = res.json();
    expect(body.snapshots.length).toBeGreaterThanOrEqual(2);
    expect(body.drift).not.toBeNull();
    // the fix dropped exposure, so the latest score is <= the prior one
    expect(body.drift.scoreDelta).toBeLessThanOrEqual(0);
  });
});

describe("multi-system connectors", () => {
  it("seeds Google Workspace into a workspace and scans it through the same engine", async () => {
    const created = await app.inject({ method: "POST", url: "/api/workspaces", payload: { name: "GWS Co" } });
    const gwsId = created.json().id as string;

    const seeded = await app.inject({
      method: "POST",
      url: `/api/workspaces/${gwsId}/connections/google-workspace/seed`,
    });
    expect(seeded.statusCode).toBe(201);
    expect(seeded.json().connection.mode).toBe("google-workspace");

    const scan = await app.inject({ method: "POST", url: `/api/workspaces/${gwsId}/scans`, payload: {} });
    expect(scan.statusCode).toBe(201);
    expect(scan.json().findingCount).toBeGreaterThanOrEqual(3);
    expect(scan.json().bands.critical).toBeGreaterThanOrEqual(1);

    const audit = await app.inject({ method: "GET", url: `/api/workspaces/${gwsId}/audit-events` });
    const actions = audit.json().map((e: { action: string }) => e.action);
    expect(actions).toContain("connection.google-workspace.seed");
  });

  it("seeds the combined multi-system demo (findings span systems)", async () => {
    const created = await app.inject({ method: "POST", url: "/api/workspaces", payload: { name: "All Systems Co" } });
    const multiId = created.json().id as string;
    const seeded = await app.inject({
      method: "POST",
      url: `/api/workspaces/${multiId}/connections/multi-system/seed`,
    });
    expect(seeded.statusCode).toBe(201);
    expect(seeded.json().connection.mode).toBe("multi-system");
    const scan = await app.inject({ method: "POST", url: `/api/workspaces/${multiId}/scans`, payload: {} });
    expect(scan.json().findingCount).toBeGreaterThanOrEqual(9);
  });

  it("rejects an unknown system with 400", async () => {
    const res = await app.inject({ method: "POST", url: `/api/workspaces/${wsId}/connections/dropbox/seed` });
    expect(res.statusCode).toBe(400);
  });
});

describe("schedules", () => {
  let scheduleId: string;

  it("creates a schedule", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/workspaces/${wsId}/schedules`,
      payload: { name: "Nightly scan", action: "scan", cadenceMinutes: 1440 },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    scheduleId = body.id as string;
    expect(scheduleId).toMatch(/^sch-/);
    expect(body.enabled).toBe(true);
    expect(body.nextRunAt).toBeTruthy();
  });

  it("lists schedules for the workspace", async () => {
    const res = await app.inject({ method: "GET", url: `/api/workspaces/${wsId}/schedules` });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveLength(1);
  });

  it("patches a schedule to disabled", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/api/workspaces/${wsId}/schedules/${scheduleId}`,
      payload: { enabled: false },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().enabled).toBe(false);
  });

  it("deletes a schedule", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: `/api/workspaces/${wsId}/schedules/${scheduleId}`,
    });
    expect(res.statusCode).toBe(204);
    const list = await app.inject({ method: "GET", url: `/api/workspaces/${wsId}/schedules` });
    expect(list.json()).toHaveLength(0);
  });

  it("404s when patching a missing schedule", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/api/workspaces/${wsId}/schedules/sch-nope`,
      payload: { enabled: true },
    });
    expect(res.statusCode).toBe(404);
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

describe("graph change notifications (webhook)", () => {
  it("echoes the validationToken as text/plain on the handshake", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/webhooks/graph?validationToken=abc123",
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toBe("abc123");
    expect(res.headers["content-type"]).toContain("text/plain");
  });

  it("re-scans + audits when a notification's clientState is a known workspace", async () => {
    const created = await app.inject({ method: "POST", url: "/api/workspaces", payload: { name: "Notify Co" } });
    const nid = created.json().id as string;
    await app.inject({ method: "POST", url: `/api/workspaces/${nid}/connections/demo/seed` });
    await app.inject({ method: "POST", url: `/api/workspaces/${nid}/scans`, payload: {} });

    const res = await app.inject({
      method: "POST",
      url: "/api/webhooks/graph",
      payload: { value: [{ clientState: nid, changeType: "updated", resource: "/drives/d1/root" }] },
    });
    expect(res.statusCode).toBe(202);

    const audit = await app.inject({ method: "GET", url: `/api/workspaces/${nid}/audit-events` });
    const actions = audit.json().map((e: { action: string }) => e.action);
    expect(actions).toContain("notification.received");
  });

  it("still 202s (no throw) for an unknown clientState", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/webhooks/graph",
      payload: { value: [{ clientState: "ws-does-not-exist", changeType: "updated" }] },
    });
    expect(res.statusCode).toBe(202);
  });

  it("exposes subscribe-info for a workspace", async () => {
    const info = await app.inject({ method: "GET", url: `/api/workspaces/${wsId}/notifications/subscribe-info` });
    expect(info.statusCode).toBe(200);
    const body = info.json() as { notificationUrl: string; clientState: string; recommendedResource: string };
    expect(body.notificationUrl).toBe("/api/webhooks/graph");
    expect(body.clientState).toBe(wsId);
    expect(body.recommendedResource).toContain("/drives/");
  });
});

describe("retrieval without a connection", () => {
  it("404s when no graph has been ingested yet", async () => {
    const created = await app.inject({ method: "POST", url: "/api/workspaces", payload: { name: "Empty Co" } });
    const emptyId = created.json().id as string;
    const res = await app.inject({ method: "GET", url: `/api/workspaces/${emptyId}/retrieval` });
    expect(res.statusCode).toBe(404);
    expect(res.json().error).toContain("no connection");
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
