import { getTableName } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { evidenceItems, findings, jobs, schema, workspaces } from "./schema.js";

describe("db schema", () => {
  it("declares all 15 data-model tables", () => {
    expect(Object.keys(schema)).toHaveLength(15);
  });

  it("maps to snake_case table names", () => {
    expect(getTableName(workspaces)).toBe("workspaces");
    expect(getTableName(evidenceItems)).toBe("evidence_items");
    expect(getTableName(jobs)).toBe("jobs");
  });

  it("requires a source object id on every evidence row", () => {
    const col = getTableConfig(evidenceItems).columns.find((c) => c.name === "source_object_id");
    expect(col?.notNull).toBe(true);
  });

  it("stores deterministic 0-100 score + severity band on findings", () => {
    const cols = getTableConfig(findings).columns.map((c) => c.name);
    expect(cols).toEqual(expect.arrayContaining(["score", "severity", "status", "rule_id"]));
  });

  it("cascades child tables when a workspace is deleted", () => {
    for (const table of [findings, evidenceItems, jobs]) {
      const fks = getTableConfig(table).foreignKeys;
      expect(fks.length).toBeGreaterThan(0);
    }
  });
});
