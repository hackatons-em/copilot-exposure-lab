import type {
  AuditEvent,
  ControlRef,
  EvidenceItem,
  Finding,
  FindingStatus,
  RemediationPlan,
  RemediationSimulation,
  RemediationTask,
  Report,
  ReportFormat,
  Resource,
  Scenario,
  ScenarioRun,
  TenantConnection,
  ThreatMapping,
  ThreatTechnique,
  Workspace,
} from "@cel/types";
import { API_KEY, API_URL, WORKSPACE_ID } from "./config";

/**
 * Typed client for the Copilot Exposure Lab REST API.
 *
 * All calls are made client-side (the app never fetches at build time), so the
 * API does not need to be running for `next build` to succeed.
 */

export class ApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** Shape returned by POST /scans. */
export interface ScanRunSummary {
  scanRunId: string;
  findingCount: number;
  bands: Record<string, number>;
  generatedAt: string;
}

/** One matched sensitivity signal (why a resource scored sensitive). */
export interface SensitivitySignal {
  signal: string;
  weight: number;
  matchedIn: string;
  sourceObjectId: string;
}

/** Deterministic sensitivity explanation for the finding's resource. */
export interface SensitivityExplanation {
  signals: SensitivitySignal[];
  rawScore: number;
}

/** Shape returned by GET /findings/:id. */
export interface FindingDetail {
  finding: Finding;
  evidence: EvidenceItem[];
  remediation?: RemediationTask;
  /** Why the resource scored sensitive — classifier signals (may be absent). */
  sensitivity?: SensitivityExplanation;
}

/** Shape returned by POST /connections/demo/seed. */
export interface SeedResult {
  connection: TenantConnection;
  counts: Record<string, number>;
}

/** Multi-system connectors that normalize into the same TenantGraph. */
export type ConnectableSystem = "google-workspace" | "slack" | "salesforce" | "multi-system";

/** Body for POST /connections/microsoft/start. The client secret is sent once, never stored. */
export interface ConnectMicrosoftBody {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  tenantName?: string;
}

/**
 * Shape returned by POST /connections/microsoft/start.
 * `counts` keys are `principals`, `resources`, `grants`, `scenarios`.
 */
export interface ConnectMicrosoftResult {
  connection: TenantConnection;
  counts: Record<string, number>;
}

export interface FindingFilter {
  severity?: string;
  status?: string;
  scenarioId?: string;
}

/** One available export format, as returned by GET /exports. */
export interface ExportFormatInfo {
  format: string;
  label: string;
  description: string;
}

/** One thing M365 Copilot could surface to an actor (GET /retrieval). */
export interface RetrievalItem {
  resourceId: string;
  name: string;
  sensitivity: number;
  reachable: boolean;
  via: string;
  score: number;
  topSignals: string[];
}

/** Shape returned by GET /retrieval. */
export interface RetrievalResult {
  actorId: string;
  actorName: string;
  items: RetrievalItem[];
}

/** One sensitive document Copilot would ground on for an actor (POST /copilot-sim). */
export interface CopilotCitation {
  resourceId: string;
  name: string;
  via: string;
  sensitivity: number;
}

/** Shape returned by POST /copilot-sim — a simulated, deterministic Copilot answer. */
export interface CopilotAnswer {
  actorId: string;
  actorName: string;
  prompt: string;
  answer: string;
  citations: CopilotCitation[];
  exposed: boolean;
}

/** Where the tenant score sits vs a synthetic baseline of comparable tenants. */
export interface PeerPercentile {
  worseThanPct: number;
  sampleSize: number;
  synthetic: boolean;
}

/** Headline tenant exposure (GET /exposure). */
export interface TenantExposure {
  score: number;
  band: string;
  findingCount: number;
  bands: Record<string, number>;
  drivers: string[];
  /** Peer percentile context (synthetic baseline). Optional for older payloads. */
  peer?: PeerPercentile;
}

/** One exposure snapshot in the trend (GET /scan-history). */
export interface ScanSnapshot {
  id: string;
  takenAt: string;
  exposureScore: number;
  band: string;
  bands: Record<string, number>;
  findingCount: number;
}

/** Change between the two most recent snapshots. */
export interface ExposureDrift {
  scoreDelta: number;
  criticalDelta: number;
  newFindingIds: string[];
  resolvedFindingIds: string[];
  previousAt?: string;
}

export interface ScanHistory {
  snapshots: ScanSnapshot[];
  drift: ExposureDrift | null;
}

/** What a schedule enqueues when it fires. */
export type ScheduleAction = "scan" | "report";

/** A recurring trigger that enqueues a scan/report job for the workspace. */
export interface Schedule {
  id: string;
  workspaceId: string;
  name: string;
  action: ScheduleAction;
  cadenceMinutes: number;
  enabled: boolean;
  lastRunAt?: string;
  nextRunAt: string;
  createdAt: string;
}

/** Body for POST /schedules. */
export interface CreateScheduleBody {
  name: string;
  action?: ScheduleAction;
  cadenceMinutes: number;
}

/** Body for PATCH /schedules/:id. */
export interface UpdateScheduleBody {
  name?: string;
  cadenceMinutes?: number;
  enabled?: boolean;
}

/** A node in the exposure graph (GET /graph) — a principal, resource, link, or agent. */
export interface ExposureGraphNode {
  id: string;
  type: "user" | "group" | "link" | "file" | "site" | "folder" | "drive" | "agent" | "connector" | "permission" | "action";
  label: string;
  risk: "critical" | "high" | "medium" | "low" | "info";
  findingIds: string[];
}

/** A directed edge in the exposure graph — one hop in an exposure path. */
export interface ExposureGraphEdge {
  id: string;
  source: string;
  target: string;
  relation: string;
  risk: "critical" | "high" | "medium" | "low" | "info";
  findingIds: string[];
}

/** Union of every finding's exposure path: who can reach what, and how (GET /graph). */
export interface ExposureGraphModel {
  nodes: ExposureGraphNode[];
  edges: ExposureGraphEdge[];
}

/** One rule's row in the threat-model matrix (GET /threat-model). */
export interface ThreatModelRow {
  ruleId: string;
  title: string;
  threat: ThreatMapping;
}

/** The deterministic rules × MITRE ATT&CK × controls matrix (GET /threat-model). */
export interface ThreatModel {
  rows: ThreatModelRow[];
  techniques: ThreatTechnique[];
  controls: ControlRef[];
}

/** The exact advisory remediation script for a finding (GET /findings/:id/fix-script). */
export interface FixScript {
  language: "powershell";
  tooling: string;
  script: string;
  caveats: string[];
}

const ws = WORKSPACE_ID;

/**
 * Auth header sent on every request when NEXT_PUBLIC_API_KEY is set. Empty when
 * unset, so against the open demo nothing is sent and behavior is unchanged.
 */
const AUTH_HEADER: Record<string, string> = API_KEY ? { authorization: `Bearer ${API_KEY}` } : {};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
        ...AUTH_HEADER,
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "network error";
    throw new ApiError(0, `Could not reach the API at ${API_URL}. ${detail}`);
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      // non-JSON error body — keep the generic message
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

function qs(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(
    (entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].length > 0,
  );
  if (entries.length === 0) return "";
  const search = new URLSearchParams(entries);
  return `?${search.toString()}`;
}

function filterToParams(filter: FindingFilter): Record<string, string | undefined> {
  return { severity: filter.severity, status: filter.status, scenarioId: filter.scenarioId };
}

export const api = {
  workspaceId: ws,
  apiUrl: API_URL,

  getWorkspace(): Promise<Workspace> {
    return request<Workspace>(`/api/workspaces/${ws}`);
  },

  seedDemo(): Promise<SeedResult> {
    return request<SeedResult>(`/api/workspaces/${ws}/connections/demo/seed`, { method: "POST" });
  },

  /**
   * Connect another system (Google Workspace, Slack, Salesforce, or the combined
   * multi-system demo). The same deterministic engine then scans it unchanged.
   */
  connectSystem(system: ConnectableSystem): Promise<SeedResult> {
    return request<SeedResult>(`/api/workspaces/${ws}/connections/${system}/seed`, { method: "POST" });
  },

  /**
   * Connect a live Microsoft 365 tenant. The client secret is sent once to
   * acquire a token and is never stored or displayed back.
   */
  connectMicrosoft(body: ConnectMicrosoftBody): Promise<ConnectMicrosoftResult> {
    return request<ConnectMicrosoftResult>(`/api/workspaces/${ws}/connections/microsoft/start`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  listConnections(): Promise<TenantConnection[]> {
    return request<TenantConnection[]>(`/api/workspaces/${ws}/connections`);
  },

  listResources(): Promise<Resource[]> {
    return request<Resource[]>(`/api/workspaces/${ws}/resources`);
  },

  listScenarios(): Promise<Scenario[]> {
    return request<Scenario[]>(`/api/workspaces/${ws}/scenarios`);
  },

  /** The rules × MITRE ATT&CK × control-framework matrix (deterministic, by rule). */
  getThreatModel(): Promise<ThreatModel> {
    return request<ThreatModel>(`/api/workspaces/${ws}/threat-model`);
  },

  /** Simulate what M365 Copilot could surface to an actor (defaults to the normal-employee persona). */
  getRetrieval(actorId?: string): Promise<RetrievalResult> {
    return request<RetrievalResult>(`/api/workspaces/${ws}/retrieval${qs({ actorId })}`);
  },

  /**
   * Simulate a Copilot answer to a prompt as a given actor. Deterministic and
   * metadata-only: no document content is read and no LLM is called. When
   * `actorId` is omitted the API defaults to the normal-employee persona.
   */
  copilotSim(prompt: string, actorId?: string): Promise<CopilotAnswer> {
    return request<CopilotAnswer>(`/api/workspaces/${ws}/copilot-sim`, {
      method: "POST",
      body: JSON.stringify(actorId ? { actorId, prompt } : { prompt }),
    });
  },

  /** Headline tenant exposure score (deterministic aggregate of the latest scan). */
  getExposure(): Promise<TenantExposure> {
    return request<TenantExposure>(`/api/workspaces/${ws}/exposure`);
  },

  /** Deterministic "fix these first" plan — ordered by score-drop per unit effort. */
  getRemediationPlan(): Promise<RemediationPlan> {
    return request<RemediationPlan>(`/api/workspaces/${ws}/remediation-plan`);
  },

  /** What-if: project the tenant score if the given findings were fixed. */
  simulateRemediation(findingIds: string[]): Promise<RemediationSimulation> {
    return request<RemediationSimulation>(`/api/workspaces/${ws}/simulate-remediation`, {
      method: "POST",
      body: JSON.stringify({ findingIds }),
    });
  },

  /**
   * The exposure graph — the union of every finding's exposure path as one
   * picture (who can reach what, and how). Empty when there is no scan yet.
   */
  getGraph(): Promise<ExposureGraphModel> {
    return request<ExposureGraphModel>(`/api/workspaces/${ws}/graph`);
  },

  /** Exposure snapshots over time + drift since the last scan. */
  getScanHistory(): Promise<ScanHistory> {
    return request<ScanHistory>(`/api/workspaces/${ws}/scan-history`);
  },

  runScan(actorId?: string): Promise<ScanRunSummary> {
    return request<ScanRunSummary>(`/api/workspaces/${ws}/scans`, {
      method: "POST",
      body: JSON.stringify(actorId ? { actorId } : {}),
    });
  },

  runScenario(scenarioKeyOrId: string): Promise<ScenarioRun> {
    return request<ScenarioRun>(`/api/workspaces/${ws}/scenarios/${encodeURIComponent(scenarioKeyOrId)}/run`);
  },

  listFindings(filter?: FindingFilter): Promise<Finding[]> {
    return request<Finding[]>(`/api/workspaces/${ws}/findings${qs(filterToParams(filter ?? {}))}`);
  },

  getFinding(findingId: string): Promise<FindingDetail> {
    return request<FindingDetail>(`/api/workspaces/${ws}/findings/${encodeURIComponent(findingId)}`);
  },

  /** The exact advisory Microsoft fix script for a finding (generated, never executed). */
  getFixScript(findingId: string): Promise<FixScript> {
    return request<FixScript>(`/api/workspaces/${ws}/findings/${encodeURIComponent(findingId)}/fix-script`);
  },

  updateFinding(findingId: string, patch: { status?: FindingStatus; applyFix?: boolean }): Promise<Finding> {
    return request<Finding>(`/api/workspaces/${ws}/findings/${encodeURIComponent(findingId)}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
  },

  createReport(format: ReportFormat): Promise<Report> {
    return request<Report>(`/api/workspaces/${ws}/reports`, {
      method: "POST",
      body: JSON.stringify({ format }),
    });
  },

  reportDownloadUrl(reportId: string): string {
    return `${API_URL}/api/workspaces/${ws}/reports/${encodeURIComponent(reportId)}/download`;
  },

  listExports(): Promise<ExportFormatInfo[]> {
    return request<ExportFormatInfo[]>(`/api/workspaces/${ws}/exports`);
  },

  /** Full download URL for an export format — generated on demand from the latest scan. */
  exportUrl(format: string): string {
    return `${API_URL}/api/workspaces/${ws}/exports/${encodeURIComponent(format)}`;
  },

  listAudit(): Promise<AuditEvent[]> {
    return request<AuditEvent[]>(`/api/workspaces/${ws}/audit-events`);
  },

  listSchedules(): Promise<Schedule[]> {
    return request<Schedule[]>(`/api/workspaces/${ws}/schedules`);
  },

  createSchedule(body: CreateScheduleBody): Promise<Schedule> {
    return request<Schedule>(`/api/workspaces/${ws}/schedules`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  updateSchedule(scheduleId: string, patch: UpdateScheduleBody): Promise<Schedule> {
    return request<Schedule>(`/api/workspaces/${ws}/schedules/${encodeURIComponent(scheduleId)}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
  },

  deleteSchedule(scheduleId: string): Promise<void> {
    return request<void>(`/api/workspaces/${ws}/schedules/${encodeURIComponent(scheduleId)}`, {
      method: "DELETE",
    });
  },
};
