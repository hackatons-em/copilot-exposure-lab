import cors from "@fastify/cors";
import {
  GoogleWorkspaceClient,
  type GraphProvider,
  MsGraphClient,
  MultiSystemClient,
  SalesforceClient,
  SlackClient,
  createGraphRequester,
} from "@cel/graph-client";
import { EXPORT_FORMATS, isExportFormat, runExport } from "@cel/integrations";
import { buildExposureGraphModel, simulateRetrieval, tenantExposureScore } from "@cel/rule-engine";
import Fastify, { type FastifyInstance } from "fastify";
import { z } from "zod";
import type { FindingStatus } from "@cel/types";
import {
  type ApiKeyEntry,
  type Permission,
  type Role,
  assertPermission,
  buildKeyIndex,
  resolveRole,
} from "./auth.js";
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
  /**
   * Configured API keys (the on/off switch for auth).
   *  - undefined OR empty → AUTH DISABLED: every request is role "owner" (full
   *    access). Preserves all existing behavior / the open demo.
   *  - non-empty → AUTH ENFORCED: the caller's key (Bearer / x-api-key) is
   *    resolved to a role and each route's required permission is checked.
   */
  apiKeys?: ApiKeyEntry[];
}

/**
 * Per-route metadata. Each route declares the permission it requires (or marks
 * itself public) via Fastify's route `config`, and a single hook enforces it —
 * no giant switch. `public: true` skips auth entirely (health, the Graph
 * webhook); a `permission` is required when auth is enforced.
 */
interface RouteAuthConfig {
  permission?: Permission;
  public?: boolean;
}

/** Helper: declare a route's auth requirement as a Fastify `config` object. */
function perm(permission: Permission): { config: RouteAuthConfig } {
  return { config: { permission } };
}

/** Helper: declare a route as public (no auth ever). */
const PUBLIC: { config: RouteAuthConfig } = { config: { public: true } };

declare module "fastify" {
  interface FastifyRequest {
    /** The caller's resolved role (always set; "owner" when auth is disabled). */
    role: Role;
  }
  interface FastifyContextConfig {
    permission?: Permission;
    public?: boolean;
  }
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

/**
 * Multi-system connectors that normalize their world into the same TenantGraph
 * the rule engine consumes. Each factory builds a metadata-only seed provider.
 */
const SYSTEM_PROVIDERS: Record<string, () => GraphProvider> = {
  "google-workspace": () => new GoogleWorkspaceClient(),
  slack: () => new SlackClient(),
  salesforce: () => new SalesforceClient(),
  "multi-system": () => new MultiSystemClient(),
};

const createWorkspaceBody = z.object({ id: z.string().optional(), name: z.string().min(1) });
const scanBody = z.object({ actorId: z.string().optional() }).optional();
const findingPatch = z.object({
  status: z.enum(["open", "acknowledged", "remediating", "resolved", "accepted-risk"]).optional(),
  applyFix: z.boolean().optional(),
});

// A Graph change-notification batch. Graph posts a `value` array; each entry
// carries the clientState we registered (= the workspaceId) plus what changed.
const graphNotificationBody = z.object({
  value: z.array(
    z.object({
      clientState: z.string().optional(),
      resource: z.string().optional(),
      changeType: z.string().optional(),
    }),
  ),
});

// The Graph resource we recommend subscribing to (drive root changes drive the
// re-scan of SharePoint/OneDrive exposure). Documented for the UI/runbook.
const RECOMMENDED_NOTIFICATION_RESOURCE = "/drives/{drive-id}/root";

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

  // ── Auth (config-gated) ────────────────────────────────────
  // Auth is OFF unless API keys are configured. When off, every request is the
  // "owner" role (full access) — existing tests, the e2e, and the demo are
  // untouched. When on, resolve the caller's role from the credential header
  // and enforce the per-route permission declared via the route `config`.
  const authEnabled = (opts.apiKeys?.length ?? 0) > 0;
  const keyIndex = authEnabled ? buildKeyIndex(opts.apiKeys ?? []) : undefined;

  app.addHook("onRequest", async (req) => {
    const routeConfig = req.routeOptions.config as RouteAuthConfig | undefined;

    if (!authEnabled) {
      // Auth disabled: treat everyone as owner so handlers can read req.role uniformly.
      req.role = "owner";
      return;
    }

    // Public routes (health, the Graph webhook) never require a credential.
    if (routeConfig?.public) return;

    // Resolve role from the credential (401 on missing/unknown key).
    const role = resolveRole(req.headers, keyIndex ?? new Map());
    req.role = role;

    // Enforce the route's required permission (403 if the role lacks it).
    if (routeConfig?.permission) assertPermission(role, routeConfig.permission);
  });

  // Resolve + assert a workspace exists (workspace isolation gate).
  async function requireWorkspace(id: string): Promise<void> {
    const ws = await store.getWorkspace(id);
    if (!ws) throw Object.assign(new Error("workspace not found"), { statusCode: 404 });
  }

  app.get("/health", PUBLIC, async () => ({ ok: true, service: "cel-api" }));

  // ── Workspaces ─────────────────────────────────────────────
  app.post("/api/workspaces", perm("manage"), async (req, reply) => {
    const body = createWorkspaceBody.parse(req.body);
    const ws = await store.createWorkspace(body);
    await store.logAudit({ workspaceId: ws.id, actor: "api", action: "workspace.create", targetId: ws.id });
    return reply.status(201).send(ws);
  });

  app.get("/api/workspaces", perm("view"), async () => store.listWorkspaces());

  app.get("/api/workspaces/:id", perm("view"), async (req) => {
    const { id } = req.params as { id: string };
    await requireWorkspace(id);
    return store.getWorkspace(id);
  });

  app.delete("/api/workspaces/:id", perm("delete"), async (req, reply) => {
    const { id } = req.params as { id: string };
    await requireWorkspace(id);
    await store.deleteWorkspace(id);
    await store.logAudit({ workspaceId: id, actor: "api", action: "workspace.delete", targetId: id });
    return reply.status(204).send();
  });

  // ── Connections ────────────────────────────────────────────
  app.post("/api/workspaces/:id/connections/demo/seed", perm("connect"), async (req, reply) => {
    const { id } = req.params as { id: string };
    await requireWorkspace(id);
    const result = await store.seedDemo(id);
    await store.logAudit({ workspaceId: id, actor: "api", action: "connection.demo.seed", targetId: result.connection.id });
    return reply.status(201).send(result);
  });

  // Connect a live Microsoft 365 tenant (metadata-only ingestion via Graph).
  // The client secret is used transiently to build the provider and is never
  // logged, returned, or persisted (non-negotiable: secrets never leave).
  app.post("/api/workspaces/:id/connections/microsoft/start", perm("connect"), async (req, reply) => {
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

  // Connect another system (Google Workspace, Slack, Salesforce, or the combined
  // multi-system demo). Each builds a metadata-only provider that normalizes into
  // the same TenantGraph, so the unchanged deterministic engine scans it as-is.
  app.post("/api/workspaces/:id/connections/:system/seed", perm("connect"), async (req, reply) => {
    const { id, system } = req.params as { id: string; system: string };
    await requireWorkspace(id);
    const factory = SYSTEM_PROVIDERS[system];
    if (!factory) {
      throw Object.assign(new Error(`unknown system: ${system}`), { statusCode: 400 });
    }
    const result = await store.ingestGraph(id, factory());
    await store.logAudit({
      workspaceId: id,
      actor: "api",
      action: `connection.${system}.seed`,
      targetId: result.connection.id,
      detail: { mode: result.connection.mode },
    });
    return reply.status(201).send(result);
  });

  app.get("/api/workspaces/:id/connections", perm("view"), async (req) => {
    const { id } = req.params as { id: string };
    await requireWorkspace(id);
    return store.listConnections(id);
  });

  app.get("/api/workspaces/:id/resources", perm("view"), async (req) => {
    const { id } = req.params as { id: string };
    await requireWorkspace(id);
    return store.listResources(id);
  });

  app.get("/api/workspaces/:id/scenarios", perm("view"), async (req) => {
    const { id } = req.params as { id: string };
    await requireWorkspace(id);
    return store.listScenarios(id);
  });

  // ── Copilot retrieval simulation ───────────────────────────
  // What M365 Copilot, grounded on what an actor can access, could surface to
  // them. Deterministic, metadata-only — a read, so no audit event required.
  app.get("/api/workspaces/:id/retrieval", perm("view"), async (req) => {
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

  // ── Tenant exposure score (headline metric) ────────────────
  app.get("/api/workspaces/:id/exposure", perm("view"), async (req) => {
    const { id } = req.params as { id: string };
    await requireWorkspace(id);
    const result = await store.getScanResult(id);
    if (!result) {
      return { score: 0, band: "info", findingCount: 0, bands: { critical: 0, high: 0, medium: 0, low: 0, info: 0 }, drivers: [] };
    }
    return tenantExposureScore(result);
  });

  // ── Visual attack/exposure graph ───────────────────────────
  app.get("/api/workspaces/:id/graph", perm("view"), async (req) => {
    const { id } = req.params as { id: string };
    await requireWorkspace(id);
    const result = await store.getScanResult(id);
    if (!result) return { nodes: [], edges: [] };
    return buildExposureGraphModel(result);
  });

  // ── Continuous monitoring: trend + drift ───────────────────
  app.get("/api/workspaces/:id/scan-history", perm("view"), async (req) => {
    const { id } = req.params as { id: string };
    await requireWorkspace(id);
    const [snapshots, drift] = await Promise.all([store.listSnapshots(id, 30), store.getDrift(id)]);
    return { snapshots, drift: drift ?? null };
  });

  // ── Scans ──────────────────────────────────────────────────
  app.post("/api/workspaces/:id/scans", perm("scan"), async (req, reply) => {
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

  app.get("/api/workspaces/:id/scenarios/:sid/run", perm("view"), async (req) => {
    const { id, sid } = req.params as { id: string; sid: string };
    await requireWorkspace(id);
    const run = await store.getScenarioRun(id, sid);
    if (!run) throw Object.assign(new Error("scenario run not found — run a scan first"), { statusCode: 404 });
    return run;
  });

  // ── Findings ───────────────────────────────────────────────
  app.get("/api/workspaces/:id/findings", perm("view"), async (req) => {
    const { id } = req.params as { id: string };
    await requireWorkspace(id);
    const q = req.query as { severity?: string; status?: string; scenarioId?: string };
    return store.listFindings(id, q);
  });

  app.get("/api/workspaces/:id/findings/:fid", perm("view"), async (req) => {
    const { id, fid } = req.params as { id: string; fid: string };
    await requireWorkspace(id);
    const detail = await store.getFinding(id, fid);
    if (!detail) throw Object.assign(new Error("finding not found"), { statusCode: 404 });
    return detail;
  });

  app.patch("/api/workspaces/:id/findings/:fid", perm("scan"), async (req) => {
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
  app.post("/api/workspaces/:id/reports", perm("export"), async (req, reply) => {
    const { id } = req.params as { id: string };
    await requireWorkspace(id);
    const { format } = z.object({ format: z.enum(["markdown", "html"]).default("markdown") }).parse(req.body ?? {});
    const report = await store.createReport(id, format);
    await store.logAudit({ workspaceId: id, actor: "api", action: "report.create", targetId: report.id, detail: { format } });
    return reply.status(201).send(report);
  });

  app.get("/api/workspaces/:id/reports/:rid", perm("view"), async (req) => {
    const { id, rid } = req.params as { id: string; rid: string };
    await requireWorkspace(id);
    const report = await store.getReport(id, rid);
    if (!report) throw Object.assign(new Error("report not found"), { statusCode: 404 });
    return report;
  });

  app.get("/api/workspaces/:id/reports/:rid/download", perm("export"), async (req, reply) => {
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
  app.post("/api/workspaces/:id/schedules", perm("manage"), async (req, reply) => {
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

  app.get("/api/workspaces/:id/schedules", perm("view"), async (req) => {
    const { id } = req.params as { id: string };
    await requireWorkspace(id);
    return store.listSchedules(id);
  });

  app.patch("/api/workspaces/:id/schedules/:sid", perm("manage"), async (req) => {
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

  app.delete("/api/workspaces/:id/schedules/:sid", perm("manage"), async (req, reply) => {
    const { id, sid } = req.params as { id: string; sid: string };
    await requireWorkspace(id);
    const deleted = await store.deleteSchedule(id, sid);
    if (!deleted) throw Object.assign(new Error("schedule not found"), { statusCode: 404 });
    await store.logAudit({ workspaceId: id, actor: "api", action: "schedule.delete", targetId: sid });
    return reply.status(204).send();
  });

  // ── Exports ────────────────────────────────────────────────
  // The available deterministic security-tool export formats (drives the UI).
  app.get("/api/workspaces/:id/exports", perm("view"), async (req) => {
    const { id } = req.params as { id: string };
    await requireWorkspace(id);
    return EXPORT_FORMATS;
  });

  // Generate a single export on demand from the latest scan. Pure transform —
  // no document content, no secrets; TimeGenerated uses the scan's generatedAt.
  app.get("/api/workspaces/:id/exports/:format", perm("export"), async (req, reply) => {
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
  app.get("/api/workspaces/:id/audit-events", perm("view"), async (req) => {
    const { id } = req.params as { id: string };
    await requireWorkspace(id);
    return store.listAudit(id);
  });

  // ── Change notifications ───────────────────────────────────
  // Tells the UI/runbook how to register a Graph subscription for this workspace:
  // point notificationUrl at the single webhook route below and set clientState
  // to the workspace id so notifications route back here. (No live subscription
  // is created from the API in this scaffold — see docs/SETUP-GRAPH.md.)
  app.get("/api/workspaces/:id/notifications/subscribe-info", perm("view"), async (req) => {
    const { id } = req.params as { id: string };
    await requireWorkspace(id);
    return {
      notificationUrl: "/api/webhooks/graph",
      clientState: id,
      recommendedResource: RECOMMENDED_NOTIFICATION_RESOURCE,
    };
  });

  // Single Graph notification URL (NOT workspace-scoped — Graph calls one URL and
  // we route by clientState). Graph retries aggressively, so this never 500s a
  // notification: malformed or unknown payloads are accepted (202) and skipped.
  app.post("/api/webhooks/graph", PUBLIC, async (req, reply) => {
    // Validation handshake: on subscription creation Graph GET/POSTs with a
    // validationToken query param and expects it echoed back as text/plain <10s.
    const { validationToken } = req.query as { validationToken?: string };
    if (validationToken !== undefined) {
      return reply.status(200).header("content-type", "text/plain").send(validationToken);
    }

    // Parse defensively — never throw on a notification body.
    const parsed = graphNotificationBody.safeParse(req.body);
    if (!parsed.success) return reply.status(202).send();

    for (const note of parsed.data.value) {
      const workspaceId = note.clientState;
      if (!workspaceId) continue;
      const ws = await store.getWorkspace(workspaceId);
      if (!ws) continue; // unknown/invalid clientState → skip, don't fail the batch
      // Re-scan the stored graph. In production we would first re-ingest the
      // changed items via MsGraphClient.getChanges(deltaLink) before scanning.
      await store.runScan(workspaceId);
      await store.logAudit({
        workspaceId,
        actor: "graph-webhook",
        action: "notification.received",
        detail: { changeType: note.changeType, resource: note.resource },
      });
    }
    return reply.status(202).send();
  });

  return app;
}
