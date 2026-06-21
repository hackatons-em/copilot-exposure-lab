import type { Band, EvidenceItem, Finding, RemediationTask, ScanResult } from "@cel/types";

/** Context passed to every exporter. Carries only non-sensitive presentation data. */
export interface ExportContext {
  workspaceName: string;
}

/** The artifact every exporter returns: a named, typed, ready-to-download body. */
export interface ExportArtifact {
  filename: string;
  contentType: string;
  body: string;
}

/** A finding joined with its evidence chain and remediation task. */
export interface JoinedFinding {
  finding: Finding;
  evidence: EvidenceItem[];
  remediation?: RemediationTask;
}

const BAND_ORDER: Record<Band, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

/** Display capitalization for a severity band. Stored lowercase; never mutated. */
export function bandLabel(band: Band): string {
  return band.charAt(0).toUpperCase() + band.slice(1);
}

/**
 * Join a scan result into finding + evidence + remediation tuples, in the same
 * stable order the engine emitted them (already sorted by descending risk).
 * Pure: no time, no random — a function of the scan result alone.
 */
export function joinFindings(scanResult: ScanResult): JoinedFinding[] {
  const evidenceByFinding = new Map<string, EvidenceItem[]>();
  for (const e of scanResult.evidence) {
    const list = evidenceByFinding.get(e.findingId) ?? [];
    list.push(e);
    evidenceByFinding.set(e.findingId, list);
  }
  const remediationById = new Map(scanResult.remediationTasks.map((t) => [t.id, t]));

  return scanResult.findings.map((finding) => ({
    finding,
    evidence: evidenceByFinding.get(finding.id) ?? [],
    remediation: finding.remediationTaskId ? remediationById.get(finding.remediationTaskId) : undefined,
  }));
}

/** True for critical/high findings — the set most tools want as actionable tickets. */
export function isActionable(finding: Finding): boolean {
  return finding.risk.band === "critical" || finding.risk.band === "high";
}

/** Sort joined findings critical → info, stable on ties (preserves engine order). */
export function sortByBand(joined: JoinedFinding[]): JoinedFinding[] {
  return [...joined].sort((a, b) => BAND_ORDER[a.finding.risk.band] - BAND_ORDER[b.finding.risk.band]);
}

/** Render an exposure path as "Step A > Step B > Resource". Empty string if none. */
export function exposurePathText(finding: Finding): string {
  const steps = finding.exposurePath?.steps ?? [];
  return steps.map((s) => s.label).join(" > ");
}

/** RFC-4180 CSV cell escaping: wrap in quotes if it contains quote/comma/newline. */
export function csvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Build one CSV line from already-stringified cell values. */
export function csvRow(cells: string[]): string {
  return cells.map(csvCell).join(",");
}
