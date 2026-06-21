"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { RemediationSimulation } from "@cel/types";
import { api } from "@/lib/api";
import { effortLabel } from "@/lib/format";
import { useAsync } from "@/lib/useAsync";
import { SeverityBadge } from "./SeverityBadge";

/**
 * Remediation Planner — the deterministic "fix these first" roadmap plus an
 * interactive what-if. The plan is ranked by score-drop per unit of effort; the
 * checkboxes drive a live simulation of the projected tenant score.
 */
export function RemediationPlanner({ dataVersion }: { dataVersion: number }) {
  const { data: plan, loading } = useAsync(() => api.getRemediationPlan(), [dataVersion]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sim, setSim] = useState<RemediationSimulation | undefined>(undefined);

  // Default selection = the full recommended plan, once it loads.
  useEffect(() => {
    if (plan) setSelected(new Set(plan.steps.map((s) => s.findingId)));
  }, [plan]);

  // Recompute the what-if whenever the selection changes.
  useEffect(() => {
    let cancelled = false;
    if (selected.size === 0) {
      setSim(undefined);
      return;
    }
    void api
      .simulateRemediation([...selected])
      .then((r) => {
        if (!cancelled) setSim(r);
      })
      .catch(() => {
        if (!cancelled) setSim(undefined);
      });
    return () => {
      cancelled = true;
    };
  }, [selected]);

  const toggle = (id: string): void =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const projected = sim?.projectedScore ?? plan?.baselineScore ?? 0;
  const delta = sim?.scoreDelta ?? 0;

  const headline = useMemo(() => {
    if (!plan || plan.steps.length === 0) return null;
    return `Fix these ${plan.steps.length} to drop your exposure ${plan.baselineScore} → ${plan.projectedScore}`;
  }, [plan]);

  if (loading) {
    return <div className="shimmer-fill animate-shimmer h-44 rounded-2xl border border-hairline bg-surface-subtle" />;
  }
  if (!plan || plan.steps.length === 0) {
    return (
      <div className="rounded-2xl border border-hairline bg-surface p-6 shadow-elevation">
        <h2 className="eyebrow mb-1.5">Remediation planner</h2>
        <p className="text-sm text-ink-faint">
          No score-reducing fixes available — run an assessment, or the tenant is already clean.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-hairline bg-surface p-6 shadow-elevation">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="eyebrow mb-1.5">Remediation planner</h2>
          <p className="font-display text-lg font-semibold tracking-tightest text-ink">{headline}</p>
          <p className="mt-1 text-xs text-ink-soft">
            Ranked by score-drop per unit of effort. Toggle steps to model your own plan — the projection updates live.
          </p>
        </div>
        {/* Live projection readout */}
        <div className="flex shrink-0 items-end gap-3" aria-live="polite">
          <div className="text-center">
            <div className="font-display text-3xl font-semibold tabular-nums tracking-tightest text-severity-critical">
              {plan.baselineScore}
            </div>
            <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-ink-faint">now</div>
          </div>
          <span aria-hidden className="mb-2 text-xl text-ink-faint">
            →
          </span>
          <div className="text-center">
            <div className="font-display text-3xl font-semibold tabular-nums tracking-tightest text-severity-low">
              {projected}
            </div>
            <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-ink-faint">
              {selected.size === 0 ? "select fixes" : `−${delta} pts · ${selected.size} fix${selected.size === 1 ? "" : "es"}`}
            </div>
          </div>
        </div>
      </div>

      <ol className="mt-4 space-y-1.5">
        {plan.steps.map((step, i) => {
          const checked = selected.has(step.findingId);
          return (
            <li
              key={step.findingId}
              className="flex items-center gap-3 rounded-md border border-hairline px-3 py-2.5 transition-colors hover:bg-surface-subtle"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(step.findingId)}
                aria-label={`Include ${step.title} in the plan`}
                className="h-4 w-4 shrink-0 accent-brand"
              />
              <span className="w-5 shrink-0 text-center font-mono text-xs text-ink-faint">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/findings/${step.findingId}`}
                  className="block truncate text-sm font-medium text-brand no-underline hover:underline"
                >
                  {step.title}
                </Link>
              </div>
              <SeverityBadge band={step.band} />
              <span className="hidden w-20 shrink-0 text-right text-xs text-ink-soft sm:inline">
                {effortLabel(step.estimatedEffort)}
              </span>
              <span className="w-14 shrink-0 text-right font-mono text-sm font-semibold tabular-nums text-severity-low">
                −{step.scoreDelta}
              </span>
            </li>
          );
        })}
      </ol>
      {plan.capped ? (
        <p className="mt-3 text-[11px] text-ink-faint">
          Showing the highest-impact fixes from the top {plan.candidatesConsidered} findings by score.
        </p>
      ) : null}
    </div>
  );
}
