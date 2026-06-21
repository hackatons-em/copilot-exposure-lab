import type { ScanResult } from "@cel/types";
import { type ExportArtifact, type ExportContext, bandLabel, exposurePathText, joinFindings } from "./common.js";

/** One newline-delimited JSON record per finding, shaped for a Sentinel custom log. */
interface SentinelRecord {
  TimeGenerated: string;
  FindingId: string;
  Severity: string;
  Score: number;
  RuleId: string;
  Title: string;
  ResourceId: string;
  Workspace: string;
  ExposurePath: string;
  Remediation: string;
  BusinessImpact: string;
}

/**
 * Newline-delimited JSON (NDJSON) for Azure Sentinel / Log Analytics custom-log
 * ingestion — one object per line. TimeGenerated is the scan's generatedAt, so
 * the output is deterministic: no wall-clock time is read.
 */
export function toSentinelNdjson(scanResult: ScanResult, ctx: ExportContext): ExportArtifact {
  const joined = joinFindings(scanResult);
  const lines = joined.map(({ finding, remediation }) => {
    const record: SentinelRecord = {
      TimeGenerated: scanResult.generatedAt,
      FindingId: finding.id,
      Severity: bandLabel(finding.risk.band),
      Score: finding.risk.total,
      RuleId: finding.ruleId,
      Title: finding.title,
      ResourceId: finding.resourceId,
      Workspace: ctx.workspaceName,
      ExposurePath: exposurePathText(finding),
      Remediation: remediation?.title ?? "",
      BusinessImpact: finding.businessImpact,
    };
    return JSON.stringify(record);
  });

  return {
    filename: "copilot-exposure-sentinel.ndjson",
    contentType: "application/x-ndjson",
    body: lines.join("\n"),
  };
}
