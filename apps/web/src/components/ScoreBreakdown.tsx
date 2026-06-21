import type { RiskScore } from "@cel/types";
import { scoreComponentLabel } from "@/lib/format";
import { SeverityBadge } from "./SeverityBadge";

/** Show the deterministic 0-100 score and each weighted component's points. */
export function ScoreBreakdown({ risk }: { risk: RiskScore }) {
  return (
    <div>
      <div className="flex items-baseline gap-3">
        <span className="font-display text-5xl font-semibold tabular-nums tracking-tightest text-ink">
          {risk.total}
        </span>
        <span className="font-mono text-sm text-ink-faint">/ 100</span>
        <span className="ml-auto">
          <SeverityBadge band={risk.band} />
        </span>
      </div>

      <table className="mt-5 w-full text-sm">
        <thead>
          <tr className="border-b border-hairline text-left">
            <th className="eyebrow py-2 font-medium">Component</th>
            <th className="eyebrow py-2 text-right font-medium">Observed</th>
            <th className="eyebrow py-2 text-right font-medium">Points</th>
            <th className="eyebrow py-2 text-right font-medium">Max</th>
          </tr>
        </thead>
        <tbody>
          {risk.components.map((component) => (
            <tr key={component.key} className="border-b border-hairline last:border-0">
              <td className="py-2 text-ink">{scoreComponentLabel(component.key)}</td>
              <td className="py-2 text-right font-mono text-xs tabular-nums text-ink-soft">
                {component.raw.toFixed(2)}
              </td>
              <td className="py-2 text-right font-mono font-medium tabular-nums text-ink">{component.points}</td>
              <td className="py-2 text-right font-mono text-xs tabular-nums text-ink-faint">{component.weight}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-ink-faint">Risk scores are deterministic and evidence-backed.</p>
    </div>
  );
}
