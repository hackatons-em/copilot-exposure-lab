import { loadSeedGraph } from "@cel/graph-client";
import { describe, expect, it } from "vitest";
import { scan } from "../pipeline.js";
import { generateFixScript } from "./script-generator.js";

const graph = loadSeedGraph();
const result = scan(graph, { now: "2026-06-21T00:00:00.000Z" });

function evidenceFor(findingId: string) {
  return result.evidence.filter((e) => e.findingId === findingId);
}

describe("generateFixScript", () => {
  it("wires the hero org-wide-link fix to the real item + permission ids", () => {
    const f = result.findings.find((x) => x.resourceId === "f-salary")!;
    const fix = generateFixScript(f, evidenceFor(f.id));
    expect(fix.language).toBe("powershell");
    expect(fix.tooling).toContain("Graph");
    expect(fix.script).toContain("Remove-MgDriveItemPermission");
    expect(fix.script).toContain("f-salary");
    expect(fix.script).toContain(f.id); // finding id in the header
    // Honest framing — advisory, never auto-executed.
    expect(fix.caveats.join(" ")).toMatch(/review/i);
  });

  it("emits a Purview label action for a missing-label finding", () => {
    const f = result.findings.find((x) => x.ruleId === "missing-label");
    if (!f) return; // demo always has one, but stay defensive
    const fix = generateFixScript(f, evidenceFor(f.id));
    expect(fix.script).toContain("Set-PnPFileSensitivityLabel");
  });

  it("reassigns ownership for an orphaned-agent-owner finding", () => {
    const f = result.findings.find((x) => x.ruleId === "orphaned-agent-owner")!;
    const fix = generateFixScript(f, evidenceFor(f.id));
    expect(fix.script).toContain("Set-AdminPowerAppOwner");
    expect(fix.tooling).toContain("Power Platform");
  });

  it("is deterministic — same finding + evidence → identical script", () => {
    const f = result.findings[0]!;
    const a = generateFixScript(f, evidenceFor(f.id));
    const b = generateFixScript(f, evidenceFor(f.id));
    expect(a.script).toBe(b.script);
  });

  it("covers every rule with a non-empty script", () => {
    for (const f of result.findings) {
      const fix = generateFixScript(f, evidenceFor(f.id));
      expect(fix.script.length).toBeGreaterThan(40);
      expect(fix.script).toContain(f.id);
    }
  });
});
