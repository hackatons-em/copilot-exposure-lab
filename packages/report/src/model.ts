import type {
  Band,
  ControlRef,
  EvidenceItem,
  Finding,
  RemediationTask,
  ScanResult,
  Scenario,
  ThreatTechnique,
  Workspace,
} from "@cel/types";

export interface ReportFinding {
  finding: Finding;
  evidence: EvidenceItem[];
  remediation?: RemediationTask;
}

/**
 * Tenant-level exposure summary, passed in by the caller. Mirrors the
 * `TenantExposure` shape from @cel/rule-engine — declared locally so the report
 * package never takes a runtime dependency on the rule engine.
 */
export interface ReportExposure {
  /** 0-100 tenant-level exposure score (deterministic aggregate of findings). */
  score: number;
  band: string;
  /** Count of unresolved findings. */
  findingCount: number;
  /** Unresolved findings by band. */
  bands: Record<string, number>;
  /** Titles of the top contributing findings. */
  drivers: string[];
}

/** One row of the exposure heat map: a rule and its findings counted by band. */
export interface HeatMapRow {
  ruleId: string;
  /** A representative, human-readable title for the rule (first finding's title). */
  label: string;
  counts: Record<Band, number>;
  /** Total findings for this rule (row total). */
  total: number;
}

/** A single ranked entry in the "top risks by business impact" list. */
export interface TopRisk {
  rank: number;
  title: string;
  band: Band;
  score: number;
  businessImpact: string;
  /** MITRE ATT&CK technique ids this risk maps to (may be empty for governance gaps). */
  techniqueIds: string[];
}

/** Distinct threat-framework coverage across the assessed findings. */
export interface ThreatCoverage {
  techniques: ThreatTechnique[];
  controls: ControlRef[];
  /** Distinct ATT&CK tactics touched, sorted. */
  tactics: string[];
}

/** One remediation roadmap entry, grouped by effort lane. */
export interface RoadmapItem {
  findingTitle: string;
  microsoftControl: string;
  band: Band;
  score: number;
  status: string;
}

/** The sequenced remediation roadmap, split into effort lanes. */
export interface RemediationRoadmap {
  quickWins: RoadmapItem[];
  planned: RoadmapItem[];
  project: RoadmapItem[];
}

export interface ReportModel {
  title: string;
  workspaceName: string;
  generatedAt: string;
  scopeText: string;
  total: number;
  bandCounts: Record<Band, number>;
  /** Optional tenant exposure score (deterministic, supplied by the caller). */
  exposure?: ReportExposure;
  findings: ReportFinding[];
  criticalAndHigh: ReportFinding[];
  resolved: ReportFinding[];
  /** Exposure-by-rule heat map: rules (rows) x severity bands (columns). */
  heatMap: HeatMapRow[];
  /** Top 5 findings by score, with their one-line business impact. */
  topRisks: TopRisk[];
  /** ATT&CK techniques + controls the assessed findings map to (board-level framework context). */
  threatCoverage: ThreatCoverage;
  /** Remediation roadmap, sequenced by effort (quick wins first). */
  roadmap: RemediationRoadmap;
  scenarioRuns: { title: string; summary: string }[];
  methodology: string[];
  limitations: string[];
  dataHandling: string[];
  /**
   * Optional, env-gated AI narrative. Never affects scoring or findings — purely
   * a summary of the already-computed counts/titles. Unset by default.
   */
  llmSummary?: string;
}

const BANDS: Band[] = ["critical", "high", "medium", "low", "info"];

/** Severity rank for ordering (critical first). */
const BAND_RANK: Record<Band, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

export interface BuildReportInput {
  workspace: Pick<Workspace, "name">;
  scanResult: ScanResult;
  scenarios: Scenario[];
  /** Optional tenant exposure score (deterministic; computed by the caller). */
  exposure?: ReportExposure;
}

function buildHeatMap(findings: Finding[]): HeatMapRow[] {
  const byRule = new Map<string, HeatMapRow>();
  for (const f of findings) {
    let row = byRule.get(f.ruleId);
    if (!row) {
      row = {
        ruleId: f.ruleId,
        label: f.title,
        counts: Object.fromEntries(BANDS.map((b) => [b, 0])) as Record<Band, number>,
        total: 0,
      };
      byRule.set(f.ruleId, row);
    }
    row.counts[f.risk.band] += 1;
    row.total += 1;
  }
  // Sort rows by their most-severe finding (band rank), then volume, then ruleId.
  const severityOf = (row: HeatMapRow): number => {
    for (const b of BANDS) if (row.counts[b] > 0) return BAND_RANK[b];
    return BANDS.length;
  };
  return [...byRule.values()].sort(
    (a, b) => severityOf(a) - severityOf(b) || b.total - a.total || (a.ruleId < b.ruleId ? -1 : 1),
  );
}

function buildRoadmap(findings: ReportFinding[]): RemediationRoadmap {
  const lanes: RemediationRoadmap = { quickWins: [], planned: [], project: [] };
  // findings are already sorted by score desc; preserve that "most severe first" order within each lane.
  for (const { finding, remediation } of findings) {
    if (!remediation) continue;
    const item: RoadmapItem = {
      findingTitle: finding.title,
      microsoftControl: remediation.microsoftControl ?? "Microsoft 365",
      band: finding.risk.band,
      score: finding.risk.total,
      status: remediation.status,
    };
    if (remediation.estimatedEffort === "low") lanes.quickWins.push(item);
    else if (remediation.estimatedEffort === "medium") lanes.planned.push(item);
    else lanes.project.push(item);
  }
  return lanes;
}

/** Assemble a deterministic report model from a scan result. No LLM, no time. */
export function buildReportModel(input: BuildReportInput): ReportModel {
  const { scanResult, scenarios } = input;
  const evidenceByFinding = new Map<string, EvidenceItem[]>();
  for (const e of scanResult.evidence) {
    const list = evidenceByFinding.get(e.findingId) ?? [];
    list.push(e);
    evidenceByFinding.set(e.findingId, list);
  }
  const remediationById = new Map(scanResult.remediationTasks.map((t) => [t.id, t]));

  const findings: ReportFinding[] = scanResult.findings.map((finding) => ({
    finding,
    evidence: evidenceByFinding.get(finding.id) ?? [],
    remediation: finding.remediationTaskId ? remediationById.get(finding.remediationTaskId) : undefined,
  }));

  const bandCounts = Object.fromEntries(BANDS.map((b) => [b, 0])) as Record<Band, number>;
  for (const f of scanResult.findings) bandCounts[f.risk.band] += 1;

  const criticalAndHigh = findings.filter(
    (f) => f.finding.risk.band === "critical" || f.finding.risk.band === "high",
  );

  const topRisks: TopRisk[] = findings.slice(0, 5).map(({ finding }, i) => ({
    rank: i + 1,
    title: finding.title,
    band: finding.risk.band,
    score: finding.risk.total,
    businessImpact: finding.businessImpact,
    techniqueIds: finding.threat.techniques.map((t) => t.id),
  }));

  // Threat-framework coverage across unresolved findings — deduped + deterministically sorted.
  const techById = new Map<string, ThreatTechnique>();
  const ctrlByKey = new Map<string, ControlRef>();
  for (const f of scanResult.findings) {
    if (f.status === "resolved") continue;
    for (const t of f.threat.techniques) techById.set(t.id, t);
    for (const c of f.threat.controls) ctrlByKey.set(`${c.framework}|${c.id}`, c);
  }
  const coverageTechniques = [...techById.values()].sort((a, b) => (a.id < b.id ? -1 : 1));
  const threatCoverage: ThreatCoverage = {
    techniques: coverageTechniques,
    controls: [...ctrlByKey.values()].sort((a, b) =>
      `${a.framework}|${a.id}`.localeCompare(`${b.framework}|${b.id}`),
    ),
    tactics: [...new Set(coverageTechniques.map((t) => t.tactic))].sort(),
  };

  const scenarioTitle = (id: string): string => scenarios.find((s) => s.id === id)?.title ?? id;

  return {
    title: "Copilot Exposure Assessment Report",
    workspaceName: input.workspace.name,
    generatedAt: scanResult.generatedAt,
    scopeText: "Microsoft 365 SharePoint / OneDrive permissions, sharing links, and Copilot Studio agents (metadata only).",
    total: scanResult.findings.length,
    bandCounts,
    exposure: input.exposure,
    findings,
    criticalAndHigh,
    resolved: findings.filter((f) => f.finding.status === "resolved"),
    heatMap: buildHeatMap(scanResult.findings),
    topRisks,
    threatCoverage,
    roadmap: buildRoadmap(findings),
    scenarioRuns: scanResult.scenarioRuns.map((r) => ({ title: scenarioTitle(r.scenarioId), summary: r.summary })),
    methodology: [
      "Metadata ingestion of users, groups, sites, drives, files, permissions, sharing links, and agents.",
      "Permission-graph construction (group expansion, inheritance, links, guests, org-wide access).",
      "Deterministic exposure scenarios executed against the graph.",
      "Deterministic 0-100 risk scoring — severity is computed, never generated by an LLM.",
    ],
    limitations: [
      "Metadata-only mode may miss content-sensitive issues inside documents.",
      "Findings depend on the approved scan scope.",
      "This product does not guarantee Copilot safety; it surfaces and prioritizes exposure paths.",
    ],
    dataHandling: [
      "Document contents, email bodies, and credentials are not stored.",
      "Only metadata, permission grants, findings, evidence references, and reports are retained.",
      "Workspace deletion removes all associated data.",
    ],
  };
}
