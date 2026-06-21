import { loadSeedGraph } from "@cel/graph-client";
import { scan } from "@cel/rule-engine";
import { describe, expect, it } from "vitest";
import { buildReportModel } from "./model.js";
import { renderHtml } from "./html.js";
import { renderMarkdown } from "./markdown.js";

const graph = loadSeedGraph();
const scanResult = scan(graph, { now: "2026-06-21T00:00:00.000Z" });
const model = buildReportModel({ workspace: graph.workspace, scanResult, scenarios: graph.scenarios });

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
});

describe("renderMarkdown", () => {
  const md = renderMarkdown(model);
  it("includes the spec report sections", () => {
    for (const heading of [
      "## 1. Executive Summary",
      "## 2. Findings by Severity",
      "## 3. Scope and Methodology",
      "## 4. Critical & High Finding Detail",
      "## 5. Remediation Plan",
      "## 6. Proof-of-Fix",
      "## 7. Limitations",
      "## 8. Data Handling",
    ]) {
      expect(md).toContain(heading);
    }
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

  it("escapes content (no raw angle brackets from data leak into markup)", () => {
    const html = renderHtml(model);
    expect(html).not.toContain("<script>");
  });
});
