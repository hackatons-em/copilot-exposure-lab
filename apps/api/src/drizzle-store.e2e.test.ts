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
  const sqlFiles = readdirSync(migDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  if (sqlFiles.length === 0) throw new Error("no migration SQL found");
  for (const f of sqlFiles) {
    await client.exec(readFileSync(resolve(migDir, f), "utf8"));
  }
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

  it("records exposure snapshots + drift across scans", async () => {
    // Two scans have run by now (initial + the proof-of-fix re-scan).
    const snaps = await store.listSnapshots("ws-pg");
    expect(snaps.length).toBeGreaterThanOrEqual(2);
    const drift = await store.getDrift("ws-pg");
    expect(drift).toBeDefined();
    expect(drift!.scoreDelta).toBeLessThanOrEqual(0); // fix lowered exposure
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

describe("DrizzleStore — schedule CRUD (store level)", () => {
  beforeAll(async () => {
    await store.createWorkspace({ id: "ws-sched", name: "Schedule Co" });
  });

  it("creates a schedule with a default next run", async () => {
    const s = await store.createSchedule("ws-sched", { name: "Nightly scan", cadenceMinutes: 60 });
    expect(s.id).toMatch(/^sch-/);
    expect(s.action).toBe("scan");
    expect(s.enabled).toBe(true);
    expect(s.nextRunAt).toBeTruthy();
    expect(await store.listSchedules("ws-sched")).toHaveLength(1);
  });

  it("updates a schedule (rename + disable)", async () => {
    const [s] = await store.listSchedules("ws-sched");
    const updated = await store.updateSchedule("ws-sched", s!.id, { name: "Weekly report", enabled: false });
    expect(updated!.name).toBe("Weekly report");
    expect(updated!.enabled).toBe(false);
  });

  it("excludes disabled schedules from the due set, includes enabled past-due ones", async () => {
    // The one above is disabled — never due. Add an enabled one already past due.
    const due = await store.createSchedule("ws-sched", {
      name: "Past due",
      cadenceMinutes: 30,
      nextRunAt: "2000-01-01T00:00:00.000Z",
    });
    const dueNow = await store.dueSchedules("2026-06-21T00:00:00.000Z");
    const ids = dueNow.map((d) => d.id);
    expect(ids).toContain(due.id);
    expect(dueNow.every((d) => d.enabled)).toBe(true);
  });

  it("advances nextRunAt after a run", async () => {
    const [s] = (await store.listSchedules("ws-sched")).filter((x) => x.enabled);
    const next = "2026-07-01T00:00:00.000Z";
    await store.markScheduleRan(s!.id, "2026-06-21T00:00:00.000Z", next);
    const after = (await store.listSchedules("ws-sched")).find((x) => x.id === s!.id);
    // Postgres normalizes the timestamp text, so compare by instant, not exact string.
    expect(new Date(after!.nextRunAt).getTime()).toBe(new Date(next).getTime());
    expect(new Date(after!.lastRunAt!).getTime()).toBe(new Date("2026-06-21T00:00:00.000Z").getTime());
  });

  it("deletes a schedule", async () => {
    const before = await store.listSchedules("ws-sched");
    const ok = await store.deleteSchedule("ws-sched", before[0]!.id);
    expect(ok).toBe(true);
    expect(await store.listSchedules("ws-sched")).toHaveLength(before.length - 1);
  });
});
