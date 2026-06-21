import type { Store } from "@cel/api";
import { type Database, jobs } from "@cel/db";
import { asc, eq } from "drizzle-orm";
import { type Job, dispatch } from "./handlers.js";

const nowIso = (): string => new Date().toISOString();

/** Claim and process one queued job. Returns false when the queue is empty. */
export async function pollOnce(db: Database, store: Store): Promise<boolean> {
  const [queued] = await db
    .select()
    .from(jobs)
    .where(eq(jobs.status, "queued"))
    .orderBy(asc(jobs.createdAt))
    .limit(1);
  if (!queued) return false;

  await db
    .update(jobs)
    .set({ status: "running", startedAt: nowIso(), attempts: queued.attempts + 1 })
    .where(eq(jobs.id, queued.id));

  const job: Job = { id: queued.id, workspaceId: queued.workspaceId, type: queued.type, payload: queued.payload };
  const res = await dispatch(store, job);

  await db
    .update(jobs)
    .set({
      status: res.ok ? "completed" : "failed",
      error: res.ok ? null : res.error,
      checkpoint: res.ok ? ((res.detail as Record<string, unknown> | undefined) ?? null) : queued.checkpoint,
      finishedAt: nowIso(),
    })
    .where(eq(jobs.id, queued.id));
  return true;
}

/** Drain all currently-queued jobs. Returns how many were processed. */
export async function drain(db: Database, store: Store): Promise<number> {
  let processed = 0;
  while (await pollOnce(db, store)) processed += 1;
  return processed;
}
