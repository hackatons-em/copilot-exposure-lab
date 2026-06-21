import { loadSeedGraph } from "@cel/graph-client";
import { describe, expect, it } from "vitest";
import { runScenario, scan } from "./pipeline.js";

const graph = loadSeedGraph();
const NOW = "2026-06-21T00:00:00.000Z";
const result = scan(graph, { now: NOW });

describe("scan — golden output over the Acme demo seed", () => {
  it("produces the exact deterministic findings table", () => {
    const table = result.findings.map((f) => `${f.risk.total} ${f.risk.band} ${f.ruleId} ${f.resourceId}`).join("\n");
    expect(table).toBe(
      [
        "91 critical org-wide-link f-salary",
        "75 high inherited-broad-read f-acq",
        "71 high agent-send-action a-helpdesk",
        "70 high stale-external-access s-phoenix",
        "70 high broad-dept-access f-msa",
        "66 medium broad-dept-access f-launch",
        "59 medium orphaned-agent-owner a-helpdesk",
        "55 medium risky-connector a-salesflow",
        "55 medium missing-label f-token",
      ].join("\n"),
    );
  });

  it("surfaces at least 5 critical/high findings (demo bar)", () => {
    const critHigh = result.findings.filter((f) => f.risk.band === "critical" || f.risk.band === "high");
    expect(critHigh.length).toBeGreaterThanOrEqual(5);
  });

  it("is fully deterministic (same seed + now -> identical result)", () => {
    expect(scan(graph, { now: NOW })).toEqual(result);
  });
});

describe("scan — invariants (non-negotiable)", () => {
  it("every evidence item has a sourceObjectId", () => {
    expect(result.evidence.length).toBeGreaterThan(0);
    expect(result.evidence.every((e) => Boolean(e.sourceObjectId))).toBe(true);
  });

  it("every finding has evidence and a remediation task", () => {
    for (const f of result.findings) {
      expect(f.evidenceIds.length).toBeGreaterThan(0);
      expect(f.remediationTaskId).toBeTruthy();
      expect(result.remediationTasks.some((t) => t.id === f.remediationTaskId)).toBe(true);
    }
  });

  it("the hero finding traces Bob -> Everyone -> org-wide link -> salary file", () => {
    const salary = result.findings.find((f) => f.resourceId === "f-salary")!;
    expect(salary.risk.band).toBe("critical");
    expect(salary.exposurePath!.steps.map((s) => s.label)).toEqual([
      "Bob Novak",
      "Everyone Except External Users",
      "organization-wide link",
      "2026_salary_plan.xlsx",
    ]);
  });
});

describe("scenarios", () => {
  it("normal-employee surfaces only what Bob can reach (salary + board, not Sales-only contracts)", () => {
    const run = runScenario(graph, "normal-employee", { now: NOW });
    const resourceIds = run.findings.map((f) => f.resourceId);
    expect(resourceIds).toContain("f-salary");
    expect(resourceIds).toContain("f-acq");
    expect(resourceIds).not.toContain("f-msa");
  });

  it("agent-action surfaces only the agent findings", () => {
    const run = runScenario(graph, "agent-action", { now: NOW });
    expect(run.findings.every((f) => f.resourceId === "a-helpdesk")).toBe(true);
    expect(run.findings.length).toBe(2);
  });

  it("contractor-guest surfaces the stale external access", () => {
    const run = runScenario(graph, "contractor-guest", { now: NOW });
    expect(run.findings.some((f) => f.ruleId === "stale-external-access")).toBe(true);
  });
});

describe("proof-of-fix", () => {
  it("marks a remediated finding resolved on rerun", () => {
    const salaryId = result.findings.find((f) => f.resourceId === "f-salary")!.id;
    const rerun = scan(graph, { now: NOW, appliedFixes: [salaryId] });
    const salary = rerun.findings.find((f) => f.id === salaryId)!;
    expect(salary.status).toBe("resolved");
    const task = rerun.remediationTasks.find((t) => t.id === salary.remediationTaskId)!;
    expect(task.status).toBe("done");
    expect(task.fixVerified).toBe(true);
  });
});
