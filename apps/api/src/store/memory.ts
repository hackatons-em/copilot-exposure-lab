import { randomUUID } from "node:crypto";
import { type GraphProvider, SeedGraphClient } from "@cel/graph-client";
import { buildReportModel, renderHtml, renderMarkdown } from "@cel/report";
import { scan } from "@cel/rule-engine";
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
import type { FindingDetail, FindingFilter, ReportContent, ScanRunSummary, Store } from "./types.js";

interface WorkspaceState {
  workspace: Workspace;
  connections: TenantConnection[];
  graph?: TenantGraph;
  result?: ScanResult;
  appliedFixes: Set<string>;
  audit: AuditEvent[];
  reports: Map<string, { report: Report; content: string }>;
}

const nowIso = (): string => new Date().toISOString();

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
    });
    const content = format === "html" ? renderHtml(model) : renderMarkdown(model);
    const report: Report = {
      id: `rep-${randomUUID()}`,
      workspaceId,
      generatedAt: state.result.generatedAt,
      format,
      scenarioRunIds: state.result.scenarioRuns.map((r) => r.id),
      findingIds: state.result.findings.map((f) => f.id),
    };
    state.reports.set(report.id, { report, content });
    return report;
  }

  async getReport(workspaceId: string, reportId: string): Promise<Report | undefined> {
    return this.require(workspaceId).reports.get(reportId)?.report;
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
