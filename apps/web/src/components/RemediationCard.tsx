import type { RemediationTask } from "@cel/types";
import { effortLabel } from "@/lib/format";
import { RemediationStatusPill } from "./StatusPill";

/** Microsoft-native remediation: control, numbered steps, effort, status. */
export function RemediationCard({ task }: { task: RemediationTask }) {
  return (
    <div className="rounded-lg border border-surface-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-ink">{task.title}</h3>
        <RemediationStatusPill status={task.status} verified={task.fixVerified} />
      </div>

      <div className="mt-2 flex flex-wrap gap-2 text-xs text-ink-soft">
        {task.microsoftControl ? (
          <span className="rounded bg-brand-soft px-2 py-0.5 font-medium text-brand">{task.microsoftControl}</span>
        ) : null}
        <span className="rounded bg-surface-muted px-2 py-0.5">{effortLabel(task.estimatedEffort)}</span>
      </div>

      {task.steps.length > 0 ? (
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-ink">
          {task.steps.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>
      ) : null}

      {task.graphActionHint ? (
        <p className="mt-3 font-mono text-xs text-ink-faint">{task.graphActionHint}</p>
      ) : null}
    </div>
  );
}
