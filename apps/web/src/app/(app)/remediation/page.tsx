"use client";

import Link from "next/link";
import { useState } from "react";
import type { Finding, RemediationTask } from "@cel/types";
import { api } from "@/lib/api";
import { bandRank, effortLabel } from "@/lib/format";
import { useAsync } from "@/lib/useAsync";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState, LoadingState } from "@/components/States";
import { PageHeader } from "@/components/PageHeader";
import { RemediationPlanner } from "@/components/RemediationPlanner";
import { SeverityBadge } from "@/components/SeverityBadge";
import { RemediationStatusPill } from "@/components/StatusPill";

interface RemediationRow {
  finding: Finding;
  task: RemediationTask;
}

export default function RemediationPage() {
  const { dataVersion, runAssessment, scanning } = useWorkspace();
  const [applying, setApplying] = useState<string | undefined>(undefined);
  const [rowError, setRowError] = useState<string | undefined>(undefined);

  const { data, loading, error, reload } = useAsync<RemediationRow[]>(async () => {
    const findings = await api.listFindings();
    const withTasks = findings.filter((f) => f.remediationTaskId);
    const details = await Promise.all(withTasks.map((f) => api.getFinding(f.id)));
    const rows: RemediationRow[] = [];
    for (const detail of details) {
      if (detail.remediation) rows.push({ finding: detail.finding, task: detail.remediation });
    }
    rows.sort((a, b) => {
      const byBand = bandRank(a.finding.risk.band) - bandRank(b.finding.risk.band);
      return byBand !== 0 ? byBand : b.finding.risk.total - a.finding.risk.total;
    });
    return rows;
  }, [dataVersion]);

  const applyFix = async (findingId: string) => {
    setApplying(findingId);
    setRowError(undefined);
    try {
      await api.updateFinding(findingId, { applyFix: true });
      reload();
    } catch (err) {
      setRowError(err instanceof Error ? err.message : "Apply fix failed.");
    } finally {
      setApplying(undefined);
    }
  };

  return (
    <>
      <PageHeader
        title="Remediation"
        description="Microsoft-native remediation tasks across all findings. Apply a fix to re-verify the exposure path is closed."
      />

      {data && data.length > 0 ? (
        <div className="mb-6">
          <RemediationPlanner dataVersion={dataVersion} />
        </div>
      ) : null}

      {loading ? (
        <LoadingState label="Loading remediation tasks…" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          title="No remediation tasks yet"
          description="Run an exposure assessment — every critical and high finding ships with a remediation task."
          action={
            <Button onClick={() => void runAssessment()} busy={scanning}>
              Run exposure assessment
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {rowError ? <p className="text-xs text-severity-critical">{rowError}</p> : null}
          {data.map(({ finding, task }) => {
            const done = task.status === "done" || finding.status === "resolved";
            return (
              <div key={task.id} className="rounded-2xl border border-hairline bg-surface p-5 shadow-elevation">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <SeverityBadge band={finding.risk.band} score={finding.risk.total} />
                      <RemediationStatusPill status={task.status} verified={task.fixVerified} />
                    </div>
                    <Link
                      href={`/findings/${finding.id}`}
                      className="mt-1.5 block text-sm font-medium text-brand no-underline hover:underline"
                    >
                      {task.title}
                    </Link>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-ink-soft">
                      {task.microsoftControl ? (
                        <span className="rounded bg-brand-soft px-2 py-0.5 font-medium text-brand">
                          {task.microsoftControl}
                        </span>
                      ) : null}
                      <span className="rounded bg-surface-muted px-2 py-0.5">{effortLabel(task.estimatedEffort)}</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => void applyFix(finding.id)}
                    busy={applying === finding.id}
                    disabled={done}
                    variant={done ? "secondary" : "primary"}
                  >
                    {done ? "Fixed" : "Apply fix"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
