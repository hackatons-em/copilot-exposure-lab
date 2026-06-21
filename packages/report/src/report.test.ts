import { loadSeedGraph } from "@cel/graph-client";
import { scan, tenantExposureScore } from "@cel/rule-engine";
import { describe, expect, it } from "vitest";
import { buildReportModel } from "./model.js";
import { renderHtml } from "./html.js";
import { renderMarkdown } from "./markdown.js";

const graph = loadSeedGraph();
const scanResult = scan(graph, { now: "2026-06-21T00:00:00.000Z" });
const exposure = tenantExposureScore(scanResult);
const model = buildReportModel({
  workspace: graph.workspace,
  scanResult,
  scenarios: graph.scenarios,
  exposure,
});

describe("buildReportModel", () => {
  it("joins findings with evidence and remediation", () => {
    expect(model.findings).toHaveLength(9);
    const salary = model.findings.find((f) => f.finding.resourceId === "f-salary")!;
    expect(salary.evidence.length).toBeGreaterThan(0);
    expect(salary.remediation).toBeTruthy();
  });

  it("counts severity bands", () => {
    expect(model.bandCounts.critical).toBe(1);
    expect(model.bandCounts.high).toBe(4);
    expect(model.criticalAndHigh).toHaveLength(5);
  });

  it("carries the tenant exposure score", () => {
    expect(model.exposure).toBeDefined();
    expect(model.exposure!.score).toBe(exposure.score);
    expect(model.exposure!.band).toBe(exposure.band);
    expect(model.exposure!.drivers.length).toBeGreaterThan(0);
  });

  it("builds a heat map grouped by rule", () => {
    expect(model.heatMap.length).toBeGreaterThan(0);
    const totalFromHeatMap = model.heatMap.reduce((sum, row) => sum + row.total, 0);
    expect(totalFromHeatMap).toBe(model.total);
    // The most-severe row sorts first: it must contain the single critical finding.
    expect(model.heatMap[0]!.counts.critical).toBe(1);
  });

  it("ranks the top risks by score", () => {
    expect(model.topRisks).toHaveLength(5);
    expect(model.topRisks[0]!.rank).toBe(1);
    expect(model.topRisks[0]!.score).toBeGreaterThanOrEqual(model.topRisks[1]!.score);
    expect(model.topRisks[0]!.businessImpact.length).toBeGreaterThan(0);
  });

  it("sequences the remediation roadmap by effort", () => {
    const { quickWins, planned, project } = model.roadmap;
    const all = [...quickWins, ...planned, ...project];
    expect(all.length).toBeGreaterThan(0);
    // Every roadmap item must carry a Microsoft control + severity.
    for (const item of all) {
      expect(item.microsoftControl.length).toBeGreaterThan(0);
      expect(item.band.length).toBeGreaterThan(0);
    }
  });
});

describe("renderMarkdown", () => {
  const md = renderMarkdown(model);
  it("includes the spec report sections", () => {
    for (const heading of [
      "## 1. Executive Summary",
      "## 2. Top Risks by Business Impact",
      "## 3. Exposure by Rule",
      "## 4. Findings by Severity",
      "## 5. Scope and Methodology",
      "## 6. Critical & High Finding Detail",
      "## 7. Remediation Roadmap",
      "## 8. Proof-of-Fix",
      "## 9. Limitations",
      "## 10. Data Handling",
    ]) {
      expect(md).toContain(heading);
    }
  });

  it("renders the tenant exposure score line with drivers", () => {
    expect(md).toContain(`Tenant exposure score: ${exposure.score}/100`);
    expect(md).toContain("Top drivers of the score:");
  });

  it("renders the heat map, top risks, and a 'Why this matters' callout", () => {
    expect(md).toContain("Heat map of findings grouped by rule");
    expect(md).toContain("Quick wins (low effort)");
    expect(md).toContain("**Why this matters:**");
    // Top risk #1 is rendered with its rank.
    expect(md).toContain(`1. **${model.topRisks[0]!.title}**`);
  });

  it("renders the hero evidence chain with source object ids", () => {
    expect(md).toContain("Bob Novak");
    expect(md).toContain("[link:");
    expect(md).toContain("2026_salary_plan.xlsx");
  });

  it("is deterministic", () => {
    expect(renderMarkdown(model)).toBe(md);
  });
});

describe("renderHtml", () => {
  it("produces a self-contained HTML document with severity badges", () => {
    const html = renderHtml(model);
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain("Critical");
    expect(html).toContain("Findings by Severity");
  });

  it("renders the exposure gauge, heat map, top risks, roadmap, and 'Why this matters'", () => {
    const html = renderHtml(model);
    // Inline SVG gauge, self-contained (no external asset references).
    expect(html).toContain("<svg");
    expect(html).toContain(`Tenant exposure score: ${exposure.score}/100`);
    expect(html).toContain("Top Risks by Business Impact");
    expect(html).toContain("Exposure by Rule");
    expect(html).toContain('class="heatmap"');
    expect(html).toContain("Remediation Roadmap");
    expect(html).toContain("Why this matters:");
    expect(html).not.toContain("http://");
  });

  it("escapes content (no raw angle brackets from data leak into markup)", () => {
    const html = renderHtml(model);
    expect(html).not.toContain("<script>");
  });

  it("is deterministic", () => {
    expect(renderHtml(model)).toBe(renderHtml(model));
  });
});
