import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DrizzleStore, enqueueJob } from "@cel/api";
import { type Database, jobs, reports, schema } from "@cel/db";
import { PGlite } from "@electric-sql/pglite";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { cleanup } from "./cleanup.js";
import { drain, pollOnce } from "./poller.js";
import { tickSchedules } from "./scheduler.js";

/** Verifies the queue SQL (enqueue -> claim -> complete) over real Postgres (pglite). */
let db: Database;
let store: DrizzleStore;

beforeAll(async () => {
  const client = new PGlite();
  const d = drizzle(client, { schema });
  const here = dirname(fileURLToPath(import.meta.url));
  const migDir = resolve(here, "../../../packages/db/drizzle");
  for (const f of readdirSync(migDir)
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    await client.exec(readFileSync(resolve(migDir, f), "utf8"));
  }
  db = d as unknown as Database;
  store = new DrizzleStore(db);
  await store.createWorkspace({ id: "ws-job", name: "Acme" });
  await store.seedDemo("ws-job");
});

describe("worker queue (pglite)", () => {
  it("processes a queued scan job to completion", async () => {
    const id = await enqueueJob(db, "ws-job", "scan");
    const handled = await pollOnce(db, store);
    expect(handled).toBe(true);
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    expect(job!.status).toBe("completed");
    expect(await store.listFindings("ws-job")).toHaveLength(9);
  });

  it("returns false when the queue is empty", async () => {
    await drain(db, store);
    expect(await pollOnce(db, store)).toBe(false);
  });

  it("marks an unknown job type failed", async () => {
    const id = await enqueueJob(db, "ws-job", "bogus");
    await pollOnce(db, store);
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    expect(job!.status).toBe("failed");
    expect(job!.error).toContain("unknown job type");
  });
});

describe("scheduler tick (pglite)", () => {
  it("enqueues a scan job for a due schedule and advances its nextRunAt", async () => {
    const schedule = await store.createSchedule("ws-job", {
      name: "Due scan",
      action: "scan",
      cadenceMinutes: 1440,
      nextRunAt: "2020-01-01T00:00:00.000Z", // in the past => due
    });

    const now = "2026-06-21T00:00:00.000Z";
    const enqueued = await tickSchedules(db, store, { now });
    expect(enqueued).toBeGreaterThanOrEqual(1);

    // A queued scan job now exists for the workspace.
    const queued = await db
      .select()
      .from(jobs)
      .where(eq(jobs.status, "queued"));
    expect(queued.some((j) => j.workspaceId === "ws-job" && j.type === "scan")).toBe(true);

    // The schedule's nextRunAt advanced past now (now + cadence).
    // (PGlite renders `timestamptz` in its own format, so compare by instant.)
    const [after] = await store.listSchedules("ws-job").then((all) => all.filter((s) => s.id === schedule.id));
    expect(new Date(after!.lastRunAt!).getTime()).toBe(new Date(now).getTime());
    expect(new Date(after!.nextRunAt).getTime()).toBeGreaterThan(new Date(now).getTime());

    // A second tick at the same `now` finds nothing due.
    expect(await tickSchedules(db, store, { now })).toBe(0);
  });
});

describe("cleanup retention (pglite)", () => {
  it("deletes finished jobs and reports older than the cutoffs", async () => {
    await db.insert(jobs).values({
      id: "job-old",
      workspaceId: "ws-job",
      type: "scan",
      status: "completed",
      createdAt: "2020-01-01T00:00:00.000Z",
    });
    await db.insert(reports).values({
      id: "rep-old",
      workspaceId: "ws-job",
      format: "markdown",
      generatedAt: "2020-01-01T00:00:00.000Z",
      scenarioRunIds: [],
      findingIds: [],
    });
    const result = await cleanup(db, { now: "2026-06-21T00:00:00.000Z" });
    expect(result.jobsDeleted).toBeGreaterThanOrEqual(1);
    expect(result.reportsDeleted).toBeGreaterThanOrEqual(1);
    expect((await db.select().from(reports).where(eq(reports.id, "rep-old"))).length).toBe(0);
  });
});
