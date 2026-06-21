import type {
  Band,
  EstimatedEffort,
  EvidenceKind,
  FindingStatus,
  GrantVia,
  RemediationStatus,
  ReportFormat,
  ScoreComponentKey,
  SourceObjectType,
} from "./enums.js";

/**
 * Derived domain types — produced by the rule engine, never seeded.
 * Every Finding is reproducible from its evidence; every EvidenceItem points
 * at a concrete source object.
 */

/** One hop in an exposure path: principal -> group -> link -> resource. */
export interface PathStep {
  objectType: SourceObjectType;
  objectId: string;
  label: string;
  /** Relation to the next step: "member-of" | "granted-via-link" | "inherits-from" | "has-action" | "targets". */
  relation: string;
}

export interface ExposurePath {
  id: string;
  steps: PathStep[];
  via: GrantVia;
}

/** One weighted component of the deterministic 0-100 score. */
export interface ScoreComponent {
  key: ScoreComponentKey;
  /** Maximum points this component can contribute. */
  weight: number;
  /** Normalized observation, 0..1. */
  raw: number;
  /** weight * raw, rounded — the points actually contributed. */
  points: number;
}

export interface RiskScore {
  /** 0-100 integer. */
  total: number;
  band: Band;
  components: ScoreComponent[];
}

/** Mandatory: every evidence item carries a sourceObjectId. */
export interface EvidenceItem {
  id: string;
  findingId: string;
  kind: EvidenceKind;
  sourceObjectId: string;
  sourceObjectType: SourceObjectType;
  /** Factual statement, e.g. "Sharing link scope = org-wide". No opinions. */
  statement: string;
  /** Optional structured backing data. */
  data?: Record<string, unknown>;
  observedAt: string;
}

export interface RemediationTask {
  id: string;
  findingId: string;
  title: string;
  steps: string[];
  /** Microsoft-native control to use, e.g. "SharePoint sharing policy", "Purview label". */
  microsoftControl?: string;
  /** V1: the Graph call that would perform the fix. Never auto-executed in MVP. */
  graphActionHint?: string;
  estimatedEffort: EstimatedEffort;
  owner?: string;
  status: RemediationStatus;
  /** Set true after a rerun confirms the exposure path is gone (proof-of-fix). */
  fixVerified?: boolean;
}

export interface Finding {
  /** Deterministic fingerprint of (ruleId, resourceId, principal chain). */
  id: string;
  ruleId: string;
  title: string;
  resourceId: string;
  /** The actor/principal at the start of the exposure path, if applicable. */
  principalId?: string;
  risk: RiskScore;
  exposurePath?: ExposurePath;
  evidenceIds: string[];
  remediationTaskId?: string;
  scenarioIds: string[];
  status: FindingStatus;
  summary: string;
  businessImpact: string;
  createdAt: string;
}

export interface ScenarioRun {
  id: string;
  scenarioId: string;
  runAt: string;
  paths: ExposurePath[];
  findingIds: string[];
  /** Deterministic, factual one-paragraph summary. */
  summary: string;
}

export interface Report {
  id: string;
  workspaceId: string;
  generatedAt: string;
  format: ReportFormat;
  scenarioRunIds: string[];
  findingIds: string[];
  /** Optional, env-gated, clearly flagged. Never affects scoring. */
  llmSummary?: string;
}

export interface AuditEvent {
  id: string;
  workspaceId?: string;
  at: string;
  actor: string;
  /** e.g. "scan.run" | "finding.status.change" | "report.export". */
  action: string;
  targetType?: string;
  targetId?: string;
  detail?: Record<string, unknown>;
}

/** Output of a full scan over a tenant graph. */
export interface ScanResult {
  findings: Finding[];
  evidence: EvidenceItem[];
  remediationTasks: RemediationTask[];
  scenarioRuns: ScenarioRun[];
  generatedAt: string;
}
