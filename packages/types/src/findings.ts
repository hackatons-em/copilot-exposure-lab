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

/** A MITRE ATT&CK technique a finding maps to (the adversary behavior it enables). */
export interface ThreatTechnique {
  /** ATT&CK technique id, e.g. "T1530" or sub-technique "T1213.002". */
  id: string;
  name: string;
  /** ATT&CK tactic, e.g. "Collection", "Exfiltration", "Persistence". */
  tactic: string;
  /** Canonical MITRE reference URL. */
  url: string;
}

/** A control-framework reference the finding maps to (the safeguard that addresses it). */
export interface ControlRef {
  /** Framework, e.g. "NIST 800-53" or "CISA". */
  framework: string;
  /** Control id within the framework, e.g. "AC-6". */
  id: string;
  name: string;
}

/**
 * Threat-framework context for a finding: which adversary techniques the exposure
 * enables and which controls address it. Deterministic, keyed off the rule — never
 * generated. `techniques` may be empty for pure governance gaps (controls only).
 */
export interface ThreatMapping {
  techniques: ThreatTechnique[];
  controls: ControlRef[];
}

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
  /** MITRE ATT&CK techniques + control references this exposure maps to (deterministic, by rule). */
  threat: ThreatMapping;
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
  /** Where the rendered artifact was stored (e.g. a Blob URL), once generated. */
  artifactUrl?: string;
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

/** One sequenced step in a remediation plan — fixing this finding drops the tenant score. */
export interface RemediationStep {
  findingId: string;
  title: string;
  ruleId: string;
  band: Band;
  estimatedEffort: EstimatedEffort;
  /** Tenant exposure score before this step. */
  scoreBefore: number;
  /** Tenant exposure score after this step. */
  scoreAfter: number;
  /** Points this step removes. */
  scoreDelta: number;
  /** Cumulative points removed from the baseline through this step. */
  cumulativeDelta: number;
}

/**
 * A deterministic, sequenced "fix these first" plan: greedy marginal-gain ordering
 * of fixes by exposure-score reduction per unit of effort.
 */
export interface RemediationPlan {
  baselineScore: number;
  projectedScore: number;
  totalDelta: number;
  steps: RemediationStep[];
  /** How many candidate findings were evaluated (top-by-score cap). */
  candidatesConsidered: number;
  /** True if active findings exceeded the candidate cap (some weren't evaluated). */
  capped: boolean;
}

/** One row of the Copilot Studio agent governance inventory. */
export interface AgentSummary {
  id: string;
  name: string;
  ownerId?: string;
  ownerName: string;
  /** False when the owner is missing or a disabled/departed account (orphaned). */
  ownerActive: boolean;
  /** Declared agent actions, e.g. "mail.send", "external.connector". */
  actions: string[];
  connectors: string[];
  authMode?: string;
  publication?: string;
  /** Worst severity band among this agent's findings ("info" when it has none). */
  riskBand: Band;
  findingIds: string[];
  findingCount: number;
  /** True when the agent can send mail / call external or webhook/SQL connectors (egress path). */
  hasEgress: boolean;
}

/** A recommended access removal to cut an identity's over-exposure. */
export interface AccessRemoval {
  /** What to remove: a group membership, a sharing link, or a direct grant. */
  kind: "group" | "link" | "grant";
  /** The group id / link id / grant id to act on. */
  targetId: string;
  label: string;
  /** How many sensitive resources this removal would cut the identity's access to. */
  sensitiveCut: number;
}

/** Identity-centric over-exposure: what one principal can reach, and how to trim it. */
export interface IdentityExposure {
  principalId: string;
  displayName: string;
  email?: string;
  /** Count of sensitive resources this identity can reach. */
  reachableSensitive: number;
  /** 0..1 worst sensitivity reached. */
  topSensitivity: number;
  /** Highest-impact access removals, most-cut first. */
  recommendations: AccessRemoval[];
}

/** Projected tenant exposure if a chosen set of findings were fixed (what-if). */
export interface RemediationSimulation {
  baselineScore: number;
  projectedScore: number;
  baselineBand: Band;
  projectedBand: Band;
  scoreDelta: number;
  /** The findings the simulation treats as fixed (valid, currently-active ids). */
  resolvedFindingIds: string[];
  /** Findings that would remain active afterward. */
  remainingActive: number;
}
