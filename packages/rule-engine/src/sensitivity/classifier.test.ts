import type { Resource } from "@cel/types";
import { describe, expect, it } from "vitest";
import { classifySensitivity } from "./classifier.js";

function file(over: Partial<Resource>): Resource {
  return {
    id: "r",
    sourceId: "s",
    kind: "file",
    name: "x.docx",
    sensitivityTags: [],
    agentActions: [],
    connectors: [],
    ...over,
  };
}

describe("classifySensitivity", () => {
  it("scores a salary plan very high", () => {
    const r = classifySensitivity(file({ name: "2026_salary_plan.xlsx", path: "/HR/Compensation/2026_salary_plan.xlsx" }));
    expect(r.rawScore).toBeGreaterThan(0.9);
    expect(r.signals.map((s) => s.signal)).toEqual(expect.arrayContaining(["salary", "compensation"]));
  });

  it("scores a secrets/token doc high via tags", () => {
    const r = classifySensitivity(
      file({ name: "token_rotation_notes.docx", sensitivityTags: ["token", "secret", "password"] }),
    );
    expect(r.rawScore).toBeGreaterThanOrEqual(0.9);
  });

  it("scores a generic product doc low", () => {
    const r = classifySensitivity(file({ name: "roadmap_notes.docx", path: "/Product/roadmap_notes.docx" }));
    expect(r.rawScore).toBeLessThan(0.3);
  });

  it("raises sensitivity from a Highly Confidential label", () => {
    const r = classifySensitivity(file({ name: "deck.pptx", sensitivityLabel: "Highly Confidential" }));
    expect(r.rawScore).toBeGreaterThanOrEqual(0.9);
  });

  it("attaches the resource id as the source object on every signal", () => {
    const r = classifySensitivity(file({ id: "f-salary", name: "salary.xlsx" }));
    expect(r.signals.every((s) => s.sourceObjectId === "f-salary")).toBe(true);
  });

  it("does not match substrings across word boundaries", () => {
    // "secretary" must not trigger the "secret" signal.
    const r = classifySensitivity(file({ name: "secretary_schedule.xlsx" }));
    expect(r.signals.some((s) => s.signal === "secret")).toBe(false);
  });
});
