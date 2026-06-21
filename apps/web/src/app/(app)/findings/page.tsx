"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Band, Finding, FindingStatus, Resource } from "@cel/types";
import { api } from "@/lib/api";
import { BAND_ORDER, FINDING_STATUSES, bandRank, titleCase } from "@/lib/format";
import { useAsync } from "@/lib/useAsync";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { Button } from "@/components/Button";
import { DataTable, type Column } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState, LoadingState } from "@/components/States";
import { PageHeader } from "@/components/PageHeader";
import { SeverityBadge } from "@/components/SeverityBadge";
import { FindingStatusPill } from "@/components/StatusPill";

interface FindingsData {
  findings: Finding[];
  resources: Resource[];
}

export default function FindingsPage() {
  const { dataVersion, runAssessment, scanning } = useWorkspace();
  const [severity, setSeverity] = useState<Band | "">("");
  const [status, setStatus] = useState<FindingStatus | "">("");

  const { data, loading, error, reload } = useAsync<FindingsData>(async () => {
    const [findings, resources] = await Promise.all([
      api.listFindings({ severity: severity || undefined, status: status || undefined }),
      api.listResources(),
    ]);
    return { findings, resources };
  }, [dataVersion, severity, status]);

  const rows = useMemo(() => {
    if (!data) return [];
    return [...data.findings].sort((a, b) => {
      const byBand = bandRank(a.risk.band) - bandRank(b.risk.band);
      return byBand !== 0 ? byBand : b.risk.total - a.risk.total;
    });
  }, [data]);

  const resourceName = (id: string) => data?.resources.find((r) => r.id === id)?.name ?? id;

  const columns: Column<Finding>[] = [
    { key: "severity", header: "Severity", cell: (f) => <SeverityBadge band={f.risk.band} /> },
    {
      key: "title",
      header: "Finding",
      cell: (f) => (
        <Link href={`/findings/${f.id}`} className="font-medium text-brand no-underline hover:underline">
          {f.title}
        </Link>
      ),
    },
    {
      key: "ruleId",
      header: "Rule",
      cell: (f) => <span className="font-mono text-xs text-ink-faint">{f.ruleId}</span>,
    },
    { key: "resource", header: "Resource", cell: (f) => <span className="text-ink-soft">{resourceName(f.resourceId)}</span> },
    {
      key: "score",
      header: "Score",
      align: "right",
      cell: (f) => <span className="font-mono font-medium tabular-nums">{f.risk.total}</span>,
    },
    { key: "status", header: "Status", cell: (f) => <FindingStatusPill status={f.status} /> },
  ];

  const selectClass =
    "rounded-md border border-surface-border bg-surface px-2.5 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/30";

  return (
    <>
      <PageHeader
        title="Findings"
        description="Every finding is evidence-backed and scored deterministically. Filter by severity or status and open a row for the full chain."
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs font-medium text-ink-soft">
          Severity
          <select className={selectClass} value={severity} onChange={(e) => setSeverity(e.target.value as Band | "")}>
            <option value="">All</option>
            {BAND_ORDER.map((b) => (
              <option key={b} value={b}>
                {titleCase(b)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-xs font-medium text-ink-soft">
          Status
          <select className={selectClass} value={status} onChange={(e) => setStatus(e.target.value as FindingStatus | "")}>
            <option value="">All</option>
            {FINDING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {titleCase(s)}
              </option>
            ))}
          </select>
        </label>
        {(severity || status) && (
          <button
            type="button"
            onClick={() => {
              setSeverity("");
              setStatus("");
            }}
            className="text-xs text-brand hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <LoadingState label="Loading findings…" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : rows.length === 0 ? (
        <EmptyState
          title={severity || status ? "No findings match these filters" : "No findings yet"}
          description={
            severity || status
              ? "Try clearing the filters."
              : "Run an exposure assessment to compute findings for the demo tenant."
          }
          action={
            severity || status ? undefined : (
              <Button onClick={() => void runAssessment()} busy={scanning}>
                Run exposure assessment
              </Button>
            )
          }
        />
      ) : (
        <DataTable columns={columns} rows={rows} rowKey={(f) => f.id} />
      )}
    </>
  );
}
