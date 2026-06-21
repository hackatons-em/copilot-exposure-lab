import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "./app.js";
import {
  ROLE_PERMISSIONS,
  buildKeyIndex,
  extractCredential,
  parseApiKeys,
  resolveRole,
  roleHasPermission,
} from "./auth.js";
import { MemoryStore } from "./store/memory.js";

// Keys for the enforced-mode app. One per role we exercise.
const OWNER = "k_owner_owns_everything";
const ANALYST = "k_analyst_can_scan";
const VIEWER = "k_viewer_read_only";

const ownerAuth = { authorization: `Bearer ${OWNER}` };
const analystAuth = { authorization: `Bearer ${ANALYST}` };
const viewerAuth = { authorization: `Bearer ${VIEWER}` };

describe("auth.ts unit helpers", () => {
  it("ROLE_PERMISSIONS mirrors the permissions-model matrix", () => {
    expect(ROLE_PERMISSIONS.owner).toEqual(["connect", "scan", "view", "export", "manage", "delete"]);
    expect(ROLE_PERMISSIONS.admin).toEqual(["connect", "scan", "view", "export"]);
    expect(ROLE_PERMISSIONS.analyst).toEqual(["scan", "view", "export"]);
    expect(ROLE_PERMISSIONS.viewer).toEqual(["view"]);
  });

  it("roleHasPermission resolves grants correctly", () => {
    expect(roleHasPermission("viewer", "view")).toBe(true);
    expect(roleHasPermission("viewer", "scan")).toBe(false);
    expect(roleHasPermission("analyst", "scan")).toBe(true);
    expect(roleHasPermission("analyst", "delete")).toBe(false);
    expect(roleHasPermission("owner", "delete")).toBe(true);
  });

  it("parseApiKeys parses comma-separated key:role pairs (and trims)", () => {
    const parsed = parseApiKeys(" k_admin123:admin , k_view456:viewer ");
    expect(parsed).toEqual([
      { key: "k_admin123", role: "admin" },
      { key: "k_view456", role: "viewer" },
    ]);
  });

  it("parseApiKeys returns undefined for unset / empty (auth stays off)", () => {
    expect(parseApiKeys(undefined)).toBeUndefined();
    expect(parseApiKeys("")).toBeUndefined();
    expect(parseApiKeys("   ")).toBeUndefined();
  });

  it("parseApiKeys rejects unknown roles and malformed pairs", () => {
    expect(() => parseApiKeys("k_x:superuser")).toThrow(/unknown role/);
    expect(() => parseApiKeys("nocolon")).toThrow(/malformed/);
    expect(() => parseApiKeys(":viewer")).toThrow(/malformed/);
  });

  it("extractCredential reads Bearer and x-api-key", () => {
    expect(extractCredential({ authorization: "Bearer abc" })).toBe("abc");
    expect(extractCredential({ authorization: "bearer abc" })).toBe("abc");
    expect(extractCredential({ "x-api-key": "xyz" })).toBe("xyz");
    expect(extractCredential({})).toBeUndefined();
  });

  it("resolveRole throws 401 on missing/unknown keys", () => {
    const index = buildKeyIndex([{ key: "k_ok", role: "viewer" }]);
    expect(resolveRole({ authorization: "Bearer k_ok" }, index)).toBe("viewer");
    expect(() => resolveRole({}, index)).toThrowError(expect.objectContaining({ statusCode: 401 }));
    expect(() => resolveRole({ authorization: "Bearer nope" }, index)).toThrowError(
      expect.objectContaining({ statusCode: 401 }),
    );
  });
});

describe("RBAC enforcement (auth ON via apiKeys)", () => {
  let app: FastifyInstance;
  let wsId: string;
  let findingId: string;

  beforeAll(async () => {
    app = buildApp({
      store: new MemoryStore(),
      apiKeys: [
        { key: OWNER, role: "owner", label: "Owner" },
        { key: ANALYST, role: "analyst", label: "Analyst" },
        { key: VIEWER, role: "viewer", label: "Viewer" },
      ],
    });
    await app.ready();

    // Seed + scan a workspace using the OWNER key (owner has every permission).
    const created = await app.inject({
      method: "POST",
      url: "/api/workspaces",
      payload: { name: "Auth Co" },
      headers: ownerAuth,
    });
    expect(created.statusCode).toBe(201);
    wsId = created.json().id as string;

    const seeded = await app.inject({
      method: "POST",
      url: `/api/workspaces/${wsId}/connections/demo/seed`,
      headers: ownerAuth,
    });
    expect(seeded.statusCode).toBe(201);

    const scan = await app.inject({
      method: "POST",
      url: `/api/workspaces/${wsId}/scans`,
      payload: {},
      headers: ownerAuth,
    });
    expect(scan.statusCode).toBe(201);

    const findings = await app.inject({
      method: "GET",
      url: `/api/workspaces/${wsId}/findings`,
      headers: ownerAuth,
    });
    findingId = findings.json()[0].id as string;
  });

  afterAll(async () => {
    await app.close();
  });

  it("no Authorization header → 401 on a protected route", async () => {
    const res = await app.inject({ method: "GET", url: `/api/workspaces/${wsId}/findings` });
    expect(res.statusCode).toBe(401);
    expect(res.json().error).toBe("unauthorized");
  });

  it("unknown key → 401", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/workspaces/${wsId}/findings`,
      headers: { authorization: "Bearer k_does_not_exist" },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json().error).toBe("unauthorized");
  });

  it("viewer can GET /findings (200) but cannot POST /scans (403)", async () => {
    const view = await app.inject({
      method: "GET",
      url: `/api/workspaces/${wsId}/findings`,
      headers: viewerAuth,
    });
    expect(view.statusCode).toBe(200);
    expect(Array.isArray(view.json())).toBe(true);

    const scan = await app.inject({
      method: "POST",
      url: `/api/workspaces/${wsId}/scans`,
      payload: {},
      headers: viewerAuth,
    });
    expect(scan.statusCode).toBe(403);
    expect(scan.json().error).toBe("forbidden");
  });

  it("viewer cannot PATCH a finding (scan permission required) → 403", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/api/workspaces/${wsId}/findings/${findingId}`,
      payload: { status: "acknowledged" },
      headers: viewerAuth,
    });
    expect(res.statusCode).toBe(403);
  });

  it("analyst can POST /scans (200/201) but cannot DELETE the workspace (403)", async () => {
    const scan = await app.inject({
      method: "POST",
      url: `/api/workspaces/${wsId}/scans`,
      payload: {},
      headers: analystAuth,
    });
    expect(scan.statusCode).toBe(201);

    const del = await app.inject({
      method: "DELETE",
      url: `/api/workspaces/${wsId}`,
      headers: analystAuth,
    });
    expect(del.statusCode).toBe(403);
    expect(del.json().error).toBe("forbidden");
  });

  it("analyst cannot create a workspace (manage required) → 403", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/workspaces",
      payload: { name: "Nope Co" },
      headers: analystAuth,
    });
    expect(res.statusCode).toBe(403);
  });

  it("x-api-key header is accepted as an alternative credential", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/workspaces/${wsId}/findings`,
      headers: { "x-api-key": VIEWER },
    });
    expect(res.statusCode).toBe(200);
  });

  it("owner can DELETE the workspace → 204", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: `/api/workspaces/${wsId}`,
      headers: ownerAuth,
    });
    expect(res.statusCode).toBe(204);
  });

  it("GET /health works with no key (public)", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json().ok).toBe(true);
  });

  it("POST /api/webhooks/graph?validationToken=x works with no key (public)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/webhooks/graph?validationToken=handshake-token",
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toBe("handshake-token");
  });
});
