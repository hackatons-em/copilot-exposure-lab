import type { ScanResult } from "@cel/types";
import { type ExportArtifact, type ExportContext, type JoinedFinding, isActionable, joinFindings } from "./common.js";

interface ServiceNowIncident {
  short_description: string;
  description: string;
  urgency: 1 | 2;
  impact: 1 | 2;
  category: "Security";
  u_source: "Copilot Exposure Lab";
}

function describe(joined: JoinedFinding): string {
  const { finding, remediation } = joined;
  const lines: string[] = [];
  lines.push(finding.summary);
  lines.push("");
  lines.push(`Business impact: ${finding.businessImpact}`);
  if (remediation) {
    lines.push("");
    lines.push(`Remediation (${remediation.microsoftControl ?? "Microsoft 365"}): ${remediation.title}`);
    remediation.steps.forEach((step, i) => lines.push(`${i + 1}. ${step}`));
  }
  return lines.join("\n");
}

/**
 * ServiceNow incident-create payloads for critical/high findings only.
 * Critical maps to urgency/impact 1, high to 2. Deterministic transform.
 */
export function toServiceNowIncidents(scanResult: ScanResult, _ctx: ExportContext): ExportArtifact {
  const joined = joinFindings(scanResult).filter((j) => isActionable(j.finding));

  const incidents: ServiceNowIncident[] = joined.map((j) => {
    const critical = j.finding.risk.band === "critical";
    return {
      short_description: j.finding.title,
      description: describe(j),
      urgency: critical ? 1 : 2,
      impact: critical ? 1 : 2,
      category: "Security",
      u_source: "Copilot Exposure Lab",
    };
  });

  return {
    filename: "copilot-exposure-servicenow-incidents.json",
    contentType: "application/json",
    body: JSON.stringify(incidents, null, 2),
  };
}
