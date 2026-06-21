import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { type Database, schema } from "@cel/db";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { DrizzleStore } from "./store/drizzle.js";

/**
 * Exercises the real Postgres path (DrizzleStore + the generated migration SQL)
 * in-process via PGlite — no Docker needed. This is what proves the database
 * code works before the user runs docker compose / deploys to Azure.
 */
let store: DrizzleStore;

beforeAll(async () => {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  const here = dirname(fileURLToPath(import.meta.url));
  const migDir = resolve(here, "../../../packages/db/drizzle");
  const sqlFile = readdirSync(migDir).find((f) => f.endsWith(".sql"));
  if (!sqlFile) throw new Error("no migration SQL found");
  await client.exec(readFileSync(resolve(migDir, sqlFile), "utf8"));
  store = new DrizzleStore(db as unknown as Database);
});

describe("DrizzleStore over a real (pglite) Postgres", () => {
  it("creates a workspace and seeds the demo company", async () => {
    await store.createWorkspace({ id: "ws-pg", name: "Acme Health Finance Ltd" });
    const seeded = await store.seedDemo("ws-pg");
    expect(seeded.counts.resources).toBe(14);
    expect(seeded.counts.principals).toBe(17);
  });

  it("runs a scan and persists 9 findings (1 critical, 4 high, 4 medium)", async () => {
    const summary = await store.runScan("ws-pg");
    expect(summary.findingCount).toBe(9);
    expect(summary.bands.critical).toBe(1);
    expect(summary.bands.high).toBe(4);
  });

  it("reads back findings with persisted evidence + remediation", async () => {
    const findings = await store.listFindings("ws-pg", { severity: "critical" });
    expect(findings).toHaveLength(1);
    const detail = await store.getFinding("ws-pg", findings[0]!.id);
    expect(detail!.evidence.every((e) => Boolean(e.sourceObjectId))).toBe(true);
    expect(detail!.remediation).toBeTruthy();
    expect(detail!.finding.exposurePath!.steps[0]!.label).toBe("Bob Novak");
  });

  it("applies a fix and keeps it resolved across a re-scan (proof-of-fix)", async () => {
    const [critical] = await store.listFindings("ws-pg", { severity: "critical" });
    await store.updateFinding("ws-pg", critical!.id, { applyFix: true });
    const afterFix = await store.getFinding("ws-pg", critical!.id);
    expect(afterFix!.finding.status).toBe("resolved");
    // Re-scan: the previously-resolved finding stays resolved.
    await store.runScan("ws-pg");
    const afterRescan = await store.getFinding("ws-pg", critical!.id);
    expect(afterRescan!.finding.status).toBe("resolved");
  });

  it("generates a downloadable report", async () => {
    const report = await store.createReport("ws-pg", "markdown");
    const content = await store.getReportContent("ws-pg", report.id);
    expect(content!.content).toContain("# Copilot Exposure Assessment Report");
  });

  it("cascades all data when the workspace is deleted", async () => {
    await store.deleteWorkspace("ws-pg");
    expect(await store.getWorkspace("ws-pg")).toBeUndefined();
    expect(await store.listFindings("ws-pg")).toHaveLength(0);
  });
});
