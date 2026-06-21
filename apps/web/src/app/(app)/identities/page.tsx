"use client";

import type { IdentityExposure } from "@cel/types";
import { api } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/States";
import { SkeletonTable } from "@/components/Skeleton";
import { PageHeader } from "@/components/PageHeader";

const REMOVAL_LABEL: Record<IdentityExposure["recommendations"][number]["kind"], string> = {
  group: "Remove from",
  link: "Revoke",
  grant: "Revoke grant",
};

function sensitivityTone(value: number): string {
  if (value >= 0.85) return "text-severity-critical";
  if (value >= 0.7) return "text-severity-high";
  return "text-severity-medium";
}

export default function IdentitiesPage() {
  const { dataVersion, runAssessment, scanning } = useWorkspace();
  const { data, loading, error, reload } = useAsync<IdentityExposure[]>(() => api.getIdentities(), [dataVersion]);

  return (
    <>
      <PageHeader
        title="Identities"
        description="Who is over-privileged — the people who can reach the most sensitive data, and the exact access to remove. Least privilege, made actionable."
      />

      {loading ? (
        <SkeletonTable rows={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          title="No identities to audit yet"
          description="Run an exposure assessment — we'll rank the principals who can reach the most sensitive resources."
          action={
            <Button onClick={() => void runAssessment()} busy={scanning}>
              Run exposure assessment
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {data.map((id, i) => (
            <div key={id.principalId} className="rounded-2xl border border-hairline bg-surface p-5 shadow-elevation">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 w-5 shrink-0 text-center font-mono text-sm text-ink-faint">{i + 1}</span>
                  <div className="min-w-0">
                    <div className="font-medium text-ink">{id.displayName}</div>
                    {id.email ? <div className="truncate font-mono text-xs text-ink-faint">{id.email}</div> : null}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-6 text-right">
                  <div>
                    <div className="font-display text-2xl font-semibold tabular-nums tracking-tightest text-ink">
                      {id.reachableSensitive}
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">sensitive reached</div>
                  </div>
                  <div>
                    <div className={`font-display text-2xl font-semibold tabular-nums tracking-tightest ${sensitivityTone(id.topSensitivity)}`}>
                      {id.topSensitivity.toFixed(2)}
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">top sensitivity</div>
                  </div>
                </div>
              </div>

              <div className="mt-3 border-t border-hairline pt-3">
                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                  Recommended removals
                </h3>
                <div className="flex flex-wrap gap-2">
                  {id.recommendations.map((rec) => (
                    <span
                      key={`${rec.kind}-${rec.targetId}`}
                      className="inline-flex items-center gap-2 rounded-md border border-hairline bg-surface-subtle px-2.5 py-1.5 text-xs"
                    >
                      <span className="text-ink-soft">{REMOVAL_LABEL[rec.kind]}</span>
                      <span className="font-medium text-ink">{rec.label}</span>
                      <span className="font-mono text-[11px] text-severity-low">−{rec.sensitiveCut}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
          <p className="px-1 pt-1 text-xs text-ink-faint">
            &minus;N = sensitive resources that removal would cut this identity&rsquo;s access to. Deterministic,
            metadata-only — no document contents are read.
          </p>
        </div>
      )}
    </>
  );
}
