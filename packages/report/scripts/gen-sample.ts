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

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, "../../../docs/sample-report");
mkdirSync(out, { recursive: true });
writeFileSync(resolve(out, "acme-exposure-report.md"), renderMarkdown(model), "utf8");
writeFileSync(resolve(out, "acme-exposure-report.html"), renderHtml(model), "utf8");
console.log(`wrote sample report (${result.findings.length} findings) to ${out}`);
