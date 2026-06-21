import { type Store, enqueueJob } from "@cel/api";
import type { Database } from "@cel/db";

const nowIso = (): string => new Date().toISOString();

/** now + minutes, as an ISO string. */
const addMinutes = (iso: string, minutes: number): string =>
  new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();

/**
 * Enqueue a job for every schedule that is due, then advance each schedule's
 * nextRunAt. Deterministic: `now` is injectable and schedules fire in a stable
 * order (see Store.dueSchedules). Returns how many jobs were enqueued.
 */
export async function tickSchedules(
  db: Database,
  store: Store,
  opts: { now?: string } = {},
): Promise<number> {
  const now = opts.now ?? nowIso();
  const due = await store.dueSchedules(now);
  let enqueued = 0;
  for (const schedule of due) {
    await enqueueJob(db, schedule.workspaceId, schedule.action);
    await store.markScheduleRan(schedule.id, now, addMinutes(now, schedule.cadenceMinutes));
    enqueued += 1;
  }
  return enqueued;
}
