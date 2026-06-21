import { loadSeedGraph } from "@cel/graph-client";
import { scan } from "@cel/rule-engine";
import { describe, expect, it } from "vitest";
import type { ExportContext } from "./common.js";
import { toFindingsCsv } from "./csv.js";
import { toDefenderAlerts } from "./defender.js";
import { toJiraIssues } from "./jira.js";
import { toPurviewMapping } from "./purview.js";
import { EXPORTERS, type ExportFormat, isExportFormat, runExport } from "./registry.js";
import { toSentinelNdjson } from "./sentinel.js";
import { toServiceNowIncidents } from "./servicenow.js";

const graph = loadSeedGraph();
const scanResult = scan(graph, { now: "2026-06-21T00:00:00.000Z" });
const ctx: ExportContext = { workspaceName: graph.workspace.name };

// Sanity: the demo seed yields 9 findings, 1 critical + 4 high = 5 actionable.
const ACTIONABLE = 5;
const TOTAL = 9;

describe("toFindingsCsv", () => {
  const csv = toFindingsCsv(scanResult, ctx);

  it("has the expected header and one row per finding", () => {
    const lines = csv.body.split("\r\n");
    expect(lines[0]).toBe("id,severity,score,ruleId,title,resourceId,status,microsoftControl,exposurePath");
    expect(lines).toHaveLength(TOTAL + 1);
  });

  it("includes the critical salary finding row with its exposure path", () => {
    const row = csv.body.split("\r\n").find((l) => l.includes("f-salary"));
    expect(row).toBeTruthy();
    expect(row).toContain("critical");
    expect(row).toContain("org-wide-link");
    expect(row).toContain("2026_salary_plan.xlsx");
  });

  it("CSV-escapes cells containing commas or quotes", () => {
    expect(toFindingsCsv(scanResult, { workspaceName: "x" }).body).not.toMatch(/,,[^,]* [^,]*,/);
    // The exposure path joins with " > " and is comma-free, but titles may contain commas; ensure no broken rows.
    for (const line of csv.body.split("\r\n").slice(1)) {
      // crude balance check: a properly escaped line never has an odd number of quotes mid-field issues
      expect(line.split('"').length % 2).toBe(1);
    }
  });

  it("uses a downloadable CSV content type and filename", () => {
    expect(csv.contentType).toBe("text/csv; charset=utf-8");
    expect(csv.filename).toBe("copilot-exposure-findings.csv");
  });

  it("is deterministic", () => {
    expect(toFindingsCsv(scanResult, ctx).body).toBe(csv.body);
  });
});

describe("toSentinelNdjson", () => {
  const nd = toSentinelNdjson(scanResult, ctx);

  it("produces one JSON object per line, all parseable", () => {
    const lines = nd.body.split("\n");
    expect(lines).toHaveLength(TOTAL);
    for (const line of lines) {
      const obj = JSON.parse(line) as Record<string, unknown>;
      expect(obj.TimeGenerated).toBe("2026-06-21T00:00:00.000Z");
      expect(obj.Workspace).toBe(graph.workspace.name);
      expect(typeof obj.Score).toBe("number");
    }
  });

  it("capitalizes the severity band", () => {
    const first = JSON.parse(nd.body.split("\n")[0] ?? "{}") as { Severity: string };
    expect(first.Severity).toBe("Critical");
  });

  it("uses the NDJSON content type", () => {
    expect(nd.contentType).toBe("application/x-ndjson");
  });

  it("is deterministic", () => {
    expect(toSentinelNdjson(scanResult, ctx).body).toBe(nd.body);
  });
});

describe("toPurviewMapping", () => {
  const purview = toPurviewMapping(scanResult, ctx);
  const parsed = JSON.parse(purview.body) as {
    actions: { resourceId: string; recommendedLabel: string; rationale: string; findingIds: string[] }[];
  };

  it("recommends Highly Confidential for the critical salary resource", () => {
    const salary = parsed.actions.find((a) => a.resourceId === "f-salary");
    expect(salary).toBeTruthy();
    expect(salary?.recommendedLabel).toBe("Highly Confidential");
    expect(salary?.findingIds.length).toBeGreaterThan(0);
    expect(salary?.rationale).toContain("organization-wide link");
  });

  it("recommends Confidential for resources whose top finding is high", () => {
    const acq = parsed.actions.find((a) => a.resourceId === "f-acq");
    expect(acq?.recommendedLabel).toBe("Confidential");
  });

  it("is deterministic", () => {
    expect(toPurviewMapping(scanResult, ctx).body).toBe(purview.body);
  });
});

describe("toDefenderAlerts", () => {
  const defender = toDefenderAlerts(scanResult, ctx);
  const alerts = JSON.parse(defender.body) as {
    title: string;
    category: string;
    entities: { type: string; id: string }[];
  }[];

  it("emits one AIExposure alert per finding with a resource entity", () => {
    expect(alerts).toHaveLength(TOTAL);
    for (const a of alerts) {
      expect(a.category).toBe("AIExposure");
      expect(a.entities.some((e) => e.type === "resource")).toBe(true);
    }
  });

  it("includes a user entity when the finding has a principal", () => {
    const salary = alerts.find((a) => a.entities.some((e) => e.id === "f-salary"));
    expect(salary?.entities.some((e) => e.type === "user" && e.id === "u-bob")).toBe(true);
  });

  it("is deterministic", () => {
    expect(toDefenderAlerts(scanResult, ctx).body).toBe(defender.body);
  });
});

describe("toJiraIssues", () => {
  const jira = toJiraIssues(scanResult, ctx);
  const issues = JSON.parse(jira.body) as {
    fields: { project: { key: string }; summary: string; priority: { name: string }; labels: string[] };
  }[];

  it("only includes critical and high findings", () => {
    expect(issues).toHaveLength(ACTIONABLE);
  });

  it("maps critical to Highest priority and tags the rule id", () => {
    const top = issues[0];
    expect(top?.fields.project.key).toBe("SEC");
    expect(top?.fields.priority.name).toBe("Highest");
    expect(top?.fields.labels).toContain("copilot-exposure");
    expect(top?.fields.labels).toContain("org-wide-link");
  });

  it("is deterministic", () => {
    expect(toJiraIssues(scanResult, ctx).body).toBe(jira.body);
  });
});

describe("toServiceNowIncidents", () => {
  const snow = toServiceNowIncidents(scanResult, ctx);
  const incidents = JSON.parse(snow.body) as { urgency: number; impact: number; category: string }[];

  it("only includes critical and high findings", () => {
    expect(incidents).toHaveLength(ACTIONABLE);
  });

  it("sets urgency/impact 1 for critical and 2 for high", () => {
    expect(incidents[0]?.urgency).toBe(1);
    expect(incidents[0]?.impact).toBe(1);
    expect(incidents[1]?.urgency).toBe(2);
    expect(incidents.every((i) => i.category === "Security")).toBe(true);
  });

  it("is deterministic", () => {
    expect(toServiceNowIncidents(scanResult, ctx).body).toBe(snow.body);
  });
});

describe("registry", () => {
  it("recognizes the six known formats and rejects others", () => {
    for (const f of ["csv", "sentinel", "purview", "defender", "jira", "servicenow"]) {
      expect(isExportFormat(f)).toBe(true);
    }
    expect(isExportFormat("pdf")).toBe(false);
    expect(isExportFormat("toString")).toBe(false);
  });

  it("runExport dispatches to the matching exporter", () => {
    for (const format of Object.keys(EXPORTERS) as ExportFormat[]) {
      const direct = EXPORTERS[format](scanResult, ctx);
      const dispatched = runExport(format, scanResult, ctx);
      expect(dispatched.body).toBe(direct.body);
      expect(dispatched.contentType).toBe(direct.contentType);
      expect(dispatched.filename).toBe(direct.filename);
    }
  });
});
