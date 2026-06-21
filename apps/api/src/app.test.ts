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
    expect(res.json().counts.resources).toBe(13);
  });

  it("runs a scan and returns the band distribution", async () => {
    const res = await app.inject({ method: "POST", url: `/api/workspaces/${wsId}/scans`, payload: {} });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.findingCount).toBe(8);
    expect(body.bands.critical).toBeGreaterThanOrEqual(1);
  });

  it("lists findings and filters by severity", async () => {
    const all = await app.inject({ method: "GET", url: `/api/workspaces/${wsId}/findings` });
    expect(all.json()).toHaveLength(8);
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
