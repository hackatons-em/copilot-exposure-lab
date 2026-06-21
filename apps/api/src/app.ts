import cors from "@fastify/cors";
import { type GraphProvider, MsGraphClient, createGraphRequester } from "@cel/graph-client";
import { EXPORT_FORMATS, isExportFormat, runExport } from "@cel/integrations";
import { simulateRetrieval } from "@cel/rule-engine";
import Fastify, { type FastifyInstance } from "fastify";
import { z } from "zod";
import type { FindingStatus } from "@cel/types";
import type { Store } from "./store/types.js";

export interface GraphProviderInput {
  workspaceId: string;
  workspaceName: string;
  tenantId: string;
  clientId: string;
  clientSecret: string;
  tenantName: string;
}

export interface BuildAppOptions {
  store: Store;
  logger?: boolean;
  /** Build a live Graph provider from credentials. Injectable for testing. */
  graphProviderFactory?: (input: GraphProviderInput) => GraphProvider;
}

/** Default factory: a metadata-only, least-privilege live Microsoft Graph client. */
function defaultGraphProviderFactory(input: GraphProviderInput): GraphProvider {
  const requester = createGraphRequester({
    tenantId: input.tenantId,
    clientId: input.clientId,
    clientSecret: input.clientSecret,
  });
  return new MsGraphClient(requester, {
    workspace: { id: input.workspaceId, name: input.workspaceName },
    tenantName: input.tenantName,
  });
}

const createWorkspaceBody = z.object({ id: z.string().optional(), name: z.string().min(1) });
const scanBody = z.object({ actorId: z.string().optional() }).optional();
const findingPatch = z.object({
  status: z.enum(["open", "acknowledged", "remediating", "resolved", "accepted-risk"]).optional(),
  applyFix: z.boolean().optional(),
});

const createScheduleBody = z.object({
  name: z.string().min(1),
  action: z.enum(["scan", "report"]).optional(),
  cadenceMinutes: z.number().int().positive(),
});
const schedulePatch = z.object({
  name: z.string().min(1).optional(),
  cadenceMinutes: z.number().int().positive().optional(),
  enabled: z.boolean().optional(),
});

/** Build the Fastify app over a Store. Pure of any transport/db specifics. */
export function buildApp(opts: BuildAppOptions): FastifyInstance {
  const app = Fastify({ logger: opts.logger ?? false });
  const { store } = opts;
  const graphProviderFactory = opts.graphProviderFactory ?? defaultGraphProviderFactory;

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

  // Connect a live Microsoft 365 tenant (metadata-only ingestion via Graph).
  // The client secret is used transiently to build the provider and is never
  // logged, returned, or persisted (non-negotiable: secrets never leave).
  app.post("/api/workspaces/:id/connections/microsoft/start", async (req, reply) => {
    const { id } = req.params as { id: string };
    await requireWorkspace(id);
    const body = z
      .object({
        tenantId: z.string().min(1),
        clientId: z.string().min(1),
        clientSecret: z.string().min(1),
        tenantName: z.string().optional(),
      })
      .parse(req.body);
    const ws = await store.getWorkspace(id);
    const provider = graphProviderFactory({
      workspaceId: id,
      workspaceName: ws?.name ?? id,
      tenantId: body.tenantId,
      clientId: body.clientId,
      clientSecret: body.clientSecret,
      tenantName: body.tenantName ?? body.tenantId,
    });
    const result = await store.ingestGraph(id, provider);
    await store.logAudit({
      workspaceId: id,
      actor: "api",
      action: "connection.microsoft.start",
      targetId: result.connection.id,
      detail: { tenantName: result.connection.tenantName, mode: result.connection.mode },
    });
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

  // ── Copilot retrieval simulation ───────────────────────────
  // What M365 Copilot, grounded on what an actor can access, could surface to
  // them. Deterministic, metadata-only — a read, so no audit event required.
  app.get("/api/workspaces/:id/retrieval", async (req) => {
    const { id } = req.params as { id: string };
    await requireWorkspace(id);
    const graph = await store.getTenantGraph(id);
    if (!graph) throw Object.assign(new Error("no connection — seed or connect first"), { statusCode: 404 });
    const { actorId } = req.query as { actorId?: string };
    const fallbackActor =
      graph.scenarios.find((s) => s.key === "normal-employee")?.actorPrincipalId ??
      graph.principals.find((p) => p.kind === "user")?.id;
    const resolvedActor = actorId ?? fallbackActor;
    if (!resolvedActor) throw Object.assign(new Error("no actor available to simulate"), { statusCode: 404 });
    return simulateRetrieval(graph, { actorId: resolvedActor });
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

  // ── Reports ────────────────────────────────────────────────
  app.post("/api/workspaces/:id/reports", async (req, reply) => {
    const { id } = req.params as { id: string };
    await requireWorkspace(id);
    const { format } = z.object({ format: z.enum(["markdown", "html"]).default("markdown") }).parse(req.body ?? {});
    const report = await store.createReport(id, format);
    await store.logAudit({ workspaceId: id, actor: "api", action: "report.create", targetId: report.id, detail: { format } });
    return reply.status(201).send(report);
  });

  app.get("/api/workspaces/:id/reports/:rid", async (req) => {
    const { id, rid } = req.params as { id: string; rid: string };
    await requireWorkspace(id);
    const report = await store.getReport(id, rid);
    if (!report) throw Object.assign(new Error("report not found"), { statusCode: 404 });
    return report;
  });

  app.get("/api/workspaces/:id/reports/:rid/download", async (req, reply) => {
    const { id, rid } = req.params as { id: string; rid: string };
    await requireWorkspace(id);
    const content = await store.getReportContent(id, rid);
    if (!content) throw Object.assign(new Error("report not found"), { statusCode: 404 });
    await store.logAudit({ workspaceId: id, actor: "api", action: "report.export", targetId: rid });
    const contentType = content.format === "html" ? "text/html; charset=utf-8" : "text/markdown; charset=utf-8";
    return reply
      .header("content-type", contentType)
      .header("content-disposition", `attachment; filename="${content.filename}"`)
      .send(content.content);
  });

  // ── Schedules ──────────────────────────────────────────────
  // A schedule periodically enqueues a scan (or report) job for a workspace.
  app.post("/api/workspaces/:id/schedules", async (req, reply) => {
    const { id } = req.params as { id: string };
    await requireWorkspace(id);
    const body = createScheduleBody.parse(req.body ?? {});
    const schedule = await store.createSchedule(id, body);
    await store.logAudit({
      workspaceId: id,
      actor: "api",
      action: "schedule.create",
      targetId: schedule.id,
      detail: { name: schedule.name, action: schedule.action, cadenceMinutes: schedule.cadenceMinutes },
    });
    return reply.status(201).send(schedule);
  });

  app.get("/api/workspaces/:id/schedules", async (req) => {
    const { id } = req.params as { id: string };
    await requireWorkspace(id);
    return store.listSchedules(id);
  });

  app.patch("/api/workspaces/:id/schedules/:sid", async (req) => {
    const { id, sid } = req.params as { id: string; sid: string };
    await requireWorkspace(id);
    const patch = schedulePatch.parse(req.body ?? {});
    const schedule = await store.updateSchedule(id, sid, patch);
    if (!schedule) throw Object.assign(new Error("schedule not found"), { statusCode: 404 });
    await store.logAudit({
      workspaceId: id,
      actor: "api",
      action: "schedule.update",
      targetId: sid,
      detail: { ...patch },
    });
    return schedule;
  });

  app.delete("/api/workspaces/:id/schedules/:sid", async (req, reply) => {
    const { id, sid } = req.params as { id: string; sid: string };
    await requireWorkspace(id);
    const deleted = await store.deleteSchedule(id, sid);
    if (!deleted) throw Object.assign(new Error("schedule not found"), { statusCode: 404 });
    await store.logAudit({ workspaceId: id, actor: "api", action: "schedule.delete", targetId: sid });
    return reply.status(204).send();
  });

  // ── Exports ────────────────────────────────────────────────
  // The available deterministic security-tool export formats (drives the UI).
  app.get("/api/workspaces/:id/exports", async (req) => {
    const { id } = req.params as { id: string };
    await requireWorkspace(id);
    return EXPORT_FORMATS;
  });

  // Generate a single export on demand from the latest scan. Pure transform —
  // no document content, no secrets; TimeGenerated uses the scan's generatedAt.
  app.get("/api/workspaces/:id/exports/:format", async (req, reply) => {
    const { id, format } = req.params as { id: string; format: string };
    await requireWorkspace(id);
    if (!isExportFormat(format)) throw Object.assign(new Error(`unknown export format: ${format}`), { statusCode: 400 });
    const scanResult = await store.getScanResult(id);
    if (!scanResult) throw Object.assign(new Error("no scan result — run a scan first"), { statusCode: 404 });
    const ws = await store.getWorkspace(id);
    const artifact = runExport(format, scanResult, { workspaceName: ws?.name ?? id });
    await store.logAudit({ workspaceId: id, actor: "api", action: `export.${format}`, targetId: artifact.filename });
    return reply
      .header("content-type", artifact.contentType)
      .header("content-disposition", `attachment; filename="${artifact.filename}"`)
      .send(artifact.body);
  });

  // ── Audit ──────────────────────────────────────────────────
  app.get("/api/workspaces/:id/audit-events", async (req) => {
    const { id } = req.params as { id: string };
    await requireWorkspace(id);
    return store.listAudit(id);
  });

  return app;
}
