import type {
  AuditEvent,
  EvidenceItem,
  Finding,
  FindingStatus,
  RemediationTask,
  Resource,
  ScanResult,
  Scenario,
  ScenarioRun,
  TenantConnection,
  Workspace,
} from "@cel/types";

export interface FindingDetail {
  finding: Finding;
  evidence: EvidenceItem[];
  remediation?: RemediationTask;
}

export interface FindingFilter {
  severity?: string;
  status?: string;
  scenarioId?: string;
}

export interface ScanRunSummary {
  scanRunId: string;
  findingCount: number;
  bands: Record<string, number>;
  generatedAt: string;
}

/**
 * Persistence + workflow boundary for the API. Two implementations:
 * MemoryStore (tests + demo) and DrizzleStore (Postgres). Routes only see this.
 */
export interface Store {
  createWorkspace(input: { id?: string; name: string }): Promise<Workspace>;
  listWorkspaces(): Promise<Workspace[]>;
  getWorkspace(id: string): Promise<Workspace | undefined>;
  deleteWorkspace(id: string): Promise<boolean>;

  /** Load the bundled Acme demo company into a workspace. */
  seedDemo(workspaceId: string): Promise<{ connection: TenantConnection; counts: Record<string, number> }>;
  listConnections(workspaceId: string): Promise<TenantConnection[]>;
  listResources(workspaceId: string): Promise<Resource[]>;
  listScenarios(workspaceId: string): Promise<Scenario[]>;

  /** Run the deterministic engine over the workspace's stored graph and persist results. */
  runScan(workspaceId: string, opts?: { actorId?: string }): Promise<ScanRunSummary>;
  getScenarioRun(workspaceId: string, scenarioIdOrKey: string): Promise<ScenarioRun | undefined>;

  listFindings(workspaceId: string, filter?: FindingFilter): Promise<Finding[]>;
  getFinding(workspaceId: string, findingId: string): Promise<FindingDetail | undefined>;
  updateFinding(
    workspaceId: string,
    findingId: string,
    patch: { status?: FindingStatus; applyFix?: boolean },
  ): Promise<Finding | undefined>;

  getScanResult(workspaceId: string): Promise<ScanResult | undefined>;

  listAudit(workspaceId: string): Promise<AuditEvent[]>;
  logAudit(event: Omit<AuditEvent, "id" | "at"> & { at?: string }): Promise<AuditEvent>;
}
