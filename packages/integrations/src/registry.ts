import type { ScanResult } from "@cel/types";
import type { ExportArtifact, ExportContext } from "./common.js";
import { toFindingsCsv } from "./csv.js";
import { toDefenderAlerts } from "./defender.js";
import { toJiraIssues } from "./jira.js";
import { toPurviewMapping } from "./purview.js";
import { toSentinelNdjson } from "./sentinel.js";
import { toServiceNowIncidents } from "./servicenow.js";

/** The supported deterministic export formats. */
export type ExportFormat = "csv" | "sentinel" | "purview" | "defender" | "jira" | "servicenow";

/** Signature every exporter conforms to: a pure transform of a scan result. */
export type Exporter = (scanResult: ScanResult, ctx: ExportContext) => ExportArtifact;

/** Format -> exporter. The single source of truth for which formats exist. */
export const EXPORTERS: Record<ExportFormat, Exporter> = {
  csv: toFindingsCsv,
  sentinel: toSentinelNdjson,
  purview: toPurviewMapping,
  defender: toDefenderAlerts,
  jira: toJiraIssues,
  servicenow: toServiceNowIncidents,
};

/** Human-facing metadata for each format (drives the Exports UI). */
export interface ExportFormatInfo {
  format: ExportFormat;
  label: string;
  description: string;
}

export const EXPORT_FORMATS: ExportFormatInfo[] = [
  {
    format: "csv",
    label: "Findings CSV",
    description: "Every finding as a spreadsheet-ready CSV — severity, score, resource, control, and exposure path.",
  },
  {
    format: "sentinel",
    label: "Azure Sentinel (NDJSON)",
    description: "Newline-delimited JSON for Sentinel / Log Analytics custom-log ingestion, one record per finding.",
  },
  {
    format: "purview",
    label: "Microsoft Purview labels",
    description: "Recommended sensitivity label per affected resource, with the findings that justify it.",
  },
  {
    format: "defender",
    label: "Microsoft Defender alerts",
    description: "Defender-style alert records with resource and user entities and a recommended action.",
  },
  {
    format: "jira",
    label: "Jira issues",
    description: "Issue-create payloads for critical and high findings, with evidence and remediation steps.",
  },
  {
    format: "servicenow",
    label: "ServiceNow incidents",
    description: "Incident-create payloads for critical and high findings, prioritized by severity.",
  },
];

/** Type guard: is `value` one of the known export formats? */
export function isExportFormat(value: string): value is ExportFormat {
  return Object.prototype.hasOwnProperty.call(EXPORTERS, value);
}

/** Dispatch to the exporter for `format`. Deterministic given a fixed scan result. */
export function runExport(format: ExportFormat, scanResult: ScanResult, ctx: ExportContext): ExportArtifact {
  return EXPORTERS[format](scanResult, ctx);
}
