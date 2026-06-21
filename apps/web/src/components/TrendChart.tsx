import type { ScanSnapshot } from "@/lib/api";

/**
 * Exposure-score trend over scans — a dependency-free SVG line chart.
 * Oldest → newest, left → right. Shows the "exposure goes down after fixes" arc.
 */
export function TrendChart({ snapshots }: { snapshots: ScanSnapshot[] }) {
  // API returns most-recent-first; chart oldest → newest.
  const points = [...snapshots].reverse();

  if (points.length < 2) {
    return (
      <div className="rounded-lg border border-hairline bg-surface p-5 shadow-elevation">
        <h2 className="eyebrow mb-1.5">Exposure trend</h2>
        <p className="text-xs leading-relaxed text-ink-faint">
          Re-run the assessment (or let a schedule run) to build the trend — exposure should fall as fixes land.
        </p>
      </div>
    );
  }

  const w = 480;
  const h = 120;
  const pad = 8;
  const max = 100;
  const stepX = (w - 2 * pad) / (points.length - 1);
  const y = (score: number): number => h - pad - (score / max) * (h - 2 * pad);
  const coords = points.map((p, i) => ({ x: pad + i * stepX, y: y(p.exposureScore), s: p.exposureScore }));
  const line = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const area = `${line} L${coords[coords.length - 1]!.x.toFixed(1)},${h - pad} L${coords[0]!.x.toFixed(1)},${h - pad} Z`;

  return (
    <div className="rounded-lg border border-hairline bg-surface p-5 shadow-elevation">
      <h2 className="eyebrow mb-2.5">Exposure trend</h2>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label="Exposure score over time">
        <defs>
          <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4733b8" stopOpacity={0.16} />
            <stop offset="100%" stopColor="#4733b8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#trend-fill)" />
        <path d={line} fill="none" stroke="#4733b8" strokeWidth={2} strokeLinejoin="round" />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r={2.5} fill="#4733b8" stroke="#ffffff" strokeWidth={1.5} />
        ))}
      </svg>
      <div className="mt-1.5 flex justify-between font-mono text-[11px] tabular-nums text-ink-faint">
        <span>{points.length} scans</span>
        <span>
          {points[0]!.exposureScore} → {points[points.length - 1]!.exposureScore}
        </span>
      </div>
    </div>
  );
}
