"use client";

/**
 * Marketing specimen — the Copilot simulation.
 *
 * A chat-style transcript: a user prompt asking about the comp plan, a grounded
 * Copilot answer, and a warning callout naming the single exposed document with a
 * sensitivity bar. This is the "what Copilot would surface" surface. No API, no
 * data — the exchange is fixed. Reduced-motion-safe via the shared hook.
 */
import { useInView } from "@/lib/useInView";
import { AlertIcon } from "@/components/icons";

const SENSITIVITY = 0.9;
const CRITICAL = "#c0362c";

export function CopilotSimSpecimen({ className }: { className?: string }) {
  const { ref, inView } = useInView<HTMLDivElement>();

  const slide = (delay: number): React.CSSProperties => ({
    opacity: inView ? 1 : 0,
    transform: inView ? "translateY(0)" : "translateY(8px)",
    transition: `opacity 500ms ease ${delay}ms, transform 600ms cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
  });

  return (
    <div ref={ref} className={`relative ${className ?? ""}`}>
      <figure className="overflow-hidden rounded-2xl border border-hairline bg-surface shadow-elevation-lg">
        <div className="flex items-center justify-between border-b border-hairline bg-surface-subtle px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span aria-hidden className="h-2 w-2 rounded-full bg-brand/70" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">copilot / simulation</span>
          </div>
          <span className="font-mono text-[10px] text-ink-faint">SIM-001</span>
        </div>

        <div className="space-y-4 p-5">
          {/* User prompt — right-aligned bubble. */}
          <div className="flex justify-end" style={slide(0)}>
            <div className="max-w-[80%] rounded-lg rounded-tr-sm border border-hairline bg-surface-subtle px-3.5 py-2.5 text-[13px] leading-relaxed text-ink">
              summarize our 2026 compensation plan
            </div>
          </div>

          {/* Copilot answer — left-aligned card with brand badge. */}
          <div className="flex justify-start gap-2.5" style={slide(140)}>
            <span
              aria-hidden
              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand font-display text-[13px] font-semibold leading-none text-white"
            >
              C
            </span>
            <div className="max-w-[82%] rounded-lg rounded-tl-sm border border-hairline bg-surface px-3.5 py-2.5 shadow-sm">
              <p className="text-[13px] leading-relaxed text-ink">
                Based on <span className="font-medium">2026_salary_plan.xlsx</span>, the plan raises the base salary band
                by 4–6% and introduces a new senior-engineer tier. Total budget impact is summarized on the planning
                tab.
              </p>
              <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-ink-faint">
                grounded in 1 source
              </p>
            </div>
          </div>

          {/* Warning callout — the exposed document. */}
          <div
            className="rounded-md border border-severity-high/30 bg-severity-high-soft p-3.5"
            style={slide(300)}
          >
            <div className="flex items-center gap-1.5">
              <span aria-hidden className="text-severity-high">
                <AlertIcon size={13} />
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-severity-high">
                Exposed source surfaced to the prompt
              </span>
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <span className="font-mono text-[12px] font-medium text-ink">2026_salary_plan.xlsx</span>
              <span className="inline-flex items-center rounded-md border border-hairline bg-surface px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-ink-soft">
                reachable via org-wide link
              </span>
            </div>

            {/* Sensitivity bar. */}
            <div className="mt-3 flex items-center gap-2.5">
              <span className="font-mono text-[9px] uppercase tracking-wider text-ink-faint">sensitivity</span>
              <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: inView ? `${SENSITIVITY * 100}%` : "0%",
                    backgroundColor: CRITICAL,
                    transition: "width 1100ms cubic-bezier(0.16,1,0.3,1) 300ms",
                  }}
                />
              </div>
              <span className="font-mono text-[12px] font-semibold tabular-nums text-severity-critical">0.90</span>
            </div>
          </div>
        </div>
      </figure>
    </div>
  );
}
