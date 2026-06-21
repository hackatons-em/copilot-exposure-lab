"use client";

import type { TenantConnection } from "@cel/types";
import { api } from "@/lib/api";
import { formatDateTime, titleCase } from "@/lib/format";
import { useAsync } from "@/lib/useAsync";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { Button } from "@/components/Button";
import { ErrorState, LoadingState } from "@/components/States";
import { PageHeader } from "@/components/PageHeader";
import { TrustCopy } from "@/components/TrustCopy";

/** Default least-privilege, read-only Graph scopes (each explained in the UI). */
const SCOPE_EXPLANATIONS: Record<string, string> = {
  "Sites.Read.All": "Read SharePoint site and document-library metadata (no file contents).",
  "Files.Read.All": "Read file and folder metadata, sharing links, and permissions.",
  "Group.Read.All": "Read group membership to resolve broad-access exposure paths.",
  "User.Read.All": "Read user profiles to resolve principals and external/guest status.",
  "Directory.Read.All": "Read directory objects for membership and ownership resolution.",
  "InformationProtectionPolicy.Read.All": "Read sensitivity-label policy to detect missing-label gaps.",
};

export default function SettingsPage() {
  const { dataVersion, reseedAndScan, scanning, lastRun } = useWorkspace();
  const { data, loading, error, reload } = useAsync<TenantConnection[]>(
    () => api.listConnections(),
    [dataVersion],
  );

  const connection = data && data.length > 0 ? data[0] : undefined;
  const scopes =
    connection?.scopes && connection.scopes.length > 0 ? connection.scopes : Object.keys(SCOPE_EXPLANATIONS);

  return (
    <>
      <PageHeader
        title="Settings"
        description="Connection, requested Microsoft Graph scopes, data handling, and demo controls."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-lg border border-surface-border bg-surface p-5">
            <h2 className="text-sm font-semibold text-ink">Connected tenant</h2>
            {loading ? (
              <div className="mt-3">
                <LoadingState label="Loading connection…" />
              </div>
            ) : error ? (
              <div className="mt-3">
                <ErrorState message={error} onRetry={reload} />
              </div>
            ) : connection ? (
              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-ink-faint">Tenant</dt>
                  <dd className="text-ink">{connection.tenantName}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-ink-faint">Mode</dt>
                  <dd className="text-ink">{titleCase(connection.mode)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-ink-faint">Connected</dt>
                  <dd className="text-ink">{formatDateTime(connection.connectedAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-ink-faint">Connection id</dt>
                  <dd className="font-mono text-xs text-ink-soft">{connection.id}</dd>
                </div>
              </dl>
            ) : (
              <p className="mt-3 text-sm text-ink-soft">
                No tenant connected yet. Use “Reset / re-seed demo” to load the demo company.
              </p>
            )}
          </section>

          <section className="rounded-lg border border-surface-border bg-surface p-5">
            <h2 className="text-sm font-semibold text-ink">Requested Microsoft Graph scopes</h2>
            <p className="mt-1 text-xs text-ink-soft">
              Least privilege, read-only. No write scopes are requested in this version.
            </p>
            <ul className="mt-3 space-y-2">
              {scopes.map((scope) => (
                <li key={scope} className="flex flex-col gap-0.5 rounded-md border border-surface-border p-3">
                  <span className="font-mono text-xs font-medium text-ink">{scope}</span>
                  <span className="text-xs text-ink-soft">
                    {SCOPE_EXPLANATIONS[scope] ?? "Read-only metadata scope."}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-lg border border-surface-border bg-surface p-5">
            <h2 className="text-sm font-semibold text-ink">Data handling</h2>
            <p className="mt-2 text-sm text-ink">
              Metadata-only mode enabled — document contents are not stored.
            </p>
            <p className="mt-3 text-xs text-ink-soft">
              Data retention: scan results and evidence are kept only for the active workspace and purged on
              re-seed. No file contents, email bodies, Teams messages, or credentials are ever persisted.
            </p>
          </section>

          <section className="rounded-lg border border-surface-border bg-surface p-5">
            <h2 className="text-sm font-semibold text-ink">Demo controls</h2>
            <p className="mt-2 text-xs text-ink-soft">
              Reset the workspace to the bundled demo company and run a fresh deterministic scan.
            </p>
            <div className="mt-3">
              <Button variant="secondary" onClick={() => void reseedAndScan()} busy={scanning}>
                Reset / re-seed demo
              </Button>
            </div>
            {lastRun ? (
              <p className={`mt-2 text-xs ${lastRun.ok ? "text-ink-soft" : "text-severity-critical"}`}>
                {lastRun.message}
              </p>
            ) : null}
          </section>

          <TrustCopy />
        </div>
      </div>
    </>
  );
}
