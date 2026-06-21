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
    <div className="rounded-lg border border-surface-border bg-surface p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-ink-faint">{label}</div>
      <div className={`mt-1 text-3xl font-semibold tabular-nums ${accentClassName ?? "text-ink"}`}>{value}</div>
      {hint ? <div className="mt-1 text-xs text-ink-soft">{hint}</div> : null}
    </div>
  );
}
