"use client";

/**
 * Marketing specimen — the exposure-score trend.
 *
 * The "fix works" story: five scans, exposure falling 92 → 18 left→right. A
 * dependency-free SVG line + brand area fill, white-stroked dot markers, and the
 * line drawing itself in on scroll-in via stroke-dashoffset. No API, no data —
 * the points are fixed. Reduced-motion-safe via the shared hook.
 */
import { useInView } from "@/lib/useInView";

const SCORES = [92, 84, 61, 40, 18] as const;
const BRAND = "#0071e3";

export function TrendSpecimen({ className }: { className?: string }) {
  const { ref, inView } = useInView<HTMLDivElement>();

  const w = 480;
  const h = 150;
  const pad = 10;
  const max = 100;
  const stepX = (w - 2 * pad) / (SCORES.length - 1);
  const y = (score: number): number => h - pad - (score / max) * (h - 2 * pad);
  const coords = SCORES.map((s, i) => ({ x: pad + i * stepX, y: y(s), s }));

  const first = coords[0]!;
  const last = coords[coords.length - 1]!;
  const line = coords.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `${line} L${last.x.toFixed(1)},${h - pad} L${first.x.toFixed(1)},${h - pad} Z`;

  // Approximate path length for the draw-in. Generous so the dash fully covers it.
  const lineLen = 900;

  return (
    <div ref={ref} className={`relative ${className ?? ""}`}>
      <figure className="overflow-hidden rounded-2xl border border-hairline bg-surface shadow-elevation-lg">
        <div className="flex items-center justify-between border-b border-hairline bg-surface-subtle px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span aria-hidden className="h-2 w-2 rounded-full bg-brand/70" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">exposure / trend</span>
          </div>
          <span className="font-mono text-[10px] text-ink-faint">5 scans</span>
        </div>

        <div className="px-5 py-5">
          <h2 className="eyebrow mb-3">Exposure over time</h2>
          <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label="Exposure score falling over five scans">
            <defs>
              <linearGradient id="trend-spec-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={BRAND} stopOpacity={0.16} />
                <stop offset="100%" stopColor={BRAND} stopOpacity={0} />
              </linearGradient>
            </defs>

            {/* Area fades in once the line has drawn. */}
            <path
              d={area}
              fill="url(#trend-spec-fill)"
              style={{ opacity: inView ? 1 : 0, transition: "opacity 700ms ease 600ms" }}
            />

            {/* Line draws in via dashoffset. */}
            <path
              d={line}
              fill="none"
              stroke={BRAND}
              strokeWidth={2.25}
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray={lineLen}
              strokeDashoffset={inView ? 0 : lineLen}
              style={{ transition: "stroke-dashoffset 1300ms cubic-bezier(0.16,1,0.3,1)" }}
            />

            {/* Dot markers fade in last. */}
            {coords.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={3}
                fill={BRAND}
                stroke="#ffffff"
                strokeWidth={1.75}
                style={{
                  opacity: inView ? 1 : 0,
                  transition: `opacity 300ms ease ${700 + i * 110}ms`,
                }}
              />
            ))}
          </svg>

          <div className="mt-2 flex items-center justify-between font-mono text-[11px] tabular-nums text-ink-faint">
            <span>5 scans</span>
            <span>
              <span className="text-severity-critical">92</span>
              <span className="px-1 text-ink-faint">→</span>
              <span className="text-severity-low">18</span>
            </span>
          </div>
        </div>
      </figure>
    </div>
  );
}
