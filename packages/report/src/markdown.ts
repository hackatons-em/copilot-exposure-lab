import type { Band } from "@cel/types";
import type { ReportFinding, ReportModel } from "./model.js";

const bandLabel = (b: Band): string => b.charAt(0).toUpperCase() + b.slice(1);

function pathLine(rf: ReportFinding): string {
  const steps = rf.finding.exposurePath?.steps ?? [];
  if (!steps.length) return "_n/a_";
  return steps
    .map((s, i) => (i < steps.length - 1 && s.relation ? `${s.label} →(${s.relation})→` : s.label))
    .join(" ");
}

function findingDetail(rf: ReportFinding): string {
  const { finding, evidence, remediation } = rf;
  const lines: string[] = [];
  lines.push(`### ${finding.id} — ${finding.title}`);
  lines.push("");
  lines.push(`- **Severity:** ${bandLabel(finding.risk.band)} (${finding.risk.total}/100)`);
  lines.push(`- **Status:** ${finding.status}`);
  lines.push(`- **Resource:** \`${finding.resourceId}\``);
  lines.push(`- **Summary:** ${finding.summary}`);
  lines.push(`- **Business impact:** ${finding.businessImpact}`);
  lines.push("");
  lines.push(`**Exposure path:** ${pathLine(rf)}`);
  lines.push("");
  lines.push("**Evidence chain:**");
  for (const e of evidence) lines.push(`- _(${e.kind})_ ${e.statement} \`[${e.sourceObjectType}:${e.sourceObjectId}]\``);
  lines.push("");
  lines.push("**Score breakdown:** " + finding.risk.components.map((c) => `${c.key} ${c.points}`).join(" · "));
  if (remediation) {
    lines.push("");
    lines.push(`**Remediation (${remediation.microsoftControl ?? "Microsoft 365"}):** ${remediation.title}`);
    for (const step of remediation.steps) lines.push(`  1. ${step}`);
  }
  lines.push("");
  return lines.join("\n");
}

/** Deterministic Markdown report. Consumes only the model — no LLM, no time. */
export function renderMarkdown(model: ReportModel): string {
  const out: string[] = [];
  out.push(`# ${model.title}`);
  out.push("");
  out.push(`**Prepared for:** ${model.workspaceName}  `);
  out.push(`**Generated:** ${model.generatedAt}  `);
  out.push(`**Scope:** ${model.scopeText}`);
  out.push("");

  out.push("## 1. Executive Summary");
  out.push("");
  out.push(
    `This assessment surfaced **${model.total} exposure findings** — ` +
      `${model.bandCounts.critical} critical, ${model.bandCounts.high} high, ${model.bandCounts.medium} medium, ` +
      `${model.bandCounts.low} low. The highest-risk paths are listed below; each has an evidence chain and a ` +
      `Microsoft-native remediation. Risk scores are deterministic and evidence-backed.`,
  );
  out.push("");

  if (model.llmSummary) {
    out.push("> **AI narrative summary**  ");
    out.push("> _AI-generated narrative — does not affect scoring or findings._  ");
    for (const line of model.llmSummary.split("\n")) out.push(`> ${line}`);
    out.push("");
  }

  out.push("## 2. Findings by Severity");
  out.push("");
  out.push("| Severity | Score | Finding | Resource |");
  out.push("|---|---:|---|---|");
  for (const { finding } of model.findings) {
    out.push(`| ${bandLabel(finding.risk.band)} | ${finding.risk.total} | ${finding.title} | \`${finding.resourceId}\` |`);
  }
  out.push("");

  out.push("## 3. Scope and Methodology");
  out.push("");
  for (const m of model.methodology) out.push(`- ${m}`);
  out.push("");
  out.push("Scenarios run:");
  for (const s of model.scenarioRuns) out.push(`- **${s.title}** — ${s.summary}`);
  out.push("");

  out.push("## 4. Critical & High Finding Detail");
  out.push("");
  if (model.criticalAndHigh.length === 0) out.push("_No critical or high findings._");
  for (const rf of model.criticalAndHigh) out.push(findingDetail(rf));

  out.push("## 5. Remediation Plan");
  out.push("");
  out.push("| Priority | Finding | Microsoft control | Effort | Status |");
  out.push("|---|---|---|---|---|");
  for (const { finding, remediation } of model.findings) {
    out.push(
      `| ${bandLabel(finding.risk.band)} | ${finding.title} | ${remediation?.microsoftControl ?? "—"} | ${
        remediation?.estimatedEffort ?? "—"
      } | ${remediation?.status ?? "todo"} |`,
    );
  }
  out.push("");

  out.push("## 6. Proof-of-Fix");
  out.push("");
  if (model.resolved.length === 0) {
    out.push("_No findings have been remediated and re-verified yet._");
  } else {
    for (const rf of model.resolved) {
      out.push(`- ✅ **${rf.finding.title}** — re-scan confirms the exposure path is closed.`);
    }
  }
  out.push("");

  out.push("## 7. Limitations");
  out.push("");
  for (const l of model.limitations) out.push(`- ${l}`);
  out.push("");

  out.push("## 8. Data Handling");
  out.push("");
  for (const d of model.dataHandling) out.push(`- ${d}`);
  out.push("");

  return out.join("\n");
}
