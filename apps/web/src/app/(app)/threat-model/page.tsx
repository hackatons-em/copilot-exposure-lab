"use client";

import { useMemo } from "react";
import { api, type ThreatModel } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import { ErrorState, LoadingState } from "@/components/States";
import { MetricCard } from "@/components/MetricCard";
import { PageHeader } from "@/components/PageHeader";
import { ThreatChips } from "@/components/ThreatChips";

export default function ThreatModelPage() {
  const { data, loading, error, reload } = useAsync<ThreatModel>(() => api.getThreatModel(), []);

  const tactics = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.techniques.map((t) => t.tactic))].sort();
  }, [data]);

  if (loading) {
    return (
      <>
        <PageHeader title="Threat model" />
        <LoadingState label="Loading threat model…" />
      </>
    );
  }
  if (error || !data) {
    return (
      <>
        <PageHeader title="Threat model" />
        <ErrorState message={error ?? "Could not load the threat model."} onRetry={reload} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Threat model"
        description="How every exposure rule maps to MITRE ATT&CK techniques and NIST 800-53 / CISA controls — deterministic, keyed off the rule, never generated."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Detection rules" value={data.rows.length} />
        <MetricCard label="ATT&CK techniques" value={data.techniques.length} />
        <MetricCard label="Mapped controls" value={data.controls.length} />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {tactics.map((t) => (
          <span
            key={t}
            className="inline-flex items-center rounded-full border border-hairline bg-surface-subtle px-2.5 py-1 text-xs font-medium text-ink-soft"
          >
            {t}
          </span>
        ))}
      </div>

      <h2 className="eyebrow mb-2.5 mt-8">Coverage matrix</h2>
      <div className="overflow-hidden rounded-2xl border border-hairline bg-surface shadow-elevation">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-hairline bg-surface-subtle text-left">
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                Exposure rule
              </th>
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                Techniques &amp; controls
              </th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr key={row.ruleId} className="border-b border-hairline last:border-0 align-top">
                <td className="w-64 px-4 py-4">
                  <div className="font-medium text-ink">{row.title}</div>
                  <div className="mt-0.5 font-mono text-xs text-ink-faint">{row.ruleId}</div>
                </td>
                <td className="px-4 py-4">
                  <ThreatChips techniques={row.threat.techniques} controls={row.threat.controls} size="sm" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 max-w-3xl text-xs leading-relaxed text-ink-faint">
        ATT&CK technique links open the canonical MITRE page. Mappings are advisory framework context — they help a
        security team route findings into existing programs; they never influence the deterministic 0–100 risk score.
      </p>
    </>
  );
}
