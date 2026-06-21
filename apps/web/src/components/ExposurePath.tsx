import type { ExposurePath as ExposurePathType } from "@cel/types";
import { titleCase } from "@/lib/format";

/**
 * Render an exposure path as a horizontal chain of nodes joined by relation
 * labels, e.g. Bob Novak —(member of)→ Everyone Except External Users →
 * organization-wide link —(to)→ 2026_salary_plan.xlsx.
 */
export function ExposurePath({ path }: { path?: ExposurePathType }) {
  if (!path || path.steps.length === 0) {
    return <p className="text-sm text-ink-faint">No exposure path recorded for this finding.</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-y-3">
      <span className="mr-2 rounded bg-surface-muted px-2 py-0.5 text-xs font-medium text-ink-soft">
        via {titleCase(path.via)}
      </span>
      {path.steps.map((step, index) => {
        const isLast = index === path.steps.length - 1;
        return (
          <div key={`${step.objectId}-${index}`} className="flex items-center">
            <div className="rounded-md border border-surface-border bg-surface px-3 py-1.5">
              <div className="text-sm font-medium text-ink">{step.label}</div>
              <div className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">{step.objectType}</div>
            </div>
            {!isLast ? (
              <div className="mx-1.5 flex items-center gap-1 text-ink-faint">
                <span className="text-xs italic text-ink-soft">{step.relation.replace(/[-_]/g, " ")}</span>
                <span aria-hidden className="text-base leading-none">
                  →
                </span>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
