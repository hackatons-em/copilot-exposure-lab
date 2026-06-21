"use client";

import { useCountUp } from "@/lib/useCountUp";
import { useInView } from "@/lib/useInView";

/**
 * Static showcase artifact for the Remediation Planner — the "fix these 5 → 92 → 52"
 * roadmap. A sibling of HeroArtifact: zero API, premium window chrome, motion-safe
 * entrance (the projected score counts down on view).
 */
const STEPS = [
  { rank: 1, title: "Org-wide link on 2026_salary_plan.xlsx", effort: "Low", delta: 18, band: "critical" },
  { rank: 2, title: "Whole-org read inherited on Finance site", effort: "Medium", delta: 9, band: "high" },
  { rank: 3, title: "Stale guest access · Phoenix site", effort: "Low", delta: 7, band: "high" },
  { rank: 4, title: "Helpdesk agent · mail.send egress", effort: "Medium", delta: 4, band: "high" },
  { rank: 5, title: "Broad dept read on master_services_agreement", effort: "Low", delta: 2, band: "medium" },
] as const;

const BAND_DOT: Record<string, string> = {
  critical: "bg-severity-critical",
  high: "bg-severity-high",
  medium: "bg-severity-medium",
};

export function PlannerSpecimen({ className }: { className?: string }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const projected = useCountUp(52, { active: inView, durationMs: 1200 });

  return (
    <div ref={ref} className={`relative ${className ?? ""}`}>
      <figure className="overflow-hidden rounded-2xl border border-hairline bg-surface shadow-elevation-lg">
        <div className="flex items-center justify-between border-b border-hairline bg-surface-subtle px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span aria-hidden className="h-2 w-2 rounded-full bg-brand/70" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">remediation / planner</span>
          </div>
          <span className="font-mono text-[10px] text-ink-faint">greedy · by impact/effort</span>
        </div>

        <div className="p-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="eyebrow">Fix these 5</div>
              <h3 className="mt-1 font-display text-[17px] font-semibold leading-snug tracking-tightest text-ink">
                Drop your exposure score in two weeks of effort
              </h3>
            </div>
            <div className="flex shrink-0 items-end gap-2">
              <span className="font-display text-3xl font-semibold tabular-nums tracking-tightest text-severity-critical">
                92
              </span>
              <span aria-hidden className="mb-1.5 text-lg text-ink-faint">
                →
              </span>
              <span className="font-display text-3xl font-semibold tabular-nums tracking-tightest text-severity-low">
                {projected}
              </span>
            </div>
          </div>

          <ol className="mt-4 space-y-1.5">
            {STEPS.map((s) => (
              <li
                key={s.rank}
                className="flex items-center gap-3 rounded-md border border-hairline px-3 py-2"
              >
                <span aria-hidden className="text-severity-low">
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                    <path d="M3.5 8.5l3 3 6-6.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span aria-hidden className={`h-1.5 w-1.5 shrink-0 rounded-full ${BAND_DOT[s.band] ?? "bg-ink-faint"}`} />
                <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{s.title}</span>
                <span className="hidden shrink-0 font-mono text-[10px] uppercase tracking-wide text-ink-faint sm:inline">
                  {s.effort}
                </span>
                <span className="w-10 shrink-0 text-right font-mono text-[13px] font-semibold tabular-nums text-severity-low">
                  −{s.delta}
                </span>
              </li>
            ))}
          </ol>

          <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3 font-mono text-[10px] text-ink-faint">
            <span>−40 points · 5 fixes</span>
            <span className="text-brand">what-if simulation →</span>
          </div>
        </div>
      </figure>
    </div>
  );
}
