import type { ScanResult } from "@cel/types";
import { type ExportArtifact, type ExportContext, csvRow, exposurePathText, joinFindings } from "./common.js";

const HEADER = [
  "id",
  "severity",
  "score",
  "ruleId",
  "title",
  "resourceId",
  "status",
  "microsoftControl",
  "exposurePath",
];

/**
 * Findings as a CSV any SIEM / spreadsheet / ticketing import can consume.
 * Deterministic: a pure transform of the scan result, RFC-4180 escaped.
 */
export function toFindingsCsv(scanResult: ScanResult, _ctx: ExportContext): ExportArtifact {
  const joined = joinFindings(scanResult);
  const lines: string[] = [csvRow(HEADER)];

  for (const { finding, remediation } of joined) {
    lines.push(
      csvRow([
        finding.id,
        finding.risk.band,
        String(finding.risk.total),
        finding.ruleId,
        finding.title,
        finding.resourceId,
        finding.status,
        remediation?.microsoftControl ?? "",
        exposurePathText(finding),
      ]),
    );
  }

  return {
    filename: "copilot-exposure-findings.csv",
    contentType: "text/csv; charset=utf-8",
    body: lines.join("\r\n"),
  };
}
