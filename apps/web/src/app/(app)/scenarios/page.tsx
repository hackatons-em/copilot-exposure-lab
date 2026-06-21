"use client";

import Link from "next/link";
import { useState } from "react";
import type { Finding, Scenario, ScenarioRun } from "@cel/types";
import { api } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState, LoadingState } from "@/components/States";
import { ExposurePath } from "@/components/ExposurePath";
import { PageHeader } from "@/components/PageHeader";
import { SeverityBadge } from "@/components/SeverityBadge";

interface ScenarioRunState {
  run?: ScenarioRun;
  findings: Finding[];
  loading: boolean;
  error?: string;
}

/** Short persona note per scenario for context. */
const PERSONA_NOTE: Record<string, string> = {
  "normal-employee": "Persona: Bob the PM (normal employee) · SharePoint + OneDrive · metadata-only.",
  "contractor-guest": "Persona: external contractor / guest · SharePoint · access that should have expired.",
  "broad-sharing": "Lens: org-wide links and large department groups across SharePoint + OneDrive.",
  "sensitive-file": "Lens: high-sensitivity files (HR, legal, finance, board, security) reachable beyond intent.",
  "agent-action": "Lens: Copilot Studio-style agents and the risky actions they can take.",
};

export default function ScenariosPage() {
  const { dataVersion, runAssessment, scanning } = useWorkspace();
  const [runs, setRuns] = useState<Record<string, ScenarioRunState>>({});

  const { data: scenarios, loading, error, reload } = useAsync<Scenario[]>(
    () => api.listScenarios(),
    [dataVersion],
  );

  const runScenario = async (scenario: Scenario) => {
    setRuns((prev) => ({ ...prev, [scenario.id]: { findings: [], loading: true } }));
    try {
      const run = await api.runScenario(scenario.key);
      // Resolve findings referenced by the run.
      const all = await api.listFindings();
      const byId = new Map(all.map((f) => [f.id, f]));
      const findings = run.findingIds
        .map((id) => byId.get(id))
        .filter((f): f is Finding => Boolean(f));
      setRuns((prev) => ({ ...prev, [scenario.id]: { run, findings, loading: false } }));
    } catch (err) {
      setRuns((prev) => ({
        ...prev,
        [scenario.id]: {
          findings: [],
          loading: false,
          error: err instanceof Error ? err.message : "Scenario run failed.",
        },
      }));
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader title="Scenarios" />
        <LoadingState label="Loading scenarios…" />
      </>
    );
  }
  if (error) {
    return (
      <>
        <PageHeader title="Scenarios" />
        <ErrorState message={error} onRetry={reload} />
      </>
    );
  }
  if (!scenarios || scenarios.length === 0) {
    return (
      <>
        <PageHeader title="Scenarios" />
        <EmptyState
          title="No scenarios yet"
          description="Run an exposure assessment to seed the demo tenant and its five exposure scenarios."
          action={
            <Button onClick={() => void runAssessment()} busy={scanning}>
              Run exposure assessment
            </Button>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Scenarios"
        description="Run a safe drill as a real persona or lens. Each run replays the deterministic engine and shows the exposure paths it found."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {scenarios.map((scenario) => {
          const state = runs[scenario.id];
          return (
            <div key={scenario.id} className="flex flex-col rounded-2xl border border-hairline bg-surface p-6 shadow-elevation">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-ink">{scenario.title}</h2>
                  <p className="mt-1 text-sm text-ink-soft">{scenario.description}</p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => void runScenario(scenario)}
                  busy={state?.loading}
                >
                  Run
                </Button>
              </div>

              <p className="mt-3 rounded-md bg-surface-subtle px-3 py-1.5 text-xs text-ink-soft">
                {PERSONA_NOTE[scenario.key] ?? "Metadata-only drill."}
              </p>

              {state?.error ? (
                <p className="mt-3 text-xs text-severity-critical">{state.error}</p>
              ) : null}

              {state?.run ? (
                <div className="mt-4 border-t border-surface-border pt-4">
                  <p className="text-sm text-ink-soft">{state.run.summary}</p>
                  <p className="mt-2 text-xs font-medium uppercase tracking-wide text-ink-faint">
                    {state.findings.length} finding{state.findings.length === 1 ? "" : "s"}
                  </p>
                  <ul className="mt-2 space-y-3">
                    {state.findings.map((f) => (
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
                        {f.exposurePath ? (
                          <div className="mt-2 text-xs">
                            <ExposurePath path={f.exposurePath} />
                          </div>
                        ) : null}
                      </li>
                    ))}
                    {state.findings.length === 0 ? (
                      <li className="text-sm text-ink-faint">No findings surfaced for this scenario.</li>
                    ) : null}
                  </ul>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </>
  );
}
