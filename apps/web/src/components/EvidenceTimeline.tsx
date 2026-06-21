import type { EvidenceItem } from "@cel/types";
import { formatDateTime, titleCase } from "@/lib/format";

/** Vertical evidence timeline — one factual statement per source object. */
export function EvidenceTimeline({ items }: { items: EvidenceItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-ink-faint">No evidence recorded.</p>;
  }

  return (
    <ol className="relative space-y-4 border-l border-surface-border pl-5">
      {items.map((item) => (
        <li key={item.id} className="relative">
          <span aria-hidden className="absolute -left-[27px] top-1 h-2.5 w-2.5 rounded-full bg-brand ring-4 ring-surface" />
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-surface-muted px-2 py-0.5 text-xs font-medium text-ink-soft">
              {titleCase(item.kind)}
            </span>
            <span className="text-xs text-ink-faint">{formatDateTime(item.observedAt)}</span>
          </div>
          <p className="mt-1 text-sm text-ink">{item.statement}</p>
          <p className="mt-1 font-mono text-xs text-ink-faint">
            [{item.sourceObjectType}:{item.sourceObjectId}]
          </p>
        </li>
      ))}
    </ol>
  );
}
