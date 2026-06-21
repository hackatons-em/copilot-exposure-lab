import type { Band } from "@cel/types";
import type { ReportExposure, ReportFinding, ReportModel, RoadmapItem } from "./model.js";

const BANDS: Band[] = ["critical", "high", "medium", "low", "info"];

const bandLabel = (b: string): string => b.charAt(0).toUpperCase() + b.slice(1);

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
  lines.push("");
  lines.push(`> **Why this matters:** ${finding.businessImpact}`);
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

function exposureBlock(exposure: ReportExposure): string[] {
  const out: string[] = [];
  out.push(
    `**Tenant exposure score: ${exposure.score}/100 (${bandLabel(exposure.band)}).** ` +
      `Derived deterministically from the findings below — applying a fix and re-scanning lowers it.`,
  );
  if (exposure.drivers.length) {
    out.push("");
    out.push("Top drivers of the score:");
    for (const d of exposure.drivers) out.push(`- ${d}`);
  }
  out.push("");
  return out;
}

function heatMapTable(model: ReportModel): string[] {
  const out: string[] = [];
  out.push("| Rule | " + BANDS.map(bandLabel).join(" | ") + " | Total |");
  out.push("|---|" + BANDS.map(() => "---:").join("|") + "|---:|");
  for (const row of model.heatMap) {
    const cells = BANDS.map((b) => (row.counts[b] > 0 ? String(row.counts[b]) : "·"));
    out.push(`| \`${row.ruleId}\` | ${cells.join(" | ")} | ${row.total} |`);
  }
  return out;
}

function threatCoverageBlock(model: ReportModel): string[] {
  const out: string[] = [];
  const { techniques, controls, tactics } = model.threatCoverage;
  out.push(
    "Each finding maps deterministically (by rule) to the adversary techniques it enables and the controls that " +
      "address it. These framework references route findings into existing security programs; they never influence the score.",
  );
  out.push("");
  if (techniques.length === 0) {
    out.push("_No ATT&CK techniques mapped — the open findings are governance gaps; see controls below._");
  } else {
    out.push(`**MITRE ATT&CK** — ${techniques.length} technique(s) across ${tactics.length} tactic(s): ${tactics.join(", ")}.`);
    out.push("");
    out.push("| Technique | Name | Tactic |");
    out.push("|---|---|---|");
    for (const t of techniques) out.push(`| \`${t.id}\` | ${t.name} | ${t.tactic} |`);
    out.push("");
  }
  if (controls.length) {
    out.push("**Mapped controls:** " + controls.map((c) => `${c.framework} ${c.id} (${c.name})`).join(" · "));
    out.push("");
  }
  return out;
}

function roadmapLane(title: string, items: RoadmapItem[]): string[] {
  const out: string[] = [];
  out.push(`**${title}**`);
  out.push("");
  if (items.length === 0) {
    out.push("_None._");
    out.push("");
    return out;
  }
  out.push("| Finding | Microsoft control | Severity | Status |");
  out.push("|---|---|---|---|");
  for (const it of items) {
    out.push(`| ${it.findingTitle} | ${it.microsoftControl} | ${bandLabel(it.band)} (${it.score}) | ${it.status} |`);
  }
  out.push("");
  return out;
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
  if (model.exposure) out.push(...exposureBlock(model.exposure));
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

  out.push("## 2. Top Risks by Business Impact");
  out.push("");
  if (model.topRisks.length === 0) {
    out.push("_No findings._");
  } else {
    for (const r of model.topRisks) {
      const mitre = r.techniqueIds.length ? ` _(MITRE ${r.techniqueIds.join(", ")})_` : "";
      out.push(`${r.rank}. **${r.title}** — ${bandLabel(r.band)} (${r.score}/100).${mitre} ${r.businessImpact}`);
    }
  }
  out.push("");

  out.push("## 3. Threat Framework Coverage");
  out.push("");
  out.push(...threatCoverageBlock(model));

  out.push("## 4. Exposure by Rule");
  out.push("");
  out.push("Heat map of findings grouped by rule (rows) across severity bands (columns).");
  out.push("");
  out.push(...heatMapTable(model));
  out.push("");

  out.push("## 5. Findings by Severity");
  out.push("");
  out.push("| Severity | Score | Finding | Resource |");
  out.push("|---|---:|---|---|");
  for (const { finding } of model.findings) {
    out.push(`| ${bandLabel(finding.risk.band)} | ${finding.risk.total} | ${finding.title} | \`${finding.resourceId}\` |`);
  }
  out.push("");

  out.push("## 6. Scope and Methodology");
  out.push("");
  for (const m of model.methodology) out.push(`- ${m}`);
  out.push("");
  out.push("Scenarios run:");
  for (const s of model.scenarioRuns) out.push(`- **${s.title}** — ${s.summary}`);
  out.push("");

  out.push("## 7. Critical & High Finding Detail");
  out.push("");
  if (model.criticalAndHigh.length === 0) out.push("_No critical or high findings._");
  for (const rf of model.criticalAndHigh) out.push(findingDetail(rf));

  out.push("## 8. Remediation Roadmap");
  out.push("");
  out.push("Remediation sequenced by effort — quick wins first, most severe within each lane.");
  out.push("");
  out.push(...roadmapLane("Quick wins (low effort)", model.roadmap.quickWins));
  out.push(...roadmapLane("Planned (medium effort)", model.roadmap.planned));
  out.push(...roadmapLane("Project (high effort)", model.roadmap.project));

  out.push("## 9. Proof-of-Fix");
  out.push("");
  if (model.resolved.length === 0) {
    out.push("_No findings have been remediated and re-verified yet._");
  } else {
    for (const rf of model.resolved) {
      out.push(`- ✅ **${rf.finding.title}** — re-scan confirms the exposure path is closed.`);
    }
  }
  out.push("");

  out.push("## 10. Limitations");
  out.push("");
  for (const l of model.limitations) out.push(`- ${l}`);
  out.push("");

  out.push("## 11. Data Handling");
  out.push("");
  for (const d of model.dataHandling) out.push(`- ${d}`);
  out.push("");

  return out.join("\n");
}
