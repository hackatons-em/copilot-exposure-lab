"use client";

import type { AuditEvent } from "@cel/types";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { useAsync } from "@/lib/useAsync";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { DataTable, type Column } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState, LoadingState } from "@/components/States";
import { PageHeader } from "@/components/PageHeader";

export default function AuditPage() {
  const { dataVersion } = useWorkspace();
  const { data, loading, error, reload } = useAsync<AuditEvent[]>(() => api.listAudit(), [dataVersion]);

  const rows = data ? [...data].sort((a, b) => (a.at < b.at ? 1 : -1)) : [];

  const columns: Column<AuditEvent>[] = [
    {
      key: "at",
      header: "Time",
      cell: (e) => <span className="whitespace-nowrap text-ink-soft">{formatDateTime(e.at)}</span>,
    },
    { key: "actor", header: "Actor", cell: (e) => <span className="text-ink">{e.actor}</span> },
    {
      key: "action",
      header: "Action",
      cell: (e) => <span className="font-mono text-xs text-ink">{e.action}</span>,
    },
    {
      key: "target",
      header: "Target",
      cell: (e) => (
        <span className="font-mono text-xs text-ink-faint">
          {e.targetType ? `${e.targetType}:` : ""}
          {e.targetId ?? "—"}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Audit Log"
        description="Every sensitive action — scans, finding changes, report exports, re-seeds — is recorded here. Secrets are never logged."
      />

      {loading ? (
        <LoadingState label="Loading audit events…" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No audit events yet"
          description="Run an exposure assessment or generate a report to start the audit trail."
        />
      ) : (
        <DataTable columns={columns} rows={rows} rowKey={(e) => e.id} />
      )}
    </>
  );
}
