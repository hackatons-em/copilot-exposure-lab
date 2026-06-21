import type { ScanResult } from "@cel/types";
import { type ExportArtifact, type ExportContext, type JoinedFinding, isActionable, joinFindings } from "./common.js";

interface JiraIssue {
  fields: {
    project: { key: "SEC" };
    summary: string;
    description: string;
    issuetype: { name: "Task" };
    priority: { name: "Highest" | "High" };
    labels: string[];
  };
}

/** Multi-line issue body: summary, evidence chain, remediation steps. */
function describe(joined: JoinedFinding): string {
  const { finding, evidence, remediation } = joined;
  const lines: string[] = [];
  lines.push(finding.summary);
  lines.push("");
  lines.push(`Business impact: ${finding.businessImpact}`);
  lines.push("");
  lines.push("Evidence chain:");
  if (evidence.length === 0) {
    lines.push("- (no evidence recorded)");
  } else {
    for (const e of evidence) lines.push(`- (${e.kind}) ${e.statement} [${e.sourceObjectType}:${e.sourceObjectId}]`);
  }
  if (remediation) {
    lines.push("");
    lines.push(`Remediation (${remediation.microsoftControl ?? "Microsoft 365"}): ${remediation.title}`);
    remediation.steps.forEach((step, i) => lines.push(`${i + 1}. ${step}`));
  }
  return lines.join("\n");
}

/**
 * Jira issue-create payloads for critical/high findings only. Pure transform —
 * deterministic ordering follows the engine's descending-risk finding order.
 */
export function toJiraIssues(scanResult: ScanResult, _ctx: ExportContext): ExportArtifact {
  const joined = joinFindings(scanResult).filter((j) => isActionable(j.finding));

  const issues: JiraIssue[] = joined.map((j) => ({
    fields: {
      project: { key: "SEC" },
      summary: j.finding.title,
      description: describe(j),
      issuetype: { name: "Task" },
      priority: { name: j.finding.risk.band === "critical" ? "Highest" : "High" },
      labels: ["copilot-exposure", j.finding.ruleId],
    },
  }));

  return {
    filename: "copilot-exposure-jira-issues.json",
    contentType: "application/json",
    body: JSON.stringify(issues, null, 2),
  };
}
