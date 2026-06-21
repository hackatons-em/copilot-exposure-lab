"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { Finding, Resource } from "@cel/types";
import { api, type TenantExposure } from "@/lib/api";
import { bandRank } from "@/lib/format";
import { useAsync } from "@/lib/useAsync";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { Button } from "@/components/Button";
import { DataTable, type Column } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState, LoadingState } from "@/components/States";
import { ExposureGauge } from "@/components/ExposureGauge";
import { MetricCard } from "@/components/MetricCard";
import { PageHeader } from "@/components/PageHeader";
import { SeverityBadge } from "@/components/SeverityBadge";
import { TrustCopy } from "@/components/TrustCopy";

interface OverviewData {
  findings: Finding[];
  resources: Resource[];
  exposure: TenantExposure;
}

function resourceName(resources: Resource[], id: string): string {
  return resources.find((r) => r.id === id)?.name ?? id;
}

export default function OverviewPage() {
  const { dataVersion, runAssessment, scanning } = useWorkspace();

  const { data, loading, error, reload } = useAsync<OverviewData>(async () => {
    const [findings, resources, exposure] = await Promise.all([
      api.listFindings(),
      api.listResources(),
      api.getExposure(),
    ]);
    return { findings, resources, exposure };
  }, [dataVersion]);

  const sorted = useMemo(() => {
    if (!data) return [];
    return [...data.findings].sort((a, b) => {
      const byBand = bandRank(a.risk.band) - bandRank(b.risk.band);
      return byBand !== 0 ? byBand : b.risk.total - a.risk.total;
    });
  }, [data]);

  const metrics = useMemo(() => {
    const findings = data?.findings ?? [];
    const resources = data?.resources ?? [];
    const critical = findings.filter((f) => f.risk.band === "critical").length;
    const high = findings.filter((f) => f.risk.band === "high").length;
    const sensitive = resources.filter(
      (r) => (r.sensitivityTags?.length ?? 0) > 0 || !!r.sensitivityLabel,
    ).length;
    const broad = findings.filter(
      (f) => f.exposurePath?.via === "orgwide" || f.exposurePath?.via === "link",
    ).length;
    const riskyAgents = findings.filter((f) =>
      resources.find((r) => r.id === f.resourceId && (r.kind === "agent" || r.kind === "connector")),
    ).length;
    return { critical, high, sensitive, broad, riskyAgents };
  }, [data]);

  const topPaths = sorted.slice(0, 8);
  const recommendedFixes = useMemo(
    () => sorted.filter((f) => f.remediationTaskId && f.status !== "resolved").slice(0, 6),
    [sorted],
  );

  if (loading) {
    return (
      <>
        <PageHeader title="Overview" />
        <LoadingState label="Loading exposure overview…" />
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader title="Overview" />
        <ErrorState message={error} onRetry={reload} />
      </>
    );
  }

  const findings = data?.findings ?? [];

  if (findings.length === 0) {
    return (
      <>
        <PageHeader
          title="Overview"
          description="A consolidated view of exposure risk across Copilot, agents, and SharePoint/OneDrive permissions."
        />
        <EmptyState
          title="No assessment yet"
          description="Run an exposure assessment to seed the demo tenant and compute deterministic, evidence-backed findings."
          action={
            <Button onClick={() => void runAssessment()} busy={scanning}>
              {scanning ? "Running assessment…" : "Run exposure assessment"}
            </Button>
          }
        />
        <div className="mt-6">
          <TrustCopy />
        </div>
      </>
    );
  }

  const columns: Column<Finding>[] = [
    {
      key: "severity",
      header: "Severity",
      cell: (f) => <SeverityBadge band={f.risk.band} />,
    },
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
      key: "resource",
      header: "Resource",
      cell: (f) => <span className="text-ink-soft">{resourceName(data?.resources ?? [], f.resourceId)}</span>,
    },
    {
      key: "score",
      header: "Score",
      align: "right",
      cell: (f) => <span className="font-mono font-medium tabular-nums">{f.risk.total}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Overview"
        description="A consolidated view of exposure risk across Copilot, agents, and SharePoint/OneDrive permissions."
        actions={
          <Button onClick={() => void runAssessment()} busy={scanning} variant="secondary">
            Re-run assessment
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
        {data?.exposure && <ExposureGauge exposure={data.exposure} />}
        <div className="grid content-start gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            label="Critical"
            value={metrics.critical}
            accentClassName={metrics.critical > 0 ? "text-severity-critical" : "text-ink"}
          />
          <MetricCard
            label="High"
            value={metrics.high}
            accentClassName={metrics.high > 0 ? "text-severity-high" : "text-ink"}
          />
          <MetricCard label="Sensitive resources" value={metrics.sensitive} />
          <MetricCard label="Broad-access paths" value={metrics.broad} />
          <MetricCard label="Risky agents" value={metrics.riskyAgents} />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-2 text-sm font-semibold text-ink">Top exposure paths</h2>
          <DataTable columns={columns} rows={topPaths} rowKey={(f) => f.id} empty="No findings." />
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-ink">Recommended next fixes</h2>
          <div className="rounded-lg border border-surface-border bg-surface p-3">
            {recommendedFixes.length === 0 ? (
              <p className="px-1 py-2 text-sm text-ink-faint">No open remediations.</p>
            ) : (
              <ul className="space-y-2">
                {recommendedFixes.map((f) => (
                  <li key={f.id} className="rounded-md border border-surface-border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/findings/${f.id}`}
                        className="text-sm font-medium text-brand no-underline hover:underline"
                      >
                        {f.title}
                      </Link>
                      <SeverityBadge band={f.risk.band} score={f.risk.total} />
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-ink-soft">{f.businessImpact}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="mt-4">
            <TrustCopy />
          </div>
        </div>
      </div>
    </>
  );
}
