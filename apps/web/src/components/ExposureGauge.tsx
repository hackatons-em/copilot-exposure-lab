import type { TenantExposure } from "@/lib/api";

const BAND_COLOR: Record<string, string> = {
  critical: "#b42318",
  high: "#c4570a",
  medium: "#b7791f",
  low: "#2f6f4f",
  info: "#4a5160",
};

const BAND_LABEL = (b: string): string => b.charAt(0).toUpperCase() + b.slice(1);

/**
 * Headline tenant exposure score on a 270° SVG arc gauge. The arc length
 * transitions when the score changes, so applying a fix visibly slides it down.
 */
export function ExposureGauge({ exposure }: { exposure: TenantExposure }) {
  const r = 56;
  const c = 2 * Math.PI * r;
  const arc = 0.75 * c; // 270°
  const frac = Math.max(0, Math.min(1, exposure.score / 100));
  const color = BAND_COLOR[exposure.band] ?? BAND_COLOR.info!;

  return (
    <div className="flex flex-col items-center rounded-lg border border-surface-border bg-surface p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Tenant exposure</div>
      <svg viewBox="0 0 140 140" className="h-40 w-40" role="img" aria-label={`Exposure score ${exposure.score} of 100`}>
        <g transform="rotate(135 70 70)">
          <circle
            cx={70}
            cy={70}
            r={r}
            fill="none"
            stroke="#eef1f5"
            strokeWidth={12}
            strokeLinecap="round"
            strokeDasharray={`${arc} ${c}`}
          />
          <circle
            cx={70}
            cy={70}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={12}
            strokeLinecap="round"
            strokeDasharray={`${arc * frac} ${c}`}
            style={{ transition: "stroke-dasharray 700ms ease, stroke 400ms ease" }}
          />
        </g>
        <text x={70} y={68} textAnchor="middle" fontSize={36} fontWeight={700} fill="#1a1f29">
          {exposure.score}
        </text>
        <text x={70} y={90} textAnchor="middle" fontSize={12} fill="#8a93a3">
          / 100
        </text>
      </svg>
      <span
        className="mt-1 rounded px-2 py-0.5 text-xs font-semibold text-white"
        style={{ backgroundColor: color }}
      >
        {BAND_LABEL(exposure.band)}
      </span>
      {exposure.drivers.length > 0 && (
        <p className="mt-3 text-center text-xs text-ink-soft">
          Driven by: {exposure.drivers.slice(0, 2).join("; ")}
        </p>
      )}
    </div>
  );
}
