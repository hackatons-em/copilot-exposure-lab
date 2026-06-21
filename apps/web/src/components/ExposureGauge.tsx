import type { TenantExposure } from "@/lib/api";

/** Band → hex. Mirrors the severity tokens (color lives here for SVG strokes). */
const BAND_COLOR: Record<string, string> = {
  critical: "#c0362c",
  high: "#c4570a",
  medium: "#b07a12",
  low: "#2f6f4f",
  info: "#56565f",
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
    <div className="flex flex-col items-center rounded-lg border border-hairline bg-surface p-5 shadow-elevation">
      <div className="eyebrow self-start">Tenant exposure</div>
      <svg
        viewBox="0 0 140 140"
        className="mt-2 h-40 w-40"
        role="img"
        aria-label={`Exposure score ${exposure.score} of 100`}
      >
        <g transform="rotate(135 70 70)">
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
        <text
          x={70}
          y={70}
          textAnchor="middle"
          fontSize={38}
          fontWeight={600}
          fill="#16161a"
          fontFamily="var(--font-mono), ui-monospace, monospace"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {exposure.score}
        </text>
        <text x={70} y={92} textAnchor="middle" fontSize={11} fill="#9795a0" letterSpacing="0.04em">
          / 100
        </text>
      </svg>
      <span
        className="mt-1 rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
        style={{ backgroundColor: color }}
      >
        {BAND_LABEL(exposure.band)}
      </span>
      {exposure.peer && (
        <p
          className="mt-2 text-center text-[11px] leading-tight text-ink-faint"
          title={`Compared against a synthetic baseline of ${exposure.peer.sampleSize} tenants. Illustrative until real pilot data exists.`}
        >
          More exposed than{" "}
          <span className="font-mono font-semibold text-ink-soft tabular-nums">{exposure.peer.worseThanPct}%</span> of
          comparable tenants<span className="align-super text-[9px]">†</span>
        </p>
      )}
      {exposure.drivers.length > 0 && (
        <p className="mt-3 text-center text-xs leading-relaxed text-ink-soft">
          Driven by: {exposure.drivers.slice(0, 2).join("; ")}
        </p>
      )}
    </div>
  );
}
