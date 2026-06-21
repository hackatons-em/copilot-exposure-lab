"use client";

import { useCallback, useState, type FormEvent } from "react";
import type { TenantConnection } from "@cel/types";
import { api, type ConnectableSystem } from "@/lib/api";
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

interface ConnectFields {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  tenantName: string;
}

const EMPTY_CONNECT_FIELDS: ConnectFields = {
  tenantId: "",
  clientId: "",
  clientSecret: "",
  tenantName: "",
};

export default function SettingsPage() {
  const { dataVersion, reseedAndScan, scanning, lastRun, bumpDataVersion } = useWorkspace();
  const { data, loading, error, reload } = useAsync<TenantConnection[]>(
    () => api.listConnections(),
    [dataVersion],
  );

  const [fields, setFields] = useState<ConnectFields>(EMPTY_CONNECT_FIELDS);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | undefined>(undefined);
  const [connectSuccess, setConnectSuccess] = useState<string | undefined>(undefined);

  // Multi-system connectors (Google Workspace, Slack, Salesforce, combined).
  const [systemBusy, setSystemBusy] = useState<ConnectableSystem | undefined>(undefined);
  const [systemMessage, setSystemMessage] = useState<{ ok: boolean; text: string } | undefined>(undefined);

  const handleConnectSystem = useCallback(
    async (system: ConnectableSystem, label: string) => {
      if (systemBusy) return;
      setSystemBusy(system);
      setSystemMessage(undefined);
      try {
        const result = await api.connectSystem(system);
        const summary = await api.runScan();
        const principals = result.counts.principals ?? 0;
        const resources = result.counts.resources ?? 0;
        setSystemMessage({
          ok: true,
          text: `Connected ${label} — ${principals} principals, ${resources} resources, ${summary.findingCount} findings.`,
        });
        bumpDataVersion();
      } catch (err) {
        setSystemMessage({ ok: false, text: err instanceof Error ? err.message : `Could not connect ${label}.` });
      } finally {
        setSystemBusy(undefined);
      }
    },
    [bumpDataVersion, systemBusy],
  );

  const setField = useCallback(
    (key: keyof ConnectFields, value: string) => setFields((prev) => ({ ...prev, [key]: value })),
    [],
  );

  const handleConnect = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (connecting) return;
      setConnecting(true);
      setConnectError(undefined);
      setConnectSuccess(undefined);

      const tenantId = fields.tenantId.trim();
      const clientId = fields.clientId.trim();
      const tenantName = fields.tenantName.trim();
      try {
        const result = await api.connectMicrosoft({
          tenantId,
          clientId,
          clientSecret: fields.clientSecret,
          ...(tenantName.length > 0 ? { tenantName } : {}),
        });
        const counts = result.counts;
        const principals = counts.principals ?? 0;
        const resources = counts.resources ?? 0;
        const label = result.connection.tenantName || tenantName || tenantId;
        setConnectSuccess(
          `Connected ${label} — ${principals} principal${principals === 1 ? "" : "s"}, ${resources} resource${
            resources === 1 ? "" : "s"
          }.`,
        );
        // Drop the secret (and the rest of the form) as soon as it has been used.
        setFields(EMPTY_CONNECT_FIELDS);
        // Refresh connection-aware pages with the freshly ingested tenant.
        bumpDataVersion();
      } catch (err) {
        // Never echo the secret back; only surface the API error message.
        setConnectError(err instanceof Error ? err.message : "Could not connect the tenant.");
        // Clear only the secret on failure so it is not kept around longer than needed.
        setFields((prev) => ({ ...prev, clientSecret: "" }));
      } finally {
        setConnecting(false);
      }
    },
    [bumpDataVersion, connecting, fields],
  );

  const connection = data && data.length > 0 ? data[0] : undefined;
  const scopes =
    connection?.scopes && connection.scopes.length > 0 ? connection.scopes : Object.keys(SCOPE_EXPLANATIONS);

  const connectDisabled =
    connecting ||
    fields.tenantId.trim().length === 0 ||
    fields.clientId.trim().length === 0 ||
    fields.clientSecret.length === 0;

  const fieldClass =
    "mt-1 w-full rounded-md border border-surface-border bg-surface px-2.5 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/30";

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

      <section className="mt-6 rounded-lg border border-surface-border bg-surface p-5">
        <h2 className="text-sm font-semibold text-ink">Connect a Microsoft 365 tenant</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Read-only, metadata-only. Requires an Entra app registration — see{" "}
          <a
            href="https://github.com/hackatons-em/copilot-exposure-lab/blob/main/docs/SETUP-GRAPH.md"
            className="text-brand no-underline hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            docs/SETUP-GRAPH.md
          </a>
          .
        </p>

        <form onSubmit={handleConnect} className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-medium text-ink-soft">
            Tenant ID
            <input
              type="text"
              autoComplete="off"
              value={fields.tenantId}
              onChange={(e) => setField("tenantId", e.target.value)}
              placeholder="contoso.onmicrosoft.com or a directory (tenant) ID"
              className={fieldClass}
            />
          </label>
          <label className="block text-xs font-medium text-ink-soft">
            Client ID
            <input
              type="text"
              autoComplete="off"
              value={fields.clientId}
              onChange={(e) => setField("clientId", e.target.value)}
              placeholder="Application (client) ID"
              className={fieldClass}
            />
          </label>
          <label className="block text-xs font-medium text-ink-soft">
            Client secret
            <input
              type="password"
              autoComplete="new-password"
              value={fields.clientSecret}
              onChange={(e) => setField("clientSecret", e.target.value)}
              placeholder="Sent once, never stored"
              className={fieldClass}
            />
          </label>
          <label className="block text-xs font-medium text-ink-soft">
            Tenant name <span className="text-ink-faint">(optional)</span>
            <input
              type="text"
              autoComplete="off"
              value={fields.tenantName}
              onChange={(e) => setField("tenantName", e.target.value)}
              placeholder="Friendly display name"
              className={fieldClass}
            />
          </label>

          <div className="sm:col-span-2">
            <Button type="submit" busy={connecting} disabled={connectDisabled}>
              {connecting ? "Connecting…" : "Connect tenant"}
            </Button>
          </div>
        </form>

        {connectError ? (
          <p className="mt-3 text-xs text-severity-critical">{connectError}</p>
        ) : null}
        {connectSuccess ? <p className="mt-3 text-xs text-ink-soft">{connectSuccess}</p> : null}

        <div className="mt-4">
          <TrustCopy
            lines={[
              "The client secret is sent once to acquire a token and is never stored or displayed.",
            ]}
          />
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-surface-border bg-surface p-5">
        <h2 className="text-sm font-semibold text-ink">Connect another system</h2>
        <p className="mt-1 text-sm text-ink-soft">
          The same deterministic exposure engine runs over more than Microsoft 365. Each connector normalizes its
          world (Google Drive sharing, Slack channels and Slack Connect, Salesforce objects/reports and org-wide
          defaults) into the standard tenant graph, so the existing rules fire unchanged. Metadata only.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {SYSTEM_OPTIONS.map((opt) => (
            <button
              key={opt.system}
              type="button"
              onClick={() => void handleConnectSystem(opt.system, opt.label)}
              disabled={systemBusy !== undefined}
              className="flex flex-col items-start gap-1 rounded-md border border-surface-border bg-surface px-4 py-3 text-left transition hover:border-brand/50 hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="text-sm font-medium text-ink">
                {systemBusy === opt.system ? `Connecting ${opt.label}…` : opt.label}
              </span>
              <span className="text-xs text-ink-soft">{opt.description}</span>
            </button>
          ))}
        </div>

        {systemMessage ? (
          <p className={`mt-3 text-xs ${systemMessage.ok ? "text-ink-soft" : "text-severity-critical"}`}>
            {systemMessage.text}
          </p>
        ) : null}
      </section>
    </>
  );
}

interface SystemOption {
  system: ConnectableSystem;
  label: string;
  description: string;
}

const SYSTEM_OPTIONS: SystemOption[] = [
  {
    system: "google-workspace",
    label: "Google Workspace",
    description: "Shared Drives, files, Google Groups, and external collaborators.",
  },
  {
    system: "slack",
    label: "Slack",
    description: "Channels, shared files, channel membership, and Slack Connect.",
  },
  {
    system: "salesforce",
    label: "Salesforce",
    description: "Objects, reports, org-wide defaults, role groups, and community users.",
  },
  {
    system: "multi-system",
    label: "Multi-system demo (all combined)",
    description: "M365 + Google + Slack + Salesforce merged into one graph.",
  },
];
