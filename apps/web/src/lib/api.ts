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
import { API_URL, WORKSPACE_ID } from "./config";

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

export interface FindingFilter {
  severity?: string;
  status?: string;
  scenarioId?: string;
}

const ws = WORKSPACE_ID;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
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

  listConnections(): Promise<TenantConnection[]> {
    return request<TenantConnection[]>(`/api/workspaces/${ws}/connections`);
  },

  listResources(): Promise<Resource[]> {
    return request<Resource[]>(`/api/workspaces/${ws}/resources`);
  },

  listScenarios(): Promise<Scenario[]> {
    return request<Scenario[]>(`/api/workspaces/${ws}/scenarios`);
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

  listAudit(): Promise<AuditEvent[]> {
    return request<AuditEvent[]>(`/api/workspaces/${ws}/audit-events`);
  },
};
