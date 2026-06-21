import type { Band } from "@cel/types";
import type { ReportFinding, ReportModel } from "./model.js";

const bandLabel = (b: Band): string => b.charAt(0).toUpperCase() + b.slice(1);

const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const BAND_COLOR: Record<Band, string> = {
  critical: "#b42318",
  high: "#c4570a",
  medium: "#b7791f",
  low: "#2f6f4f",
  info: "#4a5160",
};

function badge(b: Band): string {
  return `<span style="background:${BAND_COLOR[b]};color:#fff;border-radius:4px;padding:1px 7px;font-size:12px;font-weight:600">${bandLabel(b)}</span>`;
}

function findingDetail(rf: ReportFinding): string {
  const { finding, evidence, remediation } = rf;
  const steps = finding.exposurePath?.steps ?? [];
  const path = steps.map((s) => `<code>${esc(s.label)}</code>`).join(" &rarr; ") || "<em>n/a</em>";
  const ev = evidence
    .map((e) => `<li><em>(${esc(e.kind)})</em> ${esc(e.statement)} <code>[${esc(e.sourceObjectType)}:${esc(e.sourceObjectId)}]</code></li>`)
    .join("");
  const rem = remediation
    ? `<p><strong>Remediation (${esc(remediation.microsoftControl ?? "Microsoft 365")}):</strong> ${esc(remediation.title)}</p>
       <ol>${remediation.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>`
    : "";
  return `<section class="finding">
    <h3>${esc(finding.id)} — ${esc(finding.title)} ${badge(finding.risk.band)} <span class="score">${finding.risk.total}/100</span></h3>
    <p>${esc(finding.summary)}</p>
    <p class="impact"><strong>Business impact:</strong> ${esc(finding.businessImpact)}</p>
    <p class="path"><strong>Exposure path:</strong> ${path}</p>
    <p><strong>Evidence chain:</strong></p><ul>${ev}</ul>
    ${rem}
  </section>`;
}

/** Optional AI narrative callout — clearly flagged, rendered only when set. */
function llmCallout(model: ReportModel): string {
  if (!model.llmSummary) return "";
  return `<aside class="ai-summary" style="border:1px solid #cdd5e0;border-left:4px solid #4a5160;border-radius:6px;background:#f7f8fa;padding:12px 16px;margin:12px 0">
    <p style="margin:0 0 6px;font-weight:600">AI narrative summary</p>
    <p style="margin:0 0 6px;font-size:12px;color:#4a5160"><em>AI-generated narrative — does not affect scoring or findings.</em></p>
    <p style="margin:0">${esc(model.llmSummary)}</p>
  </aside>`;
}

/** Deterministic, print-friendly HTML report. */
export function renderHtml(model: ReportModel): string {
  const rows = model.findings
    .map(
      ({ finding }) =>
        `<tr><td>${badge(finding.risk.band)}</td><td style="text-align:right">${finding.risk.total}</td><td>${esc(finding.title)}</td><td><code>${esc(finding.resourceId)}</code></td></tr>`,
    )
    .join("");
  const details = model.criticalAndHigh.map(findingDetail).join("");
  const scenarios = model.scenarioRuns.map((s) => `<li><strong>${esc(s.title)}</strong> — ${esc(s.summary)}</li>`).join("");
  const proof =
    model.resolved.length === 0
      ? "<p><em>No findings have been remediated and re-verified yet.</em></p>"
      : `<ul>${model.resolved.map((rf) => `<li>✅ <strong>${esc(rf.finding.title)}</strong> — re-scan confirms the exposure path is closed.</li>`).join("")}</ul>`;

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${esc(model.title)}</title>
<style>
  body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1a1f29;max-width:880px;margin:32px auto;padding:0 20px;line-height:1.5}
  h1{font-size:24px} h2{font-size:18px;border-bottom:1px solid #e2e6ec;padding-bottom:4px;margin-top:32px}
  h3{font-size:15px;margin-bottom:4px} code{font-family:ui-monospace,Consolas,monospace;font-size:12px;background:#f7f8fa;padding:1px 4px;border-radius:3px}
  table{width:100%;border-collapse:collapse;font-size:13px} th,td{border:1px solid #e2e6ec;padding:6px 8px;text-align:left}
  .finding{border:1px solid #e2e6ec;border-radius:6px;padding:12px 16px;margin:12px 0;background:#fff}
  .score{color:#8a93a3;font-size:13px} .meta{color:#4a5160;font-size:13px} .impact,.path{font-size:13px}
  @media print{body{margin:0}}
</style></head>
<body>
  <h1>${esc(model.title)}</h1>
  <p class="meta">Prepared for <strong>${esc(model.workspaceName)}</strong> &middot; Generated ${esc(model.generatedAt)}<br>Scope: ${esc(model.scopeText)}</p>

  <h2>1. Executive Summary</h2>
  <p>This assessment surfaced <strong>${model.total} exposure findings</strong> — ${model.bandCounts.critical} critical,
     ${model.bandCounts.high} high, ${model.bandCounts.medium} medium, ${model.bandCounts.low} low. Risk scores are
     deterministic and evidence-backed; every finding traces to a source object and carries a Microsoft-native remediation.</p>
  ${llmCallout(model)}

  <h2>2. Findings by Severity</h2>
  <table><thead><tr><th>Severity</th><th>Score</th><th>Finding</th><th>Resource</th></tr></thead><tbody>${rows}</tbody></table>

  <h2>3. Scope &amp; Methodology</h2>
  <ul>${model.methodology.map((m) => `<li>${esc(m)}</li>`).join("")}</ul>
  <p>Scenarios run:</p><ul>${scenarios}</ul>

  <h2>4. Critical &amp; High Finding Detail</h2>
  ${details || "<p><em>No critical or high findings.</em></p>"}

  <h2>5. Proof-of-Fix</h2>
  ${proof}

  <h2>6. Limitations</h2>
  <ul>${model.limitations.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>

  <h2>7. Data Handling</h2>
  <ul>${model.dataHandling.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>
</body></html>`;
}
