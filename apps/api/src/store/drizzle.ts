import { randomUUID } from "node:crypto";
import {
  type Database,
  auditEvents,
  evidenceItems,
  findings as findingsTable,
  jobs,
  permissionGrants,
  principals as principalsTable,
  remediationTasks,
  reports as reportsTable,
  resources as resourcesTable,
  scanSnapshots,
  scenarioRuns,
  scenarios as scenariosTable,
  schedules as schedulesTable,
  tenantConnections,
  workspaces,
} from "@cel/db";
import { type GraphProvider, SeedGraphClient } from "@cel/graph-client";
import { buildReportModel, generateLlmSummary, renderHtml, renderMarkdown } from "@cel/report";
import { scan, tenantExposureScore } from "@cel/rule-engine";
import type {
  AuditEvent,
  Finding,
  FindingStatus,
  Report,
  ReportFormat,
  ScanResult,
  Scenario,
  ScenarioRun,
  TenantConnection,
  TenantGraph,
  Workspace,
} from "@cel/types";
import { and, asc, desc, eq, lte } from "drizzle-orm";
import { computeDrift } from "./drift.js";
import type {
  CreateScheduleInput,
  ExposureDrift,
  FindingDetail,
  FindingFilter,
  ReportContent,
  ScanRunSummary,
  ScanSnapshot,
  Schedule,
  ScheduleAction,
  Store,
  UpdateScheduleInput,
} from "./types.js";

const nowIso = (): string => new Date().toISOString();

/** now + minutes, as an ISO string. */
const addMinutes = (iso: string, minutes: number): string =>
  new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();
function notFound(msg: string): never {
  throw Object.assign(new Error(msg), { statusCode: 404 });
}

/** Postgres-backed Store. Runtime persistence for the API + worker. */
export class DrizzleStore implements Store {
  constructor(private readonly db: Database) {}

  private async assertWorkspace(id: string): Promise<void> {
    const rows = await this.db.select({ id: workspaces.id }).from(workspaces).where(eq(workspaces.id, id));
    if (rows.length === 0) notFound("workspace not found");
  }

  async createWorkspace(input: { id?: string; name: string }): Promise<Workspace> {
    const row = { id: input.id ?? `ws-${randomUUID()}`, name: input.name };
    await this.db.insert(workspaces).values(row);
    const ws = await this.getWorkspace(row.id);
    return ws!;
  }

  async listWorkspaces(): Promise<Workspace[]> {
    const rows = await this.db.select().from(workspaces);
    return rows.map((r) => ({ id: r.id, name: r.name, createdAt: r.createdAt }));
  }

  async getWorkspace(id: string): Promise<Workspace | undefined> {
    const [r] = await this.db.select().from(workspaces).where(eq(workspaces.id, id));
    return r ? { id: r.id, name: r.name, createdAt: r.createdAt } : undefined;
  }

  async deleteWorkspace(id: string): Promise<boolean> {
    const res = await this.db.delete(workspaces).where(eq(workspaces.id, id)).returning({ id: workspaces.id });
    return res.length > 0;
  }

  async ingestGraph(
    workspaceId: string,
    provider: GraphProvider,
  ): Promise<{ connection: TenantConnection; counts: Record<string, number> }> {
    await this.assertWorkspace(workspaceId);
    const loaded = await provider.loadTenantGraph();
    const connection: TenantConnection = { ...loaded.connection, id: `conn-${workspaceId}`, workspaceId };

    // Clear any existing graph + derived data for this workspace.
    for (const t of [
      evidenceItems,
      remediationTasks,
      findingsTable,
      scenarioRuns,
      permissionGrants,
      scenariosTable,
      resourcesTable,
      principalsTable,
      tenantConnections,
    ]) {
      await this.db.delete(t).where(eq(t.workspaceId, workspaceId));
    }
    await this.db.insert(tenantConnections).values({
      id: connection.id,
      workspaceId,
      mode: connection.mode,
      tenantName: connection.tenantName,
      scopes: connection.scopes ?? [],
    });
    await this.db.insert(principalsTable).values(
      loaded.principals.map((p) => ({ ...p, workspaceId, isExternal: p.isExternal ?? false })),
    );
    if (loaded.resources.length) {
      await this.db.insert(resourcesTable).values(loaded.resources.map((r) => ({ ...r, workspaceId })));
    }
    if (loaded.grants.length) {
      await this.db.insert(permissionGrants).values(loaded.grants.map((g) => ({ ...g, workspaceId })));
    }
    if (loaded.scenarios.length) {
      await this.db.insert(scenariosTable).values(loaded.scenarios.map((s) => ({ ...s, workspaceId })));
    }
    return {
      connection,
      counts: {
        principals: loaded.principals.length,
        resources: loaded.resources.length,
        grants: loaded.grants.length,
        scenarios: loaded.scenarios.length,
      },
    };
  }

  async seedDemo(workspaceId: string): Promise<{ connection: TenantConnection; counts: Record<string, number> }> {
    return this.ingestGraph(workspaceId, new SeedGraphClient());
  }

  async listConnections(workspaceId: string): Promise<TenantConnection[]> {
    const rows = await this.db.select().from(tenantConnections).where(eq(tenantConnections.workspaceId, workspaceId));
    return rows.map((r) => ({
      id: r.id,
      workspaceId: r.workspaceId,
      mode: r.mode as TenantConnection["mode"],
      tenantName: r.tenantName,
      scopes: r.scopes,
      connectedAt: r.connectedAt,
    }));
  }

  async listResources(workspaceId: string) {
    return (await this.getGraph(workspaceId))?.resources ?? [];
  }

  async listScenarios(workspaceId: string): Promise<Scenario[]> {
    return (await this.getGraph(workspaceId))?.scenarios ?? [];
  }

  /** Public accessor for the assembled tenant graph (delegates to the private builder). */
  async getTenantGraph(workspaceId: string): Promise<TenantGraph | undefined> {
    return this.getGraph(workspaceId);
  }

  /** Assemble the TenantGraph from persisted rows. */
  private async getGraph(workspaceId: string): Promise<TenantGraph | undefined> {
    const [ws] = await this.db.select().from(workspaces).where(eq(workspaces.id, workspaceId));
    const [conn] = await this.db.select().from(tenantConnections).where(eq(tenantConnections.workspaceId, workspaceId));
    if (!ws || !conn) return undefined;
    const [principals, resources, grants, scenarios] = await Promise.all([
      this.db.select().from(principalsTable).where(eq(principalsTable.workspaceId, workspaceId)),
      this.db.select().from(resourcesTable).where(eq(resourcesTable.workspaceId, workspaceId)),
      this.db.select().from(permissionGrants).where(eq(permissionGrants.workspaceId, workspaceId)),
      this.db.select().from(scenariosTable).where(eq(scenariosTable.workspaceId, workspaceId)),
    ]);
    return {
      workspace: { id: ws.id, name: ws.name, createdAt: ws.createdAt },
      connection: {
        id: conn.id,
        workspaceId: conn.workspaceId,
        mode: conn.mode as TenantConnection["mode"],
        tenantName: conn.tenantName,
        scopes: conn.scopes,
        connectedAt: conn.connectedAt,
      },
      principals: principals.map((p) => ({
        id: p.id,
        sourceId: p.sourceId,
        kind: p.kind as TenantGraph["principals"][number]["kind"],
        displayName: p.displayName,
        email: p.email ?? undefined,
        isExternal: p.isExternal ?? false,
        department: p.department ?? undefined,
        jobTitle: p.jobTitle ?? undefined,
        memberOf: p.memberOf,
        membershipKind: (p.membershipKind ?? undefined) as never,
        memberCount: p.memberCount ?? undefined,
        active: p.active,
      })),
      resources: resources.map((r) => ({
        id: r.id,
        sourceId: r.sourceId,
        kind: r.kind as TenantGraph["resources"][number]["kind"],
        name: r.name,
        path: r.path ?? undefined,
        url: r.url ?? undefined,
        parentId: r.parentId ?? undefined,
        ownerPrincipalId: r.ownerPrincipalId ?? undefined,
        sensitivityLabel: r.sensitivityLabel,
        sensitivityTags: r.sensitivityTags,
        businessCriticality: (r.businessCriticality ?? undefined) as never,
        agentActions: r.agentActions,
        connectors: r.connectors,
        authMode: (r.authMode ?? undefined) as never,
        publication: (r.publication ?? undefined) as never,
        synced: r.syncedAt,
      })),
      grants: grants.map((g) => ({
        id: g.id,
        resourceId: g.resourceId,
        principalId: g.principalId,
        right: g.right as TenantGraph["grants"][number]["right"],
        via: g.via as TenantGraph["grants"][number]["via"],
        inheritedFromResourceId: g.inheritedFromResourceId ?? undefined,
        sourcePermissionId: g.sourcePermissionId ?? undefined,
        linkScope: (g.linkScope ?? undefined) as never,
        expirationAt: g.expirationAt,
      })),
      scenarios: scenarios.map((s) => ({
        id: s.id,
        key: s.key as Scenario["key"],
        title: s.title,
        description: s.description,
        actorPrincipalId: s.actorPrincipalId ?? undefined,
        scope: s.scope,
        includeAgents: s.includeAgents,
      })),
    };
  }

  async runScan(workspaceId: string, opts: { actorId?: string } = {}): Promise<ScanRunSummary> {
    const graph = await this.getGraph(workspaceId);
    if (!graph) throw Object.assign(new Error("no connection — seed demo data first"), { statusCode: 409 });
    // Preserve proof-of-fix: findings previously resolved stay resolved on rerun.
    const resolved = await this.db
      .select({ id: findingsTable.id })
      .from(findingsTable)
      .where(and(eq(findingsTable.workspaceId, workspaceId), eq(findingsTable.status, "resolved")));
    const result = scan(graph, { now: nowIso(), actorId: opts.actorId, appliedFixes: resolved.map((r) => r.id) });
    await this.persistScan(workspaceId, result);
    const bands: Record<string, number> = {};
    for (const f of result.findings) bands[f.risk.band] = (bands[f.risk.band] ?? 0) + 1;
    const exposure = tenantExposureScore(result);
    await this.db.insert(scanSnapshots).values({
      id: `snap-${randomUUID()}`,
      workspaceId,
      takenAt: result.generatedAt,
      exposureScore: exposure.score,
      band: exposure.band,
      bands: exposure.bands,
      findingCount: exposure.findingCount,
      fingerprints: result.findings.filter((f) => f.status !== "resolved").map((f) => f.id),
    });
    return { scanRunId: `scan-${randomUUID()}`, findingCount: result.findings.length, bands, generatedAt: result.generatedAt };
  }

  async listSnapshots(workspaceId: string, limit = 30): Promise<ScanSnapshot[]> {
    const rows = await this.db
      .select()
      .from(scanSnapshots)
      .where(eq(scanSnapshots.workspaceId, workspaceId))
      .orderBy(desc(scanSnapshots.takenAt))
      .limit(limit);
    return rows.map((r) => ({
      id: r.id,
      workspaceId: r.workspaceId,
      takenAt: r.takenAt,
      exposureScore: r.exposureScore,
      band: r.band,
      bands: r.bands,
      findingCount: r.findingCount,
      fingerprints: r.fingerprints,
    }));
  }

  async getDrift(workspaceId: string): Promise<ExposureDrift | undefined> {
    const latest = await this.listSnapshots(workspaceId, 2);
    if (latest.length < 2) return undefined;
    return computeDrift(latest[0]!, latest[1]!);
  }

  private async persistScan(workspaceId: string, result: ScanResult): Promise<void> {
    for (const t of [evidenceItems, remediationTasks, findingsTable, scenarioRuns]) {
      await this.db.delete(t).where(eq(t.workspaceId, workspaceId));
    }
    if (result.findings.length) {
      await this.db.insert(findingsTable).values(
        result.findings.map((f) => ({
          id: f.id,
          workspaceId,
          ruleId: f.ruleId,
          title: f.title,
          severity: f.risk.band,
          score: f.risk.total,
          risk: f.risk,
          status: f.status,
          resourceId: f.resourceId,
          actorPrincipalId: f.principalId,
          summary: f.summary,
          businessImpact: f.businessImpact,
          remediationTaskId: f.remediationTaskId,
          exposurePath: f.exposurePath,
          evidenceIds: f.evidenceIds,
          scenarioIds: f.scenarioIds,
          createdAt: f.createdAt,
        })),
      );
    }
    if (result.evidence.length) {
      await this.db.insert(evidenceItems).values(result.evidence.map((e) => ({ ...e, workspaceId })));
    }
    if (result.remediationTasks.length) {
      await this.db.insert(remediationTasks).values(result.remediationTasks.map((t) => ({ ...t, workspaceId })));
    }
    if (result.scenarioRuns.length) {
      await this.db.insert(scenarioRuns).values(
        result.scenarioRuns.map((r) => ({
          id: r.id,
          workspaceId,
          scenarioId: r.scenarioId,
          runAt: r.runAt,
          paths: r.paths,
          findingIds: r.findingIds,
          summary: r.summary,
        })),
      );
    }
  }

  async getScanResult(workspaceId: string): Promise<ScanResult | undefined> {
    const [f, e, r, runs] = await Promise.all([
      this.db.select().from(findingsTable).where(eq(findingsTable.workspaceId, workspaceId)),
      this.db.select().from(evidenceItems).where(eq(evidenceItems.workspaceId, workspaceId)),
      this.db.select().from(remediationTasks).where(eq(remediationTasks.workspaceId, workspaceId)),
      this.db.select().from(scenarioRuns).where(eq(scenarioRuns.workspaceId, workspaceId)),
    ]);
    if (f.length === 0) return undefined;
    const findings: Finding[] = f.map((row) => ({
      id: row.id,
      ruleId: row.ruleId,
      title: row.title,
      resourceId: row.resourceId,
      principalId: row.actorPrincipalId ?? undefined,
      risk: row.risk ?? { total: row.score, band: row.severity as Finding["risk"]["band"], components: [] },
      exposurePath: row.exposurePath ?? undefined,
      evidenceIds: row.evidenceIds,
      remediationTaskId: row.remediationTaskId ?? undefined,
      scenarioIds: row.scenarioIds,
      status: row.status as FindingStatus,
      summary: row.summary,
      businessImpact: row.businessImpact,
      createdAt: row.createdAt,
    }));
    return {
      findings,
      evidence: e.map((row) => ({
        id: row.id,
        findingId: row.findingId,
        kind: row.kind as ScanResult["evidence"][number]["kind"],
        sourceObjectId: row.sourceObjectId,
        sourceObjectType: row.sourceObjectType as ScanResult["evidence"][number]["sourceObjectType"],
        statement: row.statement,
        data: row.data ?? undefined,
        observedAt: row.createdAt,
      })),
      remediationTasks: r.map((row) => ({
        id: row.id,
        findingId: row.findingId,
        title: row.title,
        steps: row.steps,
        microsoftControl: row.microsoftControl ?? undefined,
        graphActionHint: row.graphActionHint ?? undefined,
        estimatedEffort: row.estimatedEffort as ScanResult["remediationTasks"][number]["estimatedEffort"],
        owner: row.owner ?? undefined,
        status: row.status as "todo" | "done",
        fixVerified: row.fixVerified ?? undefined,
      })),
      scenarioRuns: runs.map((row) => ({
        id: row.id,
        scenarioId: row.scenarioId,
        runAt: row.runAt,
        paths: row.paths as ScenarioRun["paths"],
        findingIds: row.findingIds,
        summary: row.summary,
      })),
      generatedAt: findings[0]!.createdAt,
    };
  }

  async getScenarioRun(workspaceId: string, scenarioIdOrKey: string): Promise<ScenarioRun | undefined> {
    const graph = await this.getGraph(workspaceId);
    const scenario = graph?.scenarios.find((s) => s.id === scenarioIdOrKey || s.key === scenarioIdOrKey);
    if (!scenario) return undefined;
    const [row] = await this.db
      .select()
      .from(scenarioRuns)
      .where(and(eq(scenarioRuns.workspaceId, workspaceId), eq(scenarioRuns.scenarioId, scenario.id)));
    return row
      ? { id: row.id, scenarioId: row.scenarioId, runAt: row.runAt, paths: row.paths as ScenarioRun["paths"], findingIds: row.findingIds, summary: row.summary }
      : undefined;
  }

  async listFindings(workspaceId: string, filter: FindingFilter = {}): Promise<Finding[]> {
    const result = await this.getScanResult(workspaceId);
    if (!result) return [];
    return result.findings.filter((f) => {
      if (filter.severity && f.risk.band !== filter.severity) return false;
      if (filter.status && f.status !== filter.status) return false;
      if (filter.scenarioId && !f.scenarioIds.includes(filter.scenarioId)) return false;
      return true;
    });
  }

  async getFinding(workspaceId: string, findingId: string): Promise<FindingDetail | undefined> {
    const result = await this.getScanResult(workspaceId);
    const finding = result?.findings.find((f) => f.id === findingId);
    if (!result || !finding) return undefined;
    return {
      finding,
      evidence: result.evidence.filter((e) => e.findingId === findingId),
      remediation: result.remediationTasks.find((t) => t.id === finding.remediationTaskId),
    };
  }

  async updateFinding(
    workspaceId: string,
    findingId: string,
    patch: { status?: FindingStatus; applyFix?: boolean },
  ): Promise<Finding | undefined> {
    const status: FindingStatus | undefined = patch.applyFix ? "resolved" : patch.status;
    if (status) {
      await this.db
        .update(findingsTable)
        .set({ status, updatedAt: nowIso() })
        .where(and(eq(findingsTable.workspaceId, workspaceId), eq(findingsTable.id, findingId)));
    }
    if (patch.applyFix) {
      const [f] = await this.db
        .select({ remId: findingsTable.remediationTaskId })
        .from(findingsTable)
        .where(and(eq(findingsTable.workspaceId, workspaceId), eq(findingsTable.id, findingId)));
      if (f?.remId) {
        await this.db
          .update(remediationTasks)
          .set({ status: "done", fixVerified: true, updatedAt: nowIso() })
          .where(eq(remediationTasks.id, f.remId));
      }
    }
    return (await this.getFinding(workspaceId, findingId))?.finding;
  }

  async createReport(workspaceId: string, format: ReportFormat): Promise<Report> {
    const graph = await this.getGraph(workspaceId);
    const result = await this.getScanResult(workspaceId);
    if (!graph || !result) throw Object.assign(new Error("run a scan before generating a report"), { statusCode: 409 });
    // Build the model first so the (env-gated) AI narrative can summarize it.
    // undefined by default => no change to rendered output; never affects scoring.
    const model = buildReportModel({
      workspace: graph.workspace,
      scanResult: result,
      scenarios: graph.scenarios,
      exposure: tenantExposureScore(result),
    });
    model.llmSummary = await generateLlmSummary(model);
    const report: Report = {
      id: `rep-${randomUUID()}`,
      workspaceId,
      generatedAt: result.generatedAt,
      format,
      scenarioRunIds: result.scenarioRuns.map((r) => r.id),
      findingIds: result.findings.map((f) => f.id),
      llmSummary: model.llmSummary,
    };
    await this.db.insert(reportsTable).values({
      id: report.id,
      workspaceId,
      format,
      scenarioRunIds: report.scenarioRunIds,
      findingIds: report.findingIds,
      llmSummary: report.llmSummary,
    });
    return report;
  }

  async getReport(workspaceId: string, reportId: string): Promise<Report | undefined> {
    const [r] = await this.db
      .select()
      .from(reportsTable)
      .where(and(eq(reportsTable.workspaceId, workspaceId), eq(reportsTable.id, reportId)));
    return r
      ? {
          id: r.id,
          workspaceId: r.workspaceId,
          generatedAt: r.generatedAt,
          format: r.format as ReportFormat,
          scenarioRunIds: r.scenarioRunIds,
          findingIds: r.findingIds,
          llmSummary: r.llmSummary ?? undefined,
          artifactUrl: r.artifactUrl ?? undefined,
        }
      : undefined;
  }

  async setReportArtifactUrl(workspaceId: string, reportId: string, url: string): Promise<void> {
    await this.db
      .update(reportsTable)
      .set({ artifactUrl: url })
      .where(and(eq(reportsTable.workspaceId, workspaceId), eq(reportsTable.id, reportId)));
  }

  async getReportContent(workspaceId: string, reportId: string): Promise<ReportContent | undefined> {
    const report = await this.getReport(workspaceId, reportId);
    const graph = await this.getGraph(workspaceId);
    const result = await this.getScanResult(workspaceId);
    if (!report || !graph || !result) return undefined;
    const model = buildReportModel({
      workspace: graph.workspace,
      scanResult: result,
      scenarios: graph.scenarios,
      exposure: tenantExposureScore(result),
    });
    // Reuse the narrative computed at creation time (env-gated; undefined by default).
    model.llmSummary = report.llmSummary;
    const content = report.format === "html" ? renderHtml(model) : renderMarkdown(model);
    const ext = report.format === "html" ? "html" : "md";
    return { format: report.format, content, filename: `copilot-exposure-report-${reportId}.${ext}` };
  }

  // ── Schedules ──────────────────────────────────────────────
  private toSchedule(r: typeof schedulesTable.$inferSelect): Schedule {
    return {
      id: r.id,
      workspaceId: r.workspaceId,
      name: r.name,
      action: r.action as ScheduleAction,
      cadenceMinutes: r.cadenceMinutes,
      enabled: r.enabled,
      lastRunAt: r.lastRunAt ?? undefined,
      nextRunAt: r.nextRunAt,
      createdAt: r.createdAt,
    };
  }

  async createSchedule(workspaceId: string, input: CreateScheduleInput): Promise<Schedule> {
    await this.assertWorkspace(workspaceId);
    const now = nowIso();
    const row = {
      id: `sch-${randomUUID()}`,
      workspaceId,
      name: input.name,
      action: input.action ?? "scan",
      cadenceMinutes: input.cadenceMinutes,
      enabled: true,
      nextRunAt: input.nextRunAt ?? addMinutes(now, input.cadenceMinutes),
      createdAt: now,
    };
    await this.db.insert(schedulesTable).values(row);
    const [created] = await this.db.select().from(schedulesTable).where(eq(schedulesTable.id, row.id));
    return this.toSchedule(created!);
  }

  async listSchedules(workspaceId: string): Promise<Schedule[]> {
    const rows = await this.db
      .select()
      .from(schedulesTable)
      .where(eq(schedulesTable.workspaceId, workspaceId))
      .orderBy(asc(schedulesTable.createdAt));
    return rows.map((r) => this.toSchedule(r));
  }

  async updateSchedule(
    workspaceId: string,
    scheduleId: string,
    patch: UpdateScheduleInput,
  ): Promise<Schedule | undefined> {
    const set: Partial<typeof schedulesTable.$inferInsert> = {};
    if (patch.name !== undefined) set.name = patch.name;
    if (patch.cadenceMinutes !== undefined) set.cadenceMinutes = patch.cadenceMinutes;
    if (patch.enabled !== undefined) set.enabled = patch.enabled;
    if (patch.nextRunAt !== undefined) set.nextRunAt = patch.nextRunAt;
    if (Object.keys(set).length > 0) {
      await this.db
        .update(schedulesTable)
        .set(set)
        .where(and(eq(schedulesTable.workspaceId, workspaceId), eq(schedulesTable.id, scheduleId)));
    }
    const [row] = await this.db
      .select()
      .from(schedulesTable)
      .where(and(eq(schedulesTable.workspaceId, workspaceId), eq(schedulesTable.id, scheduleId)));
    return row ? this.toSchedule(row) : undefined;
  }

  async deleteSchedule(workspaceId: string, scheduleId: string): Promise<boolean> {
    const res = await this.db
      .delete(schedulesTable)
      .where(and(eq(schedulesTable.workspaceId, workspaceId), eq(schedulesTable.id, scheduleId)))
      .returning({ id: schedulesTable.id });
    return res.length > 0;
  }

  async dueSchedules(now: string): Promise<Schedule[]> {
    const rows = await this.db
      .select()
      .from(schedulesTable)
      .where(and(eq(schedulesTable.enabled, true), lte(schedulesTable.nextRunAt, now)))
      .orderBy(asc(schedulesTable.nextRunAt), asc(schedulesTable.id));
    return rows.map((r) => this.toSchedule(r));
  }

  async markScheduleRan(scheduleId: string, ranAt: string, nextRunAt: string): Promise<void> {
    await this.db
      .update(schedulesTable)
      .set({ lastRunAt: ranAt, nextRunAt })
      .where(eq(schedulesTable.id, scheduleId));
  }

  async listAudit(workspaceId: string): Promise<AuditEvent[]> {
    const rows = await this.db.select().from(auditEvents).where(eq(auditEvents.workspaceId, workspaceId));
    return rows.map((r) => ({
      id: r.id,
      workspaceId: r.workspaceId ?? undefined,
      at: r.at,
      actor: r.actor,
      action: r.action,
      targetType: r.targetType ?? undefined,
      targetId: r.targetId ?? undefined,
      detail: r.detail ?? undefined,
    }));
  }

  async logAudit(event: Omit<AuditEvent, "id" | "at"> & { at?: string }): Promise<AuditEvent> {
    const full: AuditEvent = { id: `aud-${randomUUID()}`, at: event.at ?? nowIso(), ...event };
    await this.db.insert(auditEvents).values({
      id: full.id,
      workspaceId: full.workspaceId,
      at: full.at,
      actor: full.actor,
      action: full.action,
      targetType: full.targetType,
      targetId: full.targetId,
      detail: full.detail,
    });
    return full;
  }
}

/** Helper used by the worker too: enqueue a background job. */
export async function enqueueJob(
  db: Database,
  workspaceId: string,
  type: string,
  payload: Record<string, unknown> = {},
): Promise<string> {
  const id = `job-${randomUUID()}`;
  await db.insert(jobs).values({ id, workspaceId, type, payload });
  return id;
}
