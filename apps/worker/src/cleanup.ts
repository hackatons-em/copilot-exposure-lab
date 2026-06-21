import { type Database, jobs, reports } from "@cel/db";
import { and, inArray, lt } from "drizzle-orm";

export interface CleanupResult {
  jobsDeleted: number;
  reportsDeleted: number;
}

const DAY_MS = 86_400_000;

/** Retention: drop finished jobs and reports older than their cutoffs. */
export async function cleanup(
  db: Database,
  opts: { jobRetentionDays?: number; reportRetentionDays?: number; now?: string } = {},
): Promise<CleanupResult> {
  const now = opts.now ? new Date(opts.now) : new Date();
  const jobCutoff = new Date(now.getTime() - (opts.jobRetentionDays ?? 7) * DAY_MS).toISOString();
  const reportCutoff = new Date(now.getTime() - (opts.reportRetentionDays ?? 30) * DAY_MS).toISOString();

  const delJobs = await db
    .delete(jobs)
    .where(and(inArray(jobs.status, ["completed", "failed", "canceled"]), lt(jobs.createdAt, jobCutoff)))
    .returning({ id: jobs.id });
  const delReports = await db
    .delete(reports)
    .where(lt(reports.generatedAt, reportCutoff))
    .returning({ id: reports.id });

  return { jobsDeleted: delJobs.length, reportsDeleted: delReports.length };
}
