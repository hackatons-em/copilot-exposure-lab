import type { Band } from "@cel/types";
import type { ReportExposure, ReportFinding, ReportModel, RoadmapItem } from "./model.js";

const BANDS: Band[] = ["critical", "high", "medium", "low", "info"];

const bandLabel = (b: string): string => b.charAt(0).toUpperCase() + b.slice(1);

const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const BAND_COLOR: Record<Band, string> = {
  critical: "#b42318",
  high: "#c4570a",
  medium: "#b7791f",
  low: "#2f6f4f",
  info: "#4a5160",
};

/** Color for an arbitrary band string (defaults to info). */
const colorFor = (b: string): string => BAND_COLOR[b as Band] ?? BAND_COLOR.info;

function badge(b: Band): string {
  return `<span style="background:${BAND_COLOR[b]};color:#fff;border-radius:4px;padding:1px 7px;font-size:12px;font-weight:600">${bandLabel(b)}</span>`;
}

/**
 * Self-contained inline SVG donut gauge for the tenant exposure score.
 * Band-colored, no external assets. The arc length encodes score/100.
 */
function gauge(exposure: ReportExposure): string {
  const r = 52;
  const cx = 70;
  const cy = 70;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, exposure.score)) / 100;
  const dash = (circ * pct).toFixed(2);
  const gap = (circ * (1 - pct)).toFixed(2);
  const color = colorFor(exposure.band);
  return `<svg width="140" height="140" viewBox="0 0 140 140" role="img" aria-label="Tenant exposure score ${exposure.score} of 100, ${bandLabel(exposure.band)}">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#e2e6ec" stroke-width="14"></circle>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="14" stroke-linecap="round"
            stroke-dasharray="${dash} ${gap}" transform="rotate(-90 ${cx} ${cy})"></circle>
    <text x="${cx}" y="${cy - 2}" text-anchor="middle" font-size="30" font-weight="700" fill="#1a1f29">${exposure.score}</text>
    <text x="${cx}" y="${cy + 20}" text-anchor="middle" font-size="12" fill="${color}" font-weight="600">${bandLabel(exposure.band)}</text>
  </svg>`;
}

function exposureBlock(exposure: ReportExposure): string {
  const drivers = exposure.drivers.length
    ? `<p style="margin:8px 0 0;font-size:13px"><strong>Top drivers:</strong></p>
       <ul style="margin:4px 0 0">${exposure.drivers.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>`
    : "";
  return `<div class="exposure" style="display:flex;gap:20px;align-items:center;border:1px solid #e2e6ec;border-radius:8px;padding:16px;margin:0 0 16px;background:#fafbfc">
    <div>${gauge(exposure)}</div>
    <div>
      <p style="margin:0;font-size:15px"><strong>Tenant exposure score: ${exposure.score}/100 (${bandLabel(exposure.band)}).</strong></p>
      <p style="margin:6px 0 0;font-size:13px;color:#4a5160">Derived deterministically from the findings below — applying a fix and re-scanning lowers it.</p>
      ${drivers}
    </div>
  </div>`;
}

/** Colored grid heat map: rules (rows) x severity bands (columns). */
function heatMap(model: ReportModel): string {
  const head = `<tr><th style="text-align:left">Rule</th>${BANDS.map(
    (b) => `<th style="background:${BAND_COLOR[b]};color:#fff">${bandLabel(b)}</th>`,
  ).join("")}<th>Total</th></tr>`;
  const body = model.heatMap
    .map((row) => {
      const cells = BANDS.map((b) => {
        const n = row.counts[b];
        if (n === 0) return `<td style="text-align:center;color:#c2c8d0">·</td>`;
        return `<td style="text-align:center;background:${BAND_COLOR[b]};color:#fff;font-weight:600">${n}</td>`;
      }).join("");
      return `<tr><td><code>${esc(row.ruleId)}</code></td>${cells}<td style="text-align:center;font-weight:600">${row.total}</td></tr>`;
    })
    .join("");
  return `<table class="heatmap"><thead>${head}</thead><tbody>${body}</tbody></table>`;
}

function topRisks(model: ReportModel): string {
  if (model.topRisks.length === 0) return "<p><em>No findings.</em></p>";
  const items = model.topRisks
    .map((r) => {
      const mitre = r.techniqueIds.length
        ? ` <span class="mitre" style="font-size:11px;color:#4733b8">${r.techniqueIds.map(esc).join(", ")}</span>`
        : "";
      return `<li><strong>${esc(r.title)}</strong> ${badge(r.band)} <span class="score">${r.score}/100</span>${mitre}<br><span style="font-size:13px;color:#4a5160">${esc(
        r.businessImpact,
      )}</span></li>`;
    })
    .join("");
  return `<ol class="top-risks">${items}</ol>`;
}

/** Board-level threat-framework coverage: ATT&CK techniques + mapped controls. */
function threatCoverage(model: ReportModel): string {
  const { techniques, controls, tactics } = model.threatCoverage;
  const intro = `<p style="font-size:13px;color:#4a5160">Each finding maps deterministically (by rule) to the adversary technique it enables and the control that addresses it. Framework context only — it never influences the score.</p>`;
  const techBlock =
    techniques.length === 0
      ? `<p><em>No ATT&amp;CK techniques mapped — the open findings are governance gaps; see controls below.</em></p>`
      : `<p style="font-size:13px"><strong>MITRE ATT&amp;CK</strong> — ${techniques.length} technique(s) across ${tactics.length} tactic(s): ${esc(
          tactics.join(", "),
        )}.</p>
         <table><thead><tr><th>Technique</th><th>Name</th><th>Tactic</th></tr></thead><tbody>${techniques
           .map((t) => `<tr><td><code>${esc(t.id)}</code></td><td>${esc(t.name)}</td><td>${esc(t.tactic)}</td></tr>`)
           .join("")}</tbody></table>`;
  const ctrlBlock = controls.length
    ? `<p style="font-size:13px"><strong>Mapped controls:</strong> ${controls
        .map((c) => `${esc(c.framework)} ${esc(c.id)} (${esc(c.name)})`)
        .join(" &middot; ")}</p>`
    : "";
  return `${intro}${techBlock}${ctrlBlock}`;
}

/** Prioritized "fix these first" plan — ranked by score reduction per effort. */
function remediationPlan(model: ReportModel): string {
  const p = model.remediationPlan;
  if (!p || p.steps.length === 0) return "";
  const rows = p.steps
    .map(
      (s, i) =>
        `<tr><td style="text-align:right">${i + 1}</td><td>${esc(s.title)}</td><td>${badge(s.band)}</td><td>${esc(
          s.estimatedEffort,
        )}</td><td style="text-align:right;color:#2f6f4f;font-weight:600">&minus;${s.scoreDelta}</td><td style="text-align:right">&minus;${s.cumulativeDelta}</td></tr>`,
    )
    .join("");
  return `<p><strong>Prioritized plan — fix these ${p.steps.length} first to drop the tenant exposure score ${p.baselineScore} &rarr; ${p.projectedScore} (&minus;${p.totalDelta}).</strong> Ordered by score reduction per unit of effort.</p>
    <table><thead><tr><th>#</th><th>Finding</th><th>Severity</th><th>Effort</th><th>Score &minus;&Delta;</th><th>Cumulative</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function roadmapLane(title: string, items: RoadmapItem[]): string {
  if (items.length === 0) return `<h3>${esc(title)}</h3><p><em>None.</em></p>`;
  const rows = items
    .map(
      (it) =>
        `<tr><td>${esc(it.findingTitle)}</td><td>${esc(it.microsoftControl)}</td><td>${badge(it.band)} <span class="score">${it.score}</span></td><td>${esc(
          it.status,
        )}</td></tr>`,
    )
    .join("");
  return `<h3>${esc(title)}</h3>
    <table><thead><tr><th>Finding</th><th>Microsoft control</th><th>Severity</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`;
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
    <p class="why" style="border-left:3px solid ${colorFor(finding.risk.band)};background:#fafbfc;padding:6px 10px;margin:8px 0;font-size:13px"><strong>Why this matters:</strong> ${esc(finding.businessImpact)}</p>
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
  .heatmap th{text-align:center} .heatmap td:first-child{text-align:left}
  .top-risks li{margin:8px 0} .top-risks .score{color:#8a93a3;font-size:12px}
  .finding{border:1px solid #e2e6ec;border-radius:6px;padding:12px 16px;margin:12px 0;background:#fff}
  .score{color:#8a93a3;font-size:13px} .meta{color:#4a5160;font-size:13px} .impact,.path,.why{font-size:13px}
  @media print{body{margin:0}}
</style></head>
<body>
  <h1>${esc(model.title)}</h1>
  <p class="meta">Prepared for <strong>${esc(model.workspaceName)}</strong> &middot; Generated ${esc(model.generatedAt)}<br>Scope: ${esc(model.scopeText)}</p>

  <h2>1. Executive Summary</h2>
  ${model.exposure ? exposureBlock(model.exposure) : ""}
  <p>This assessment surfaced <strong>${model.total} exposure findings</strong> — ${model.bandCounts.critical} critical,
     ${model.bandCounts.high} high, ${model.bandCounts.medium} medium, ${model.bandCounts.low} low. Risk scores are
     deterministic and evidence-backed; every finding traces to a source object and carries a Microsoft-native remediation.</p>
  ${llmCallout(model)}

  <h2>2. Top Risks by Business Impact</h2>
  ${topRisks(model)}

  <h2>3. Threat Framework Coverage</h2>
  ${threatCoverage(model)}

  <h2>4. Exposure by Rule</h2>
  <p>Heat map of findings grouped by rule (rows) across severity bands (columns).</p>
  ${heatMap(model)}

  <h2>5. Findings by Severity</h2>
  <table><thead><tr><th>Severity</th><th>Score</th><th>Finding</th><th>Resource</th></tr></thead><tbody>${rows}</tbody></table>

  <h2>6. Scope &amp; Methodology</h2>
  <ul>${model.methodology.map((m) => `<li>${esc(m)}</li>`).join("")}</ul>
  <p>Scenarios run:</p><ul>${scenarios}</ul>

  <h2>7. Critical &amp; High Finding Detail</h2>
  ${details || "<p><em>No critical or high findings.</em></p>"}

  <h2>8. Remediation Roadmap</h2>
  ${remediationPlan(model)}
  <p>Remediation sequenced by effort — quick wins first, most severe within each lane.</p>
  ${roadmapLane("Quick wins (low effort)", model.roadmap.quickWins)}
  ${roadmapLane("Planned (medium effort)", model.roadmap.planned)}
  ${roadmapLane("Project (high effort)", model.roadmap.project)}

  <h2>9. Proof-of-Fix</h2>
  ${proof}

  <h2>10. Limitations</h2>
  <ul>${model.limitations.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>

  <h2>11. Data Handling</h2>
  <ul>${model.dataHandling.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>
</body></html>`;
}
