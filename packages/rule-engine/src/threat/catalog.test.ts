import { describe, expect, it } from "vitest";
import { allRules } from "../rules/index.js";
import { buildThreatModel, threatFor } from "./catalog.js";

describe("threat catalog", () => {
  it("maps every registered rule to a threat mapping", () => {
    for (const rule of allRules) {
      const m = threatFor(rule.id);
      expect(m).toBeDefined();
      // Every rule has at least one control; only governance-gap rules may lack techniques.
      expect(m.controls.length).toBeGreaterThan(0);
    }
  });

  it("maps the hero org-wide-link rule to SharePoint collection + least privilege", () => {
    const m = threatFor("org-wide-link");
    expect(m.techniques.map((t) => t.id)).toContain("T1213.002");
    expect(m.controls.map((c) => c.id)).toContain("AC-6");
  });

  it("builds canonical MITRE URLs, including for sub-techniques", () => {
    const sp = threatFor("org-wide-link").techniques.find((t) => t.id === "T1213.002");
    expect(sp?.url).toBe("https://attack.mitre.org/techniques/T1213/002/");
  });

  it("keeps missing-label honest — a governance gap with controls but no technique", () => {
    const m = threatFor("missing-label");
    expect(m.techniques).toHaveLength(0);
    expect(m.controls.length).toBeGreaterThan(0);
  });

  it("returns an empty mapping for an unknown rule (never throws)", () => {
    expect(threatFor("does-not-exist")).toEqual({ techniques: [], controls: [] });
  });

  it("builds a deduped, sorted threat-model matrix over the rule registry", () => {
    const model = buildThreatModel(allRules);
    expect(model.rows).toHaveLength(allRules.length);
    // Techniques sorted by id, no duplicates.
    const ids = model.techniques.map((t) => t.id);
    expect(ids).toEqual([...ids].sort());
    expect(new Set(ids).size).toBe(ids.length);
    expect(model.controls.some((c) => c.id === "AC-6")).toBe(true);
  });
});
