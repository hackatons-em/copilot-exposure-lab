import type { Store } from "@cel/api";
import type { Database } from "@cel/db";
import type { ReportFormat } from "@cel/types";
import type { BlobUploader } from "./blob.js";
import { cleanup } from "./cleanup.js";

export interface Job {
  id: string;
  workspaceId: string;
  type: string;
  payload: Record<string, unknown>;
}

export type JobResult = { ok: true; detail?: unknown } | { ok: false; error: string };

/** Everything a job handler may need. blob/db are optional (absent in unit tests). */
export interface JobContext {
  store: Store;
  blob?: BlobUploader;
  db?: Database;
  /** Injected time for deterministic retention cutoffs. */
  now?: string;
}

/**
 * Pure job dispatch over a JobContext — independent of the queue transport, so
 * it's unit-testable with any Store + an optional in-memory blob/db.
 *
 *  - scan        : run the deterministic engine over the workspace graph
 *  - report-gen  : generate a report and upload the artifact to blob storage
 *  - seed-demo   : load the Acme demo company
 *  - cleanup     : apply retention (delete old jobs + reports)
 */
export async function dispatch(ctx: JobContext, job: Job): Promise<JobResult> {
  const { store } = ctx;
  try {
    switch (job.type) {
      case "scan": {
        const summary = await store.runScan(job.workspaceId, { actorId: job.payload.actorId as string | undefined });
        return { ok: true, detail: summary };
      }
      // "report" is the schedule action alias for the report-gen job type.
      case "report":
      case "report-gen": {
        const format = (job.payload.format as ReportFormat) ?? "markdown";
        const report = await store.createReport(job.workspaceId, format);
        if (ctx.blob) {
          const content = await store.getReportContent(job.workspaceId, report.id);
          if (content) {
            const url = await ctx.blob.upload(
              `${job.workspaceId}/${content.filename}`,
              content.content,
              content.format === "html" ? "text/html" : "text/markdown",
            );
            await store.setReportArtifactUrl(job.workspaceId, report.id, url);
            return { ok: true, detail: { reportId: report.id, artifactUrl: url } };
          }
        }
        return { ok: true, detail: { reportId: report.id } };
      }
      case "seed-demo": {
        const seeded = await store.seedDemo(job.workspaceId);
        return { ok: true, detail: seeded };
      }
      case "cleanup": {
        if (!ctx.db) return { ok: true, detail: { note: "no db in context — skipped" } };
        const result = await cleanup(ctx.db, {
          now: ctx.now,
          jobRetentionDays: job.payload.jobRetentionDays as number | undefined,
          reportRetentionDays: job.payload.reportRetentionDays as number | undefined,
        });
        return { ok: true, detail: result };
      }
      default:
        return { ok: false, error: `unknown job type: ${job.type}` };
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
