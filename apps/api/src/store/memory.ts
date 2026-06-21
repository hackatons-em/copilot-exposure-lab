import { randomUUID } from "node:crypto";
import { type GraphProvider, SeedGraphClient } from "@cel/graph-client";
import { buildReportModel, generateLlmSummary, renderHtml, renderMarkdown } from "@cel/report";
import { buildRemediationPlan, scan, tenantExposureScore } from "@cel/rule-engine";
import type {
  AuditEvent,
  Band,
  Finding,
  FindingStatus,
  Report,
  ReportFormat,
  ScanResult,
  ScenarioRun,
  TenantConnection,
  TenantGraph,
  Workspace,
} from "@cel/types";
import type {
  CreateScheduleInput,
  ExposureDrift,
  FindingDetail,
  FindingFilter,
  ReportContent,
  ScanRunSummary,
  ScanSnapshot,
  Schedule,
  Store,
  UpdateScheduleInput,
} from "./types.js";
import { computeDrift } from "./drift.js";

interface WorkspaceState {
  workspace: Workspace;
  connections: TenantConnection[];
  graph?: TenantGraph;
  result?: ScanResult;
  appliedFixes: Set<string>;
  audit: AuditEvent[];
  reports: Map<string, { report: Report; content: string }>;
  schedules: Map<string, Schedule>;
  snapshots: ScanSnapshot[];
}

const nowIso = (): string => new Date().toISOString();

/** now + minutes, as an ISO string. */
const addMinutes = (iso: string, minutes: number): string =>
  new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();

/** In-memory Store — backs tests and a database-free demo. */
export class MemoryStore implements Store {
  private readonly ws = new Map<string, WorkspaceState>();

  private require(workspaceId: string): WorkspaceState {
    const s = this.ws.get(workspaceId);
    if (!s) throw Object.assign(new Error("workspace not found"), { statusCode: 404 });
    return s;
  }

  async createWorkspace(input: { id?: string; name: string }): Promise<Workspace> {
    const workspace: Workspace = { id: input.id ?? `ws-${randomUUID()}`, name: input.name, createdAt: nowIso() };
    this.ws.set(workspace.id, {
      workspace,
      connections: [],
      appliedFixes: new Set(),
      audit: [],
      reports: new Map(),
      schedules: new Map(),
      snapshots: [],
    });
    return workspace;
  }

  async listWorkspaces(): Promise<Workspace[]> {
    return [...this.ws.values()].map((s) => s.workspace);
  }

  async getWorkspace(id: string): Promise<Workspace | undefined> {
    return this.ws.get(id)?.workspace;
  }

  async deleteWorkspace(id: string): Promise<boolean> {
    return this.ws.delete(id);
  }

  async ingestGraph(
    workspaceId: string,
    provider: GraphProvider,
  ): Promise<{ connection: TenantConnection; counts: Record<string, number> }> {
    const state = this.require(workspaceId);
    const loaded = await provider.loadTenantGraph();
    const graph: TenantGraph = {
      ...loaded,
      workspace: { id: workspaceId, name: state.workspace.name, createdAt: state.workspace.createdAt },
      connection: { ...loaded.connection, id: `conn-${workspaceId}`, workspaceId },
    };
    state.graph = graph;
    state.connections = [graph.connection];
    state.result = undefined;
    state.appliedFixes.clear();
    return {
      connection: graph.connection,
      counts: {
        principals: graph.principals.length,
        resources: graph.resources.length,
        grants: graph.grants.length,
        scenarios: graph.scenarios.length,
      },
    };
  }

  async seedDemo(workspaceId: string): Promise<{ connection: TenantConnection; counts: Record<string, number> }> {
    return this.ingestGraph(workspaceId, new SeedGraphClient());
  }

  async listConnections(workspaceId: string): Promise<TenantConnection[]> {
    return this.require(workspaceId).connections;
  }

  async listResources(workspaceId: string) {
    return this.require(workspaceId).graph?.resources ?? [];
  }

  async listScenarios(workspaceId: string) {
    return this.require(workspaceId).graph?.scenarios ?? [];
  }

  async getTenantGraph(workspaceId: string): Promise<TenantGraph | undefined> {
    return this.require(workspaceId).graph;
  }

  async runScan(workspaceId: string, opts: { actorId?: string } = {}): Promise<ScanRunSummary> {
    const state = this.require(workspaceId);
    if (!state.graph) throw Object.assign(new Error("no connection — seed demo data first"), { statusCode: 409 });
    const result = scan(state.graph, {
      now: nowIso(),
      actorId: opts.actorId,
      appliedFixes: [...state.appliedFixes],
    });
    state.result = result;
    const bands: Record<string, number> = {};
    for (const f of result.findings) bands[f.risk.band] = (bands[f.risk.band] ?? 0) + 1;
    const exposure = tenantExposureScore(result);
    state.snapshots.push({
      id: `snap-${randomUUID()}`,
      workspaceId,
      takenAt: result.generatedAt,
      exposureScore: exposure.score,
      band: exposure.band,
      bands: exposure.bands,
      findingCount: exposure.findingCount,
      fingerprints: result.findings.filter((f) => f.status !== "resolved").map((f) => f.id),
    });
    return {
      scanRunId: `scan-${randomUUID()}`,
      findingCount: result.findings.length,
      bands,
      generatedAt: result.generatedAt,
    };
  }

  async getScanResult(workspaceId: string): Promise<ScanResult | undefined> {
    return this.require(workspaceId).result;
  }

  async listSnapshots(workspaceId: string, limit = 30): Promise<ScanSnapshot[]> {
    return [...this.require(workspaceId).snapshots].reverse().slice(0, limit);
  }

  async getDrift(workspaceId: string): Promise<ExposureDrift | undefined> {
    const snaps = this.require(workspaceId).snapshots;
    if (snaps.length < 2) return undefined;
    return computeDrift(snaps[snaps.length - 1]!, snaps[snaps.length - 2]!);
  }

  async getScenarioRun(workspaceId: string, scenarioIdOrKey: string): Promise<ScenarioRun | undefined> {
    const { graph, result } = this.require(workspaceId);
    if (!graph || !result) return undefined;
    const scenario = graph.scenarios.find((s) => s.id === scenarioIdOrKey || s.key === scenarioIdOrKey);
    if (!scenario) return undefined;
    return result.scenarioRuns.find((r) => r.scenarioId === scenario.id);
  }

  async listFindings(workspaceId: string, filter: FindingFilter = {}): Promise<Finding[]> {
    const result = this.require(workspaceId).result;
    if (!result) return [];
    return result.findings.filter((f) => {
      if (filter.severity && f.risk.band !== filter.severity) return false;
      if (filter.status && f.status !== filter.status) return false;
      if (filter.scenarioId && !f.scenarioIds.includes(filter.scenarioId)) return false;
      return true;
    });
  }

  async getFinding(workspaceId: string, findingId: string): Promise<FindingDetail | undefined> {
    const result = this.require(workspaceId).result;
    if (!result) return undefined;
    const finding = result.findings.find((f) => f.id === findingId);
    if (!finding) return undefined;
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
    const state = this.require(workspaceId);
    const finding = state.result?.findings.find((f) => f.id === findingId);
    if (!finding || !state.result) return undefined;
    if (patch.applyFix) {
      state.appliedFixes.add(findingId);
      finding.status = "resolved";
      const task = state.result.remediationTasks.find((t) => t.id === finding.remediationTaskId);
      if (task) {
        task.status = "done";
        task.fixVerified = true;
      }
    }
    if (patch.status) finding.status = patch.status;
    return finding;
  }

  async createReport(workspaceId: string, format: ReportFormat): Promise<Report> {
    const state = this.require(workspaceId);
    if (!state.graph || !state.result) {
      throw Object.assign(new Error("run a scan before generating a report"), { statusCode: 409 });
    }
    const model = buildReportModel({
      workspace: state.workspace,
      scanResult: state.result,
      scenarios: state.graph.scenarios,
      exposure: tenantExposureScore(state.result),
      remediationPlan: buildRemediationPlan(state.result),
    });
    // Env-gated AI narrative — undefined by default (deterministic), never affects scoring.
    model.llmSummary = await generateLlmSummary(model);
    const content = format === "html" ? renderHtml(model) : renderMarkdown(model);
    const report: Report = {
      id: `rep-${randomUUID()}`,
      workspaceId,
      generatedAt: state.result.generatedAt,
      format,
      scenarioRunIds: state.result.scenarioRuns.map((r) => r.id),
      findingIds: state.result.findings.map((f) => f.id),
      llmSummary: model.llmSummary,
    };
    state.reports.set(report.id, { report, content });
    return report;
  }

  async getReport(workspaceId: string, reportId: string): Promise<Report | undefined> {
    return this.require(workspaceId).reports.get(reportId)?.report;
  }

  async setReportArtifactUrl(workspaceId: string, reportId: string, url: string): Promise<void> {
    const entry = this.require(workspaceId).reports.get(reportId);
    if (entry) entry.report.artifactUrl = url;
  }

  async getReportContent(workspaceId: string, reportId: string): Promise<ReportContent | undefined> {
    const entry = this.require(workspaceId).reports.get(reportId);
    if (!entry) return undefined;
    const ext = entry.report.format === "html" ? "html" : "md";
    return {
      format: entry.report.format,
      content: entry.content,
      filename: `copilot-exposure-report-${reportId}.${ext}`,
    };
  }

  async createSchedule(workspaceId: string, input: CreateScheduleInput): Promise<Schedule> {
    const state = this.require(workspaceId);
    const now = nowIso();
    const schedule: Schedule = {
      id: `sch-${randomUUID()}`,
      workspaceId,
      name: input.name,
      action: input.action ?? "scan",
      cadenceMinutes: input.cadenceMinutes,
      enabled: true,
      nextRunAt: input.nextRunAt ?? addMinutes(now, input.cadenceMinutes),
      createdAt: now,
    };
    state.schedules.set(schedule.id, schedule);
    return { ...schedule };
  }

  async listSchedules(workspaceId: string): Promise<Schedule[]> {
    return [...this.require(workspaceId).schedules.values()]
      .map((s) => ({ ...s }))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async updateSchedule(
    workspaceId: string,
    scheduleId: string,
    patch: UpdateScheduleInput,
  ): Promise<Schedule | undefined> {
    const schedule = this.require(workspaceId).schedules.get(scheduleId);
    if (!schedule) return undefined;
    if (patch.name !== undefined) schedule.name = patch.name;
    if (patch.cadenceMinutes !== undefined) schedule.cadenceMinutes = patch.cadenceMinutes;
    if (patch.enabled !== undefined) schedule.enabled = patch.enabled;
    if (patch.nextRunAt !== undefined) schedule.nextRunAt = patch.nextRunAt;
    return { ...schedule };
  }

  async deleteSchedule(workspaceId: string, scheduleId: string): Promise<boolean> {
    return this.require(workspaceId).schedules.delete(scheduleId);
  }

  async dueSchedules(now: string): Promise<Schedule[]> {
    const due: Schedule[] = [];
    for (const state of this.ws.values()) {
      for (const s of state.schedules.values()) {
        if (s.enabled && s.nextRunAt <= now) due.push({ ...s });
      }
    }
    return due.sort((a, b) => a.nextRunAt.localeCompare(b.nextRunAt) || a.id.localeCompare(b.id));
  }

  async markScheduleRan(scheduleId: string, ranAt: string, nextRunAt: string): Promise<void> {
    for (const state of this.ws.values()) {
      const s = state.schedules.get(scheduleId);
      if (s) {
        s.lastRunAt = ranAt;
        s.nextRunAt = nextRunAt;
        return;
      }
    }
  }

  async listAudit(workspaceId: string): Promise<AuditEvent[]> {
    return this.require(workspaceId).audit;
  }

  async logAudit(event: Omit<AuditEvent, "id" | "at"> & { at?: string }): Promise<AuditEvent> {
    const full: AuditEvent = { id: `aud-${randomUUID()}`, at: event.at ?? nowIso(), ...event };
    if (event.workspaceId) this.ws.get(event.workspaceId)?.audit.push(full);
    return full;
  }
}

export type { Band };
