"use client";

import type { Resource } from "@cel/types";
import { api } from "@/lib/api";
import { titleCase } from "@/lib/format";
import { useAsync } from "@/lib/useAsync";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { Button } from "@/components/Button";
import { DataTable, type Column } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState, LoadingState } from "@/components/States";
import { PageHeader } from "@/components/PageHeader";

export default function ResourcesPage() {
  const { dataVersion, runAssessment, scanning } = useWorkspace();
  const { data, loading, error, reload } = useAsync<Resource[]>(() => api.listResources(), [dataVersion]);

  const columns: Column<Resource>[] = [
    { key: "name", header: "Name", cell: (r) => <span className="font-medium text-ink">{r.name}</span> },
    {
      key: "kind",
      header: "Kind",
      cell: (r) => (
        <span className="rounded bg-surface-muted px-2 py-0.5 text-xs text-ink-soft">{titleCase(r.kind)}</span>
      ),
    },
    {
      key: "path",
      header: "Path",
      cell: (r) => <span className="font-mono text-xs text-ink-faint">{r.path ?? "—"}</span>,
    },
    {
      key: "label",
      header: "Sensitivity label",
      cell: (r) =>
        r.sensitivityLabel ? (
          <span className="text-ink">{r.sensitivityLabel}</span>
        ) : (
          <span className="text-severity-medium">— missing</span>
        ),
    },
    {
      key: "tags",
      header: "Tags",
      cell: (r) =>
        r.sensitivityTags && r.sensitivityTags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {r.sensitivityTags.map((tag) => (
              <span key={tag} className="rounded bg-surface-subtle px-1.5 py-0.5 text-xs text-ink-soft">
                {tag}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-ink-faint">—</span>
        ),
    },
    {
      key: "criticality",
      header: "Criticality",
      cell: (r) => <span className="text-ink-soft">{r.businessCriticality ? titleCase(r.businessCriticality) : "—"}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Resources"
        description="Sites, drives, files, agents, and connectors discovered in the tenant — with sensitivity labels, classification tags, and business criticality. Metadata only."
      />

      {loading ? (
        <LoadingState label="Loading resources…" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          title="No resources yet"
          description="Run an exposure assessment to seed the demo tenant graph."
          action={
            <Button onClick={() => void runAssessment()} busy={scanning}>
              Run exposure assessment
            </Button>
          }
        />
      ) : (
        <DataTable columns={columns} rows={data} rowKey={(r) => r.id} />
      )}
    </>
  );
}
