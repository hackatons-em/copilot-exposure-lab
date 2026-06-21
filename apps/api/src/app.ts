import cors from "@fastify/cors";
import Fastify, { type FastifyInstance } from "fastify";
import { z } from "zod";
import type { FindingStatus } from "@cel/types";
import type { Store } from "./store/types.js";

export interface BuildAppOptions {
  store: Store;
  logger?: boolean;
}

const createWorkspaceBody = z.object({ id: z.string().optional(), name: z.string().min(1) });
const scanBody = z.object({ actorId: z.string().optional() }).optional();
const findingPatch = z.object({
  status: z.enum(["open", "acknowledged", "remediating", "resolved", "accepted-risk"]).optional(),
  applyFix: z.boolean().optional(),
});

/** Build the Fastify app over a Store. Pure of any transport/db specifics. */
export function buildApp(opts: BuildAppOptions): FastifyInstance {
  const app = Fastify({ logger: opts.logger ?? false });
  const { store } = opts;

  void app.register(cors, { origin: true });

  // Errors thrown by the store carry an optional statusCode (e.g. 404).
  app.setErrorHandler((err, _req, reply) => {
    const status = (err as { statusCode?: number }).statusCode ?? (err instanceof z.ZodError ? 400 : 500);
    const message = err instanceof z.ZodError ? "validation failed" : err.message;
    void reply.status(status).send({ error: message, details: err instanceof z.ZodError ? err.issues : undefined });
  });

  // Resolve + assert a workspace exists (workspace isolation gate).
  async function requireWorkspace(id: string): Promise<void> {
    const ws = await store.getWorkspace(id);
    if (!ws) throw Object.assign(new Error("workspace not found"), { statusCode: 404 });
  }

  app.get("/health", async () => ({ ok: true, service: "cel-api" }));

  // ── Workspaces ─────────────────────────────────────────────
  app.post("/api/workspaces", async (req, reply) => {
    const body = createWorkspaceBody.parse(req.body);
    const ws = await store.createWorkspace(body);
    await store.logAudit({ workspaceId: ws.id, actor: "api", action: "workspace.create", targetId: ws.id });
    return reply.status(201).send(ws);
  });

  app.get("/api/workspaces", async () => store.listWorkspaces());

  app.get("/api/workspaces/:id", async (req) => {
    const { id } = req.params as { id: string };
    await requireWorkspace(id);
    return store.getWorkspace(id);
  });

  app.delete("/api/workspaces/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    await requireWorkspace(id);
    await store.deleteWorkspace(id);
    await store.logAudit({ workspaceId: id, actor: "api", action: "workspace.delete", targetId: id });
    return reply.status(204).send();
  });

  // ── Connections ────────────────────────────────────────────
  app.post("/api/workspaces/:id/connections/demo/seed", async (req, reply) => {
    const { id } = req.params as { id: string };
    await requireWorkspace(id);
    const result = await store.seedDemo(id);
    await store.logAudit({ workspaceId: id, actor: "api", action: "connection.demo.seed", targetId: result.connection.id });
    return reply.status(201).send(result);
  });

  app.get("/api/workspaces/:id/connections", async (req) => {
    const { id } = req.params as { id: string };
    await requireWorkspace(id);
    return store.listConnections(id);
  });

  app.get("/api/workspaces/:id/resources", async (req) => {
    const { id } = req.params as { id: string };
    await requireWorkspace(id);
    return store.listResources(id);
  });

  app.get("/api/workspaces/:id/scenarios", async (req) => {
    const { id } = req.params as { id: string };
    await requireWorkspace(id);
    return store.listScenarios(id);
  });

  // ── Scans ──────────────────────────────────────────────────
  app.post("/api/workspaces/:id/scans", async (req, reply) => {
    const { id } = req.params as { id: string };
    await requireWorkspace(id);
    const body = scanBody.parse(req.body ?? {}) ?? {};
    const summary = await store.runScan(id, body);
    await store.logAudit({
      workspaceId: id,
      actor: "api",
      action: "scan.run",
      targetId: summary.scanRunId,
      detail: { findingCount: summary.findingCount, bands: summary.bands },
    });
    return reply.status(201).send(summary);
  });

  app.get("/api/workspaces/:id/scenarios/:sid/run", async (req) => {
    const { id, sid } = req.params as { id: string; sid: string };
    await requireWorkspace(id);
    const run = await store.getScenarioRun(id, sid);
    if (!run) throw Object.assign(new Error("scenario run not found — run a scan first"), { statusCode: 404 });
    return run;
  });

  // ── Findings ───────────────────────────────────────────────
  app.get("/api/workspaces/:id/findings", async (req) => {
    const { id } = req.params as { id: string };
    await requireWorkspace(id);
    const q = req.query as { severity?: string; status?: string; scenarioId?: string };
    return store.listFindings(id, q);
  });

  app.get("/api/workspaces/:id/findings/:fid", async (req) => {
    const { id, fid } = req.params as { id: string; fid: string };
    await requireWorkspace(id);
    const detail = await store.getFinding(id, fid);
    if (!detail) throw Object.assign(new Error("finding not found"), { statusCode: 404 });
    return detail;
  });

  app.patch("/api/workspaces/:id/findings/:fid", async (req) => {
    const { id, fid } = req.params as { id: string; fid: string };
    await requireWorkspace(id);
    const patch = findingPatch.parse(req.body ?? {});
    const finding = await store.updateFinding(id, fid, patch as { status?: FindingStatus; applyFix?: boolean });
    if (!finding) throw Object.assign(new Error("finding not found"), { statusCode: 404 });
    await store.logAudit({
      workspaceId: id,
      actor: "api",
      action: "finding.update",
      targetId: fid,
      detail: { ...patch },
    });
    return finding;
  });

  // ── Audit ──────────────────────────────────────────────────
  app.get("/api/workspaces/:id/audit-events", async (req) => {
    const { id } = req.params as { id: string };
    await requireWorkspace(id);
    return store.listAudit(id);
  });

  return app;
}
