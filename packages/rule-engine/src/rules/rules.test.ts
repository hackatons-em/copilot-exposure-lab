import { loadSeedGraph } from "@cel/graph-client";
import { describe, expect, it } from "vitest";
import { createRuleContext } from "../context.js";
import {
  agentSendActionRule,
  allRules,
  broadDeptAccessRule,
  inheritedBroadReadRule,
  missingLabelRule,
  orgWideLinkRule,
  orphanedAgentOwnerRule,
  staleExternalAccessRule,
} from "./index.js";

const graph = loadSeedGraph();
const ctx = createRuleContext(graph, { now: "2026-06-21T00:00:00.000Z", actorId: "u-bob" });

describe("org-wide-link rule", () => {
  const hits = orgWideLinkRule.evaluate(ctx);
  it("fires once, on the salary file", () => {
    expect(hits).toHaveLength(1);
    expect(hits[0]!.resourceId).toBe("f-salary");
  });
  it("emits link evidence and full org-wide exposure breadth", () => {
    const hit = hits[0]!;
    expect(hit.evidence.some((e) => e.kind === "link" && /organization-wide/.test(e.statement))).toBe(true);
    expect(hit.scoring.exposureBreadth).toBe(1);
    expect(hit.exposurePath!.steps.map((s) => s.objectType)).toEqual(["user", "group", "link", "file"]);
  });
});

describe("broad-dept-access rule", () => {
  const hits = broadDeptAccessRule.evaluate(ctx);
  it("flags the master services agreement for the broad Sales group", () => {
    const msa = hits.find((h) => h.resourceId === "f-msa");
    expect(msa).toBeDefined();
    expect(msa!.evidence.some((e) => /Sales Team/.test(e.statement) && /42/.test(e.statement))).toBe(true);
  });
});

describe("inherited-broad-read rule", () => {
  const hits = inheritedBroadReadRule.evaluate(ctx);
  it("flags the acquisition deck inheriting whole-org read from Board Room", () => {
    expect(hits.some((h) => h.resourceId === "f-acq")).toBe(true);
  });
});

describe("stale-external-access rule", () => {
  const hits = staleExternalAccessRule.evaluate(ctx);
  it("flags the contractor's expired access to Project Phoenix", () => {
    const hit = hits.find((h) => h.resourceId === "s-phoenix" && h.principalId === "u-dev");
    expect(hit).toBeDefined();
    expect(hit!.evidence.some((e) => /expired/i.test(e.statement))).toBe(true);
    expect(hit!.scoring.confidence).toBe(1);
  });
});

describe("missing-label rule", () => {
  const hits = missingLabelRule.evaluate(ctx);
  it("flags the unlabeled security/token document", () => {
    expect(hits.some((h) => h.resourceId === "f-token")).toBe(true);
    // labeled sensitive files must not be flagged
    expect(hits.some((h) => h.resourceId === "f-salary")).toBe(false);
  });
});

describe("agent-send-action rule", () => {
  const hits = agentSendActionRule.evaluate(ctx);
  it("flags the helpdesk agent's mail.send capability", () => {
    const hit = hits.find((h) => h.resourceId === "a-helpdesk");
    expect(hit).toBeDefined();
    expect(hit!.scoring.agentActionRisk).toBeGreaterThan(0.7);
  });
});

describe("orphaned-agent-owner rule", () => {
  const hits = orphanedAgentOwnerRule.evaluate(ctx);
  it("flags the helpdesk agent owned by an offboarded maker", () => {
    const hit = hits.find((h) => h.resourceId === "a-helpdesk");
    expect(hit).toBeDefined();
    expect(hit!.principalId).toBe("u-tomas");
  });
});

describe("every rule, every hit", () => {
  const allHits = allRules.flatMap((r) => r.evaluate(ctx));

  it("produces at least 7 hits across the demo dataset", () => {
    expect(allHits.length).toBeGreaterThanOrEqual(7);
  });

  it("never emits evidence without a non-empty sourceObjectId", () => {
    for (const hit of allHits) {
      expect(hit.evidence.length).toBeGreaterThan(0);
      for (const e of hit.evidence) {
        expect(e.sourceObjectId).toBeTruthy();
      }
    }
  });

  it("keeps every scoring input within 0..1", () => {
    for (const hit of allHits) {
      for (const v of Object.values(hit.scoring)) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });
});
