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
      <span className="mr-2 inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-medium tracking-wide text-brand">
        via {titleCase(path.via)}
      </span>
      {path.steps.map((step, index) => {
        const isLast = index === path.steps.length - 1;
        return (
          <div key={`${step.objectId}-${index}`} className="flex items-center">
            <div
              className={`rounded-md border px-3 py-2 ${
                isLast
                  ? "border-severity-critical/40 bg-severity-critical-soft"
                  : "border-hairline bg-surface shadow-sm"
              }`}
            >
              <div className={`text-sm font-medium ${isLast ? "text-severity-critical" : "text-ink"}`}>
                {step.label}
              </div>
              <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-faint">
                {step.objectType}
              </div>
            </div>
            {!isLast ? (
              <div className="mx-2 flex items-center gap-1.5 text-ink-faint">
                <span className="text-[11px] italic text-ink-soft">
                  {step.relation.replace(/[-_]/g, " ")}
                </span>
                <span aria-hidden className="text-base leading-none text-brand">
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
