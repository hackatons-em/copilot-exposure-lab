import type { EvidenceItem } from "@cel/types";
import { formatDateTime, titleCase } from "@/lib/format";

/** Vertical evidence timeline — one factual statement per source object. */
export function EvidenceTimeline({ items }: { items: EvidenceItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-ink-faint">No evidence recorded.</p>;
  }

  return (
    <ol className="relative space-y-5 border-l border-hairline pl-6">
      {items.map((item) => (
        <li key={item.id} className="relative">
          <span
            aria-hidden
            className="absolute -left-[29px] top-1 grid h-3 w-3 place-items-center rounded-full bg-brand ring-4 ring-surface"
          >
            <span className="h-1 w-1 rounded-full bg-white" />
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-medium tracking-wide text-brand">
              {titleCase(item.kind)}
            </span>
            <span className="font-mono text-[11px] tabular-nums text-ink-faint">
              {formatDateTime(item.observedAt)}
            </span>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-ink">{item.statement}</p>
          <p className="mt-1 font-mono text-xs text-ink-faint">
            [{item.sourceObjectType}:{item.sourceObjectId}]
          </p>
        </li>
      ))}
    </ol>
  );
}
