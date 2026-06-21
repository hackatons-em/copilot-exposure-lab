"use client";

import Link from "next/link";
import type { AgentSummary } from "@cel/types";
import { api } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/States";
import { SkeletonTable } from "@/components/Skeleton";
import { PageHeader } from "@/components/PageHeader";
import { SeverityBadge } from "@/components/SeverityBadge";

function Chip({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "warn" | "ok" }) {
  const cls =
    tone === "warn"
      ? "border-severity-high/30 bg-severity-high-soft text-severity-high"
      : tone === "ok"
        ? "border-severity-low/30 bg-severity-low-soft text-severity-low"
        : "border-hairline bg-surface-subtle text-ink-soft";
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[11px] ${cls}`}>
      {children}
    </span>
  );
}

export default function AgentsPage() {
  const { dataVersion, runAssessment, scanning } = useWorkspace();
  const { data, loading, error, reload } = useAsync<AgentSummary[]>(() => api.getAgents(), [dataVersion]);

  return (
    <>
      <PageHeader
        title="Agents"
        description="Copilot Studio agent governance — capabilities, ownership, and exposure. Spot orphaned owners, egress paths, and the agents that trigger findings."
      />

      {loading ? (
        <SkeletonTable rows={5} />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          title="No agents found"
          description="Run an exposure assessment — Copilot Studio-style agents in the tenant will appear here with their risk posture."
          action={
            <Button onClick={() => void runAssessment()} busy={scanning}>
              Run exposure assessment
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {data.map((agent) => (
            <div key={agent.id} className="rounded-lg border border-hairline bg-surface p-4 shadow-elevation">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <SeverityBadge band={agent.riskBand} />
                    {agent.hasEgress ? <Chip tone="warn">egress path</Chip> : null}
                    {!agent.ownerActive ? <Chip tone="warn">orphaned owner</Chip> : null}
                  </div>
                  <h3 className="mt-1.5 font-display text-base font-semibold tracking-tightest text-ink">{agent.name}</h3>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    Owner: <span className="text-ink">{agent.ownerName}</span>{" "}
                    <span className={agent.ownerActive ? "text-ink-faint" : "text-severity-high"}>
                      ({agent.ownerActive ? "active" : "disabled / departed"})
                    </span>
                    {agent.authMode ? ` · ${agent.authMode} auth` : ""}
                    {agent.publication ? ` · ${agent.publication}` : ""}
                  </p>
                </div>
                {agent.findingCount > 0 ? (
                  <Link
                    href={`/findings/${agent.findingIds[0]}`}
                    className="shrink-0 font-mono text-xs text-brand no-underline hover:underline"
                  >
                    {agent.findingCount} finding{agent.findingCount === 1 ? "" : "s"} →
                  </Link>
                ) : (
                  <span className="shrink-0 font-mono text-xs text-ink-faint">no findings</span>
                )}
              </div>

              {(agent.actions.length > 0 || agent.connectors.length > 0) && (
                <div className="mt-3 flex flex-wrap gap-1.5 border-t border-hairline pt-3">
                  {agent.actions.map((a) => (
                    <Chip key={`act-${a}`} tone={a === "mail.send" || a.startsWith("external") ? "warn" : "default"}>
                      {a}
                    </Chip>
                  ))}
                  {agent.connectors.map((c) => (
                    <Chip key={`con-${c}`}>{c}</Chip>
                  ))}
                </div>
              )}
            </div>
          ))}
          <p className="px-1 pt-1 text-xs text-ink-faint">
            Deterministic, metadata-only. Risk band is the worst severity among the agent&rsquo;s findings.
          </p>
        </div>
      )}
    </>
  );
}
