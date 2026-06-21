import { loadSeedGraph } from "@cel/graph-client";
import { describe, expect, it } from "vitest";
import { buildPermissionGraph } from "./permission-graph.js";

const graph = loadSeedGraph();
const pg = buildPermissionGraph(graph);

describe("PermissionGraph — membership & breadth", () => {
  it("expands 'Everyone Except External Users' to 7 active internal users", () => {
    const members = pg.membersOf("g-everyone");
    expect(members).toHaveLength(7);
    expect(members.map((m) => m.id)).toContain("u-bob");
    expect(members.map((m) => m.id)).not.toContain("u-dev");
    expect(members.map((m) => m.id)).not.toContain("u-tomas");
  });

  it("uses memberCount for large groups whose members aren't enumerated", () => {
    expect(pg.breadthOf("g-sales")).toBe(42);
    expect(pg.breadthOf("g-everyone")).toBe(7);
    expect(pg.breadthOf("u-bob")).toBe(1);
  });
});

describe("PermissionGraph — inheritance", () => {
  it("resolves the parent site of a file", () => {
    expect(pg.ancestorsOf("f-salary").map((r) => r.id)).toEqual(["s-hr"]);
    expect(pg.ancestorsOf("f-acq").map((r) => r.id)).toEqual(["s-board"]);
  });

  it("inherits the broad board-site grant down to the acquisition deck", () => {
    const access = pg.effectiveAccess("f-acq");
    const inherited = access.find((a) => a.inheritedFrom === "s-board" && a.principalId === "g-everyone");
    expect(inherited).toBeDefined();
    expect(inherited!.breadth).toBe(7);
  });

  it("inherits the broad Sales grant down to the master services agreement (breadth 42)", () => {
    const access = pg.effectiveAccess("f-msa");
    const sales = access.find((a) => a.principalId === "g-sales" && a.inheritedFrom === "s-contracts");
    expect(sales).toBeDefined();
    expect(sales!.breadth).toBe(42);
  });
});

describe("PermissionGraph — effective access & audiences", () => {
  it("flags the salary file as org-wide reachable, including Bob", () => {
    const access = pg.effectiveAccess("f-salary");
    const orgwide = access.find((a) => a.via === "orgwide");
    expect(orgwide).toBeDefined();
    expect(orgwide!.audience).toBe("org-wide");
    expect(orgwide!.reachableUserIds).toContain("u-bob");
  });

  it("classifies the contractor's Project Phoenix access as external", () => {
    const access = pg.effectiveAccess("s-phoenix");
    const guest = access.find((a) => a.principalId === "u-dev");
    expect(guest!.audience).toBe("external");
    expect(guest!.via).toBe("guest");
  });
});

describe("PermissionGraph — exposure path (the hero path)", () => {
  it("builds Bob -> Everyone -> org-wide link -> salary file", () => {
    const orgwide = pg.effectiveAccess("f-salary").find((a) => a.via === "orgwide")!;
    const path = pg.buildExposurePath(orgwide, "f-salary", "u-bob");
    expect(path.via).toBe("orgwide");
    expect(path.steps.map((s) => s.objectType)).toEqual(["user", "group", "link", "file"]);
    expect(path.steps.map((s) => s.label)).toEqual([
      "Bob Novak",
      "Everyone Except External Users",
      "organization-wide link",
      "2026_salary_plan.xlsx",
    ]);
    expect(path.steps[0]!.relation).toBe("member of");
  });

  it("builds an inherited path with an 'inherited by' edge", () => {
    const inherited = pg.effectiveAccess("f-acq").find((a) => a.inheritedFrom === "s-board")!;
    const path = pg.buildExposurePath(inherited, "f-acq", "u-bob");
    expect(path.steps.some((s) => s.relation === "inherited by")).toBe(true);
    expect(path.steps[path.steps.length - 1]!.objectId).toBe("f-acq");
  });
});
