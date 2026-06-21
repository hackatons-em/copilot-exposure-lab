import type { RemediationTask } from "@cel/types";
import { effortLabel } from "@/lib/format";
import { RemediationStatusPill } from "./StatusPill";

/** Microsoft-native remediation: control, numbered steps, effort, status. */
export function RemediationCard({ task }: { task: RemediationTask }) {
  return (
    <div className="rounded-xl border border-hairline bg-surface p-5 shadow-elevation">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-ink">{task.title}</h3>
        <RemediationStatusPill status={task.status} verified={task.fixVerified} />
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
        {task.microsoftControl ? (
          <span className="rounded-md bg-brand-soft px-2.5 py-0.5 font-medium text-brand">
            {task.microsoftControl}
          </span>
        ) : null}
        <span className="rounded-md border border-hairline bg-surface-subtle px-2.5 py-0.5 text-ink-soft">
          {effortLabel(task.estimatedEffort)}
        </span>
      </div>

      {task.steps.length > 0 ? (
        <ol className="mt-3.5 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-ink marker:font-mono marker:text-ink-faint">
          {task.steps.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>
      ) : null}

      {task.graphActionHint ? (
        <p className="mt-3.5 rounded-md border border-hairline bg-surface-subtle px-2.5 py-2 font-mono text-xs text-ink-soft">
          {task.graphActionHint}
        </p>
      ) : null}
    </div>
  );
}
