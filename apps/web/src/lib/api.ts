import type {
  AuditEvent,
  EvidenceItem,
  Finding,
  FindingStatus,
  RemediationTask,
  Report,
  ReportFormat,
  Resource,
  Scenario,
  ScenarioRun,
  TenantConnection,
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

/** Shape returned by GET /findings/:id. */
export interface FindingDetail {
  finding: Finding;
  evidence: EvidenceItem[];
  remediation?: RemediationTask;
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

/** Headline tenant exposure (GET /exposure). */
export interface TenantExposure {
  score: number;
  band: string;
  findingCount: number;
  bands: Record<string, number>;
  drivers: string[];
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

  /** Simulate what M365 Copilot could surface to an actor (defaults to the normal-employee persona). */
  getRetrieval(actorId?: string): Promise<RetrievalResult> {
    return request<RetrievalResult>(`/api/workspaces/${ws}/retrieval${qs({ actorId })}`);
  },

  /** Headline tenant exposure score (deterministic aggregate of the latest scan). */
  getExposure(): Promise<TenantExposure> {
    return request<TenantExposure>(`/api/workspaces/${ws}/exposure`);
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
