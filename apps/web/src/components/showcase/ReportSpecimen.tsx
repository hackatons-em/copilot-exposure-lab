"use client";

/**
 * Marketing specimen — the board report preview.
 *
 * A printable-looking "document" thumbnail: title, a mini exposure gauge, a
 * compact rule × severity heat-map strip, and the top-risk line. This is the
 * CISO-facing deliverable. No API, no data — the figures are fixed.
 * Reduced-motion-safe via the shared hook.
 */
import { useInView } from "@/lib/useInView";

const SEVERITY_HEX: Record<string, string> = {
  critical: "#c0362c",
  high: "#c4570a",
  medium: "#b07a12",
  low: "#2f6f4f",
  info: "#9795a0",
};

type Cell = keyof typeof SEVERITY_HEX | "none";

interface HeatRow {
  label: string;
  cells: Cell[];
}

// Each row is a rule; cells are its severity across scopes (sites/files/links).
const HEAT_ROWS: HeatRow[] = [
  { label: "Sharing links", cells: ["critical", "high", "medium", "low"] },
  { label: "Guest access", cells: ["high", "medium", "low", "none"] },
  { label: "Agent connectors", cells: ["medium", "low", "none", "none"] },
];

/** Tiny 270° gauge, score 92, critical — same arc math as the full gauge. */
function MiniGauge() {
  const r = 26;
  const c = 2 * Math.PI * r;
  const arc = 0.75 * c;
  const filled = arc * 0.92;
  return (
    <svg viewBox="0 0 68 68" className="h-16 w-16" role="img" aria-label="Exposure score 92, Critical">
      <g transform="rotate(135 34 34)">
        <circle cx={34} cy={34} r={r} fill="none" stroke="#ecebe6" strokeWidth={6} strokeLinecap="round" strokeDasharray={`${arc} ${c}`} />
        <circle cx={34} cy={34} r={r} fill="none" stroke="#c0362c" strokeWidth={6} strokeLinecap="round" strokeDasharray={`${filled} ${c}`} />
      </g>
      <text
        x={34}
        y={34}
        textAnchor="middle"
        fontSize={19}
        fontWeight={600}
        fill="#16161a"
        fontFamily="var(--font-mono), ui-monospace, monospace"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        92
      </text>
      <text x={34} y={47} textAnchor="middle" fontSize={6.5} fill="#9795a0" letterSpacing="0.04em">
        / 100
      </text>
    </svg>
  );
}

export function ReportSpecimen({ className }: { className?: string }) {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div ref={ref} className={`relative ${className ?? ""}`}>
      <div aria-hidden className="absolute -inset-6 -z-10 rounded-[28px] bg-brand-soft/40 blur-2xl" />

      {/* Stacked-paper edges behind the document for a printable feel. */}
      <div aria-hidden className="absolute -bottom-1.5 -right-1.5 h-full w-full rounded-lg border border-hairline bg-surface/70" />
      <div aria-hidden className="absolute -bottom-0.5 -right-0.5 h-full w-full rounded-lg border border-hairline bg-surface" />

      <figure
        className="relative overflow-hidden rounded-lg border border-hairline bg-surface shadow-elevation-lg"
        style={{
          opacity: inView ? 1 : 0,
          transform: inView ? "translateY(0)" : "translateY(10px)",
          transition: "opacity 600ms ease, transform 700ms cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <div className="flex items-center justify-between border-b border-hairline bg-surface-subtle px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span aria-hidden className="h-2 w-2 rounded-full bg-brand/70" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">report / board</span>
          </div>
          <span className="font-mono text-[10px] text-ink-faint">PDF</span>
        </div>

        <div className="p-5">
          {/* Document header. */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="eyebrow">Quarterly review</div>
              <h3 className="mt-1.5 font-display text-[16px] font-semibold leading-snug tracking-tightest text-ink">
                Copilot Exposure Assessment
              </h3>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-ink-faint">
                Contoso Ltd · 21 Jun 2026
              </p>
            </div>
            <div className="shrink-0 text-center">
              <MiniGauge />
              <div className="mt-0.5 font-mono text-[9px] uppercase tracking-wider text-severity-critical">Critical</div>
            </div>
          </div>

          {/* Heat-map strip. */}
          <div className="mt-4 rounded-md border border-hairline bg-canvas/70 p-3">
            <div className="mb-2 font-mono text-[9px] uppercase tracking-wider text-ink-faint">Exposure by rule</div>
            <div className="space-y-1.5">
              {HEAT_ROWS.map((row, ri) => (
                <div key={row.label} className="flex items-center gap-2">
                  <span className="w-28 shrink-0 truncate text-[11px] text-ink-soft">{row.label}</span>
                  <div className="flex flex-1 gap-1">
                    {row.cells.map((cell, ci) => (
                      <span
                        key={ci}
                        className="h-3.5 flex-1 rounded-[3px]"
                        style={{
                          backgroundColor: cell === "none" ? "#ecebe6" : SEVERITY_HEX[cell],
                          opacity: inView ? (cell === "none" ? 0.5 : 1) : 0,
                          transition: `opacity 400ms ease ${(ri * 4 + ci) * 50}ms`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top risk line. */}
          <div className="mt-3.5 flex items-center justify-between border-t border-hairline pt-3.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">Top risk</span>
            <span className="truncate pl-3 text-[12px] font-medium text-ink">
              Salary plan shared via org-wide link
            </span>
          </div>
        </div>
      </figure>
    </div>
  );
}
