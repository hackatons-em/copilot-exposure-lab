import { scan } from "@cel/rule-engine";
import type { TenantGraph } from "@cel/types";
import { describe, expect, it } from "vitest";
import { GoogleWorkspaceClient, loadGoogleWorkspaceGraph } from "./google-workspace-client.js";
import { MultiSystemClient, loadMultiSystemGraph } from "./multi-system-client.js";
import { SalesforceClient, loadSalesforceGraph } from "./salesforce-client.js";
import { SlackClient, loadSlackGraph } from "./slack-client.js";

const NOW = "2026-06-21T00:00:00.000Z";

/** A connector seed produces >= 3 findings including at least one critical/high. */
function expectMeaningfulFindings(graph: TenantGraph): ReturnType<typeof scan> {
  const result = scan(graph, { now: NOW });
  expect(result.findings.length).toBeGreaterThanOrEqual(3);
  expect(result.findings.some((f) => f.risk.band === "critical" || f.risk.band === "high")).toBe(true);
  return result;
}

describe("Google Workspace connector", () => {
  const graph = loadGoogleWorkspaceGraph();

  it("validates against @cel/types and reports its mode", async () => {
    const client = new GoogleWorkspaceClient();
    expect(client.mode).toBe("google-workspace");
    expect((await client.loadTenantGraph()).connection.mode).toBe("google-workspace");
  });

  it("tags every resource with system:google", () => {
    expect(graph.resources.every((r) => r.sensitivityTags.includes("system:google"))).toBe(true);
  });

  it("scans to >= 3 findings incl. critical/high through the unchanged engine", () => {
    const result = expectMeaningfulFindings(graph);
    const ruleIds = new Set(result.findings.map((f) => f.ruleId));
    // The anyone-with-the-link salary sheet is the critical org-wide-link finding.
    expect(ruleIds.has("org-wide-link")).toBe(true);
    expect(result.findings.some((f) => f.resourceId === "gws-f-salary" && f.risk.band === "critical")).toBe(true);
  });
});

describe("Slack connector", () => {
  const graph = loadSlackGraph();

  it("validates against @cel/types and reports its mode", async () => {
    const client = new SlackClient();
    expect(client.mode).toBe("slack");
    expect((await client.loadTenantGraph()).connection.mode).toBe("slack");
  });

  it("tags every resource with system:slack", () => {
    expect(graph.resources.every((r) => r.sensitivityTags.includes("system:slack"))).toBe(true);
  });

  it("scans to >= 3 findings incl. critical/high through the unchanged engine", () => {
    const result = expectMeaningfulFindings(graph);
    const ruleIds = new Set(result.findings.map((f) => f.ruleId));
    // Public-channel file inherits broad read; Slack Connect retains external access.
    expect(ruleIds.has("stale-external-access")).toBe(true);
  });
});

describe("Salesforce connector", () => {
  const graph = loadSalesforceGraph();

  it("validates against @cel/types and reports its mode", async () => {
    const client = new SalesforceClient();
    expect(client.mode).toBe("salesforce");
    expect((await client.loadTenantGraph()).connection.mode).toBe("salesforce");
  });

  it("tags every resource with system:salesforce", () => {
    expect(graph.resources.every((r) => r.sensitivityTags.includes("system:salesforce"))).toBe(true);
  });

  it("scans to >= 3 findings incl. critical/high through the unchanged engine", () => {
    const result = expectMeaningfulFindings(graph);
    const ruleIds = new Set(result.findings.map((f) => f.ruleId));
    // Org-wide-default read of the executive compensation report.
    expect(ruleIds.has("org-wide-link")).toBe(true);
  });
});

describe("MultiSystemClient (M365 + Google + Slack + Salesforce)", () => {
  const merged = loadMultiSystemGraph();

  it("merges to a graph whose counts equal the sum of the parts", async () => {
    const { loadSeedGraph } = await import("../seed-graph-client.js");
    const parts = [loadSeedGraph(), loadGoogleWorkspaceGraph(), loadSlackGraph(), loadSalesforceGraph()];
    const sum = (key: "principals" | "resources" | "grants"): number =>
      parts.reduce((n, g) => n + g[key].length, 0);
    expect(merged.principals.length).toBe(sum("principals"));
    expect(merged.resources.length).toBe(sum("resources"));
    expect(merged.grants.length).toBe(sum("grants"));
    expect(merged.connection.mode).toBe("multi-system");
  });

  it("carries every system tag and a multi-system mode", async () => {
    const client = new MultiSystemClient();
    expect(client.mode).toBe("multi-system");
    const tags = new Set(merged.resources.flatMap((r) => r.sensitivityTags.filter((t) => t.startsWith("system:"))));
    expect(tags).toEqual(new Set(["system:microsoft", "system:google", "system:slack", "system:salesforce"]));
  });

  it("scans to findings spanning all four systems", () => {
    const result = scan(merged, { now: NOW });
    expect(result.findings.length).toBeGreaterThanOrEqual(9);
    const systemsHit = new Set<string>();
    for (const f of result.findings) {
      const resource = merged.resources.find((r) => r.id === f.resourceId);
      for (const t of resource?.sensitivityTags ?? []) {
        if (t.startsWith("system:")) systemsHit.add(t);
      }
    }
    expect(systemsHit).toEqual(new Set(["system:microsoft", "system:google", "system:slack", "system:salesforce"]));
  });
});
