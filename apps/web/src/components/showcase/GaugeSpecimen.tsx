"use client";

/**
 * Marketing specimen — the tenant exposure gauge.
 *
 * A static, screenshot-grade depiction of the real ExposureGauge: a 270° SVG arc
 * carrying a deterministic "92 / Critical" score. No API, no data — the geometry
 * is fixed. On scroll-in the arc draws itself (stroke-dashoffset) and the numeral
 * counts up; both are reduced-motion-safe via the shared hooks.
 */
import { useInView } from "@/lib/useInView";
import { useCountUp } from "@/lib/useCountUp";

const SCORE = 92;
const CRITICAL = "#c0362c";

export function GaugeSpecimen({ className }: { className?: string }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const score = useCountUp(SCORE, { active: inView });

  // 270° sweep of a circle. The visible track is 0.75 of the full circumference;
  // the filled portion is `score/100` of that track.
  const r = 56;
  const c = 2 * Math.PI * r;
  const arc = 0.75 * c;
  const frac = SCORE / 100;
  const filled = arc * frac;

  return (
    <div ref={ref} className={`relative ${className ?? ""}`}>
      {/* Soft iris halo for depth, matching the hero artifact. */}
      <div aria-hidden className="absolute -inset-6 -z-10 rounded-[28px] bg-brand-soft/50 blur-2xl" />

      <figure className="overflow-hidden rounded-lg border border-hairline bg-surface shadow-elevation-lg">
        {/* Window chrome. */}
        <div className="flex items-center justify-between border-b border-hairline bg-surface-subtle px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span aria-hidden className="h-2 w-2 rounded-full bg-severity-critical/70" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">exposure / tenant</span>
          </div>
          <span className="font-mono text-[10px] text-ink-faint">live</span>
        </div>

        <div className="flex flex-col items-center px-6 py-7">
          <div className="eyebrow self-start">Tenant exposure</div>

          <svg
            viewBox="0 0 140 140"
            className="mt-3 h-44 w-44"
            role="img"
            aria-label={`Exposure score ${SCORE} of 100, Critical`}
          >
            <g transform="rotate(135 70 70)">
              {/* Track. */}
              <circle
                cx={70}
                cy={70}
                r={r}
                fill="none"
                stroke="#ecebe6"
                strokeWidth={12}
                strokeLinecap="round"
                strokeDasharray={`${arc} ${c}`}
              />
              {/* Filled arc — drawn in via dashoffset on scroll-in. */}
              <circle
                cx={70}
                cy={70}
                r={r}
                fill="none"
                stroke={CRITICAL}
                strokeWidth={12}
                strokeLinecap="round"
                strokeDasharray={`${filled} ${c}`}
                strokeDashoffset={inView ? 0 : filled}
                style={{ transition: "stroke-dashoffset 1100ms cubic-bezier(0.16,1,0.3,1)" }}
              />
            </g>
            <text
              x={70}
              y={70}
              textAnchor="middle"
              fontSize={40}
              fontWeight={600}
              fill="#16161a"
              fontFamily="var(--font-mono), ui-monospace, monospace"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {score}
            </text>
            <text x={70} y={92} textAnchor="middle" fontSize={11} fill="#9795a0" letterSpacing="0.04em">
              / 100
            </text>
          </svg>

          <span
            className="mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
            style={{ backgroundColor: CRITICAL }}
          >
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-white/85" />
            Critical
          </span>

          <p className="mt-3 text-center font-mono text-[11px] leading-tight tabular-nums text-ink-faint">
            More exposed than <span className="font-semibold text-ink-soft">95%</span> of comparable tenants
          </p>
        </div>
      </figure>
    </div>
  );
}
