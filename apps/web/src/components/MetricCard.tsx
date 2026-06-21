import type { ReactNode } from "react";

interface MetricCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  /** Optional accent color class for the value, used for severity counts. */
  accentClassName?: string;
}

export function MetricCard({ label, value, hint, accentClassName }: MetricCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-hairline bg-surface p-5 shadow-elevation transition-shadow duration-150 hover:shadow-elevation-lg">
      <div className="eyebrow">{label}</div>
      <div
        className={`mt-2 font-display text-3xl font-semibold tabular-nums tracking-tightest ${
          accentClassName ?? "text-ink"
        }`}
      >
        {value}
      </div>
      {hint ? <div className="mt-1.5 text-xs text-ink-soft">{hint}</div> : null}
    </div>
  );
}
