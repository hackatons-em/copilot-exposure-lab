import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadSeedGraph } from "@cel/graph-client";
import { buildRemediationPlan, scan, tenantExposureScore } from "@cel/rule-engine";
import { buildReportModel, renderHtml, renderMarkdown } from "../src/index.js";

/** Regenerate the committed sample report from the Acme demo (deterministic). */
const graph = loadSeedGraph();
const result = scan(graph, { now: "2026-06-21T00:00:00.000Z" });
const exposure = tenantExposureScore(result);
const model = buildReportModel({
  workspace: graph.workspace,
  scanResult: result,
  scenarios: graph.scenarios,
  exposure,
  remediationPlan: buildRemediationPlan(result),
});

const md = renderMarkdown(model);
const html = renderHtml(model);

const here = dirname(fileURLToPath(import.meta.url));

// 1. Canonical copy committed under docs/.
const docsOut = resolve(here, "../../../docs/sample-report");
mkdirSync(docsOut, { recursive: true });
writeFileSync(resolve(docsOut, "acme-exposure-report.md"), md, "utf8");
writeFileSync(resolve(docsOut, "acme-exposure-report.html"), html, "utf8");

// 2. Static copy served by the web app at /sample-report.html (no login) so the
//    marketing site and demo can open the real rendered report in-browser.
const webOut = resolve(here, "../../../apps/web/public");
mkdirSync(webOut, { recursive: true });
writeFileSync(resolve(webOut, "sample-report.html"), html, "utf8");
writeFileSync(resolve(webOut, "sample-report.md"), md, "utf8");

console.log(`wrote sample report (${result.findings.length} findings) to ${docsOut} and ${webOut}`);
