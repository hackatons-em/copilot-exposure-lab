import type { Band } from "@cel/types";

/** Map each band to its assertive severity color. Color lives only here. */
const BAND_STYLE: Record<Band, { bg: string; text: string; ring: string }> = {
  critical: { bg: "bg-severity-critical/10", text: "text-severity-critical", ring: "ring-severity-critical/30" },
  high: { bg: "bg-severity-high/10", text: "text-severity-high", ring: "ring-severity-high/30" },
  medium: { bg: "bg-severity-medium/10", text: "text-severity-medium", ring: "ring-severity-medium/30" },
  low: { bg: "bg-severity-low/10", text: "text-severity-low", ring: "ring-severity-low/30" },
  info: { bg: "bg-severity-info/10", text: "text-severity-info", ring: "ring-severity-info/30" },
};

const BAND_LABEL: Record<Band, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
  info: "Info",
};

export function SeverityBadge({ band, score }: { band: Band; score?: number }) {
  const style = BAND_STYLE[band];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${style.bg} ${style.text} ${style.ring}`}
    >
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${style.text.replace("text-", "bg-")}`} />
      {BAND_LABEL[band]}
      {typeof score === "number" ? <span className="font-mono font-normal opacity-80">{score}</span> : null}
    </span>
  );
}
