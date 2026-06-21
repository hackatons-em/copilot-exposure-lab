import type { Store } from "@cel/api";
import type { ReportFormat } from "@cel/types";

export interface Job {
  id: string;
  workspaceId: string;
  type: string;
  payload: Record<string, unknown>;
}

export type JobResult = { ok: true; detail?: unknown } | { ok: false; error: string };

/**
 * Pure job dispatch over a Store — the heart of the worker, independent of the
 * queue transport so it's unit-testable with any Store implementation.
 *
 * Job types:
 *  - scan        : run the deterministic engine over the workspace graph
 *  - report-gen  : generate a report artifact
 *  - seed-demo   : load the Acme demo company
 *  - cleanup     : retention (handled at the queue layer)
 */
export async function dispatch(store: Store, job: Job): Promise<JobResult> {
  try {
    switch (job.type) {
      case "scan": {
        const summary = await store.runScan(job.workspaceId, { actorId: job.payload.actorId as string | undefined });
        return { ok: true, detail: summary };
      }
      case "report-gen": {
        const format = (job.payload.format as ReportFormat) ?? "markdown";
        const report = await store.createReport(job.workspaceId, format);
        return { ok: true, detail: report };
      }
      case "seed-demo": {
        const seeded = await store.seedDemo(job.workspaceId);
        return { ok: true, detail: seeded };
      }
      case "cleanup":
        return { ok: true, detail: { note: "retention handled by the queue layer" } };
      default:
        return { ok: false, error: `unknown job type: ${job.type}` };
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
