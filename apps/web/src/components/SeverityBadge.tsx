import type { Band } from "@cel/types";

/**
 * Crafted severity pills. Color lives only here. Critical is solid (it should
 * shout); the rest sit as their severity color on a soft tint with a dot.
 */
const BAND_STYLE: Record<Band, string> = {
  critical: "bg-severity-critical text-white",
  high: "bg-severity-high-soft text-severity-high",
  medium: "bg-severity-medium-soft text-severity-medium",
  low: "bg-severity-low-soft text-severity-low",
  info: "bg-severity-info-soft text-severity-info",
};

const DOT_COLOR: Record<Band, string> = {
  critical: "bg-white/85",
  high: "bg-severity-high",
  medium: "bg-severity-medium",
  low: "bg-severity-low",
  info: "bg-severity-info",
};

const BAND_LABEL: Record<Band, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
  info: "Info",
};

export function SeverityBadge({ band, score }: { band: Band; score?: number }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${BAND_STYLE[band]}`}
    >
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${DOT_COLOR[band]}`} />
      {BAND_LABEL[band]}
      {typeof score === "number" ? (
        <span className="font-mono text-[11px] font-medium tabular-nums opacity-80">{score}</span>
      ) : null}
    </span>
  );
}
