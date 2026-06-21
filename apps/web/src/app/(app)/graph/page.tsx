"use client";

import { useMemo, useState } from "react";
import type { Band } from "@cel/types";
import { api, type ExposureGraphModel } from "@/lib/api";
import { BAND_ORDER, titleCase } from "@/lib/format";
import { useAsync } from "@/lib/useAsync";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState, LoadingState } from "@/components/States";
import { ExposureGraphView } from "@/components/ExposureGraphView";
import { PageHeader } from "@/components/PageHeader";
import { TrustCopy } from "@/components/TrustCopy";

const GRAPH_TRUST = ["Derived from permission metadata — deterministic, no document content."];

/** Band → hex, kept in sync with the graph view + severity tokens. */
const BAND_COLOR: Record<Band, string> = {
  critical: "#c0362c",
  high: "#c4570a",
  medium: "#b07a12",
  low: "#2f6f4f",
  info: "#56565f",
};

/** Node-type legend (icon + label). */
const NODE_LEGEND: { icon: string; label: string }[] = [
  { icon: "👤", label: "User" },
  { icon: "👥", label: "Group" },
  { icon: "🔗", label: "Link" },
  { icon: "📄", label: "File" },
  { icon: "🗂", label: "Site / drive" },
  { icon: "🤖", label: "Agent" },
];

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-lg border border-hairline bg-surface px-4 py-3 text-xs shadow-elevation">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="eyebrow">Nodes</span>
        {NODE_LEGEND.map((item) => (
          <span key={item.label} className="inline-flex items-center gap-1.5 text-ink-soft">
            <span aria-hidden>{item.icon}</span>
            {item.label}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="eyebrow">Risk</span>
        {BAND_ORDER.map((band) => (
          <span key={band} className="inline-flex items-center gap-1.5 text-ink-soft">
            <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: BAND_COLOR[band] }} />
            {titleCase(band)}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Keep only nodes/edges at or above the selected band, plus nodes touched by surviving edges. */
function filterModel(model: ExposureGraphModel, severity: Band | ""): ExposureGraphModel {
  if (!severity) return model;
  const rank: Record<Band, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
  const threshold = rank[severity];
  const keepNodeBase = model.nodes.filter((n) => rank[n.risk] <= threshold);
  const keepEdges = model.edges.filter((e) => rank[e.risk] <= threshold);
  const keepIds = new Set(keepNodeBase.map((n) => n.id));
  for (const edge of keepEdges) {
    keepIds.add(edge.source);
    keepIds.add(edge.target);
  }
  return {
    nodes: model.nodes.filter((n) => keepIds.has(n.id)),
    edges: keepEdges,
  };
}

export default function GraphPage() {
  const { dataVersion, runAssessment, scanning } = useWorkspace();
  const [severity, setSeverity] = useState<Band | "">("");

  const { data, loading, error, reload } = useAsync<ExposureGraphModel>(() => api.getGraph(), [dataVersion]);

  const filtered = useMemo(() => (data ? filterModel(data, severity) : undefined), [data, severity]);

  const hasNodes = (data?.nodes.length ?? 0) > 0;

  const selectClass =
    "rounded-md border border-hairline bg-surface px-2.5 py-1.5 text-sm text-ink transition-shadow duration-150 focus:outline-none focus:ring-2 focus:ring-brand-ring focus:ring-offset-1 focus:ring-offset-surface";

  return (
    <>
      <PageHeader
        title="Exposure graph"
        description="Every exposure path as one picture — who can reach what, and how."
        actions={
          hasNodes ? (
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
          ) : undefined
        }
      />

      {loading ? (
        <LoadingState label="Building exposure graph…" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !hasNodes || !filtered ? (
        <EmptyState
          title="No exposure paths yet"
          description="Run an exposure assessment to compute findings — the graph draws itself from every finding's exposure path."
          action={
            <Button onClick={() => void runAssessment()} busy={scanning}>
              Run exposure assessment
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          <Legend />
          {filtered.nodes.length === 0 ? (
            <EmptyState
              title="No paths match this severity"
              description="No node or edge meets the selected severity threshold. Try lowering it or clearing the filter."
              action={
                <Button variant="secondary" onClick={() => setSeverity("")}>
                  Clear filter
                </Button>
              }
            />
          ) : (
            <ExposureGraphView model={filtered} height={560} />
          )}
          <TrustCopy lines={GRAPH_TRUST} />
        </div>
      )}
    </>
  );
}
