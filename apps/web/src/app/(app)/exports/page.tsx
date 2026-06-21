"use client";

import { api, type ExportFormatInfo } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState, LoadingState } from "@/components/States";
import { PageHeader } from "@/components/PageHeader";
import { TrustCopy } from "@/components/TrustCopy";

const EXPORT_TRUST = [
  "Exports are generated on demand from the latest scan — same findings always produce the same bytes.",
  "Metadata-only: document contents, message bodies, and credentials are never included.",
  "Severity is computed deterministically; no LLM decides what ships in an export.",
];

export default function ExportsPage() {
  const { dataVersion } = useWorkspace();
  const { data, loading, error, reload } = useAsync<ExportFormatInfo[]>(() => api.listExports(), [dataVersion]);

  return (
    <>
      <PageHeader
        title="Exports"
        description="Push prioritized findings into your security stack — SIEM, Purview, Defender, and ticketing — as deterministic, on-demand downloads."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {loading ? (
            <LoadingState label="Loading export formats…" />
          ) : error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : !data || data.length === 0 ? (
            <EmptyState
              title="No export formats available"
              description="Run an exposure assessment first, then return here to export the results."
            />
          ) : (
            <div className="space-y-3">
              {data.map((fmt) => (
                <div
                  key={fmt.format}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-surface-border bg-surface p-5"
                >
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-ink">{fmt.label}</h2>
                    <p className="mt-1 max-w-xl text-sm text-ink-soft">{fmt.description}</p>
                  </div>
                  <a
                    href={api.exportUrl(fmt.format)}
                    className="inline-flex shrink-0 items-center rounded-md bg-brand px-3.5 py-2 text-sm font-medium text-white no-underline hover:bg-brand/90"
                    download
                  >
                    Download
                  </a>
                </div>
              ))}
            </div>
          )}

          <TrustCopy lines={EXPORT_TRUST} />
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-ink">How exports work</h2>
          <div className="rounded-lg border border-surface-border bg-surface p-4">
            <p className="text-sm text-ink-soft">
              Each download is a pure transform of the most recent scan result. Critical and high findings are routed to
              ticketing tools (Jira, ServiceNow); every finding flows to the CSV, Sentinel, Defender, and Purview
              exports.
            </p>
            <p className="mt-3 text-xs text-ink-faint">
              No data is sent to any third party from this page — the file is built by the API and downloaded directly
              to your machine for you to import where you choose.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
