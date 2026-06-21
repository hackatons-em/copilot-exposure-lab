"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useState } from "react";
import type { Resource } from "@cel/types";
import { api, type ExposureGraphModel, type FindingDetail } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { useAsync } from "@/lib/useAsync";
import { Button } from "@/components/Button";
import { ErrorState, LoadingState } from "@/components/States";
import { EvidenceTimeline } from "@/components/EvidenceTimeline";
import { ExposureGraphView } from "@/components/ExposureGraphView";
import { ExposurePath } from "@/components/ExposurePath";
import { FindingStatusPill } from "@/components/StatusPill";
import { RemediationCard } from "@/components/RemediationCard";
import { ScoreBreakdown } from "@/components/ScoreBreakdown";
import { ThreatChips } from "@/components/ThreatChips";

interface DetailBundle {
  detail: FindingDetail;
  resource?: Resource;
  graph: ExposureGraphModel;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-hairline bg-surface p-5 shadow-elevation">
      <h2 className="eyebrow mb-3.5">{title}</h2>
      {children}
    </section>
  );
}

export default function FindingDetailPage() {
  const params = useParams<{ id: string }>();
  const findingId = params.id;
  const [busy, setBusy] = useState<"remediating" | "fix" | undefined>(undefined);
  const [actionError, setActionError] = useState<string | undefined>(undefined);

  const { data, loading, error, reload } = useAsync<DetailBundle>(async () => {
    const detail = await api.getFinding(findingId);
    let resource: Resource | undefined;
    try {
      const resources = await api.listResources();
      resource = resources.find((r) => r.id === detail.finding.resourceId);
    } catch {
      resource = undefined;
    }
    let graph: ExposureGraphModel = { nodes: [], edges: [] };
    try {
      graph = await api.getGraph();
    } catch {
      graph = { nodes: [], edges: [] };
    }
    return { detail, resource, graph };
  }, [findingId]);

  const markRemediating = useCallback(async () => {
    setBusy("remediating");
    setActionError(undefined);
    try {
      await api.updateFinding(findingId, { status: "remediating" });
      reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setBusy(undefined);
    }
  }, [findingId, reload]);

  const applyFix = useCallback(async () => {
    setBusy("fix");
    setActionError(undefined);
    try {
      await api.updateFinding(findingId, { applyFix: true });
      reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Apply fix failed.");
    } finally {
      setBusy(undefined);
    }
  }, [findingId, reload]);

  if (loading) {
    return <LoadingState label="Loading finding…" />;
  }
  if (error || !data) {
    return <ErrorState message={error ?? "Finding not found."} onRetry={reload} />;
  }

  const { detail, resource, graph } = data;
  const { finding, evidence, remediation } = detail;
  const resolved = finding.status === "resolved";

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4">
        <Link href="/findings" className="text-sm text-brand no-underline hover:underline">
          ← Back to findings
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-hairline pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs tracking-wide text-ink-faint">{finding.ruleId}</span>
            <FindingStatusPill status={finding.status} />
          </div>
          <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tightest text-ink">
            {finding.title}
          </h1>
          <p className="mt-1.5 text-sm text-ink-soft">
            {resource ? `${resource.name}${resource.path ? ` · ${resource.path}` : ""}` : finding.resourceId}
            {" · "}
            <span className="text-ink-faint">created {formatDateTime(finding.createdAt)}</span>
          </p>
        </div>
      </div>

      {resolved && remediation?.fixVerified ? (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-severity-low/30 bg-severity-low-soft px-4 py-3 text-sm font-medium text-severity-low shadow-elevation">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-severity-low" />
          Fix applied and re-verified — the exposure path is no longer reachable (proof-of-fix).
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section title="Summary">
            <p className="text-sm text-ink">{finding.summary}</p>
            <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-faint">Business impact</h3>
            <p className="mt-1 text-sm text-ink-soft">{finding.businessImpact}</p>
          </Section>

          <Section title="Exposure path">
            <ExposurePath path={finding.exposurePath} />
          </Section>

          <Section title="Exposure path (graph)">
            <ExposureGraphView model={graph} focusFindingId={finding.id} height={320} />
          </Section>

          <Section title="Evidence chain">
            <EvidenceTimeline items={evidence} />
          </Section>

          <Section title="Remediation">
            {remediation ? (
              <RemediationCard task={remediation} />
            ) : (
              <p className="text-sm text-ink-faint">No remediation task is attached to this finding.</p>
            )}

            {actionError ? <p className="mt-3 text-xs text-severity-critical">{actionError}</p> : null}

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => void markRemediating()}
                busy={busy === "remediating"}
                disabled={finding.status === "remediating" || resolved}
              >
                Mark as remediating
              </Button>
              <Button onClick={() => void applyFix()} busy={busy === "fix"} disabled={resolved}>
                {resolved ? "Fix verified" : "Apply fix & re-verify"}
              </Button>
            </div>
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Risk score">
            <ScoreBreakdown risk={finding.risk} />
          </Section>

          <Section title="Threat & controls">
            <ThreatChips techniques={finding.threat.techniques} controls={finding.threat.controls} />
            <p className="mt-3 text-[11px] leading-relaxed text-ink-faint">
              Mapped deterministically from the rule — the adversary behavior this exposure enables and the
              control-framework safeguards that address it.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
