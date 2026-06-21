import type { RiskScore } from "@cel/types";
import { scoreComponentLabel } from "@/lib/format";
import { SeverityBadge } from "./SeverityBadge";

/** Show the deterministic 0-100 score and each weighted component's points. */
export function ScoreBreakdown({ risk }: { risk: RiskScore }) {
  return (
    <div>
      <div className="flex items-baseline gap-3">
        <span className="text-4xl font-semibold tabular-nums text-ink">{risk.total}</span>
        <span className="text-sm text-ink-faint">/ 100</span>
        <SeverityBadge band={risk.band} />
      </div>

      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="border-b border-surface-border text-left text-xs uppercase tracking-wide text-ink-faint">
            <th className="py-1.5 font-semibold">Component</th>
            <th className="py-1.5 text-right font-semibold">Observed</th>
            <th className="py-1.5 text-right font-semibold">Points</th>
            <th className="py-1.5 text-right font-semibold">Max</th>
          </tr>
        </thead>
        <tbody>
          {risk.components.map((component) => (
            <tr key={component.key} className="border-b border-surface-border last:border-0">
              <td className="py-1.5 text-ink">{scoreComponentLabel(component.key)}</td>
              <td className="py-1.5 text-right font-mono text-xs text-ink-soft">{component.raw.toFixed(2)}</td>
              <td className="py-1.5 text-right font-mono font-medium text-ink">{component.points}</td>
              <td className="py-1.5 text-right font-mono text-xs text-ink-faint">{component.weight}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-ink-faint">Risk scores are deterministic and evidence-backed.</p>
    </div>
  );
}
