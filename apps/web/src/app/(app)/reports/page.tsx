"use client";

import { useState } from "react";
import type { Report, ReportFormat } from "@cel/types";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { useToast } from "@/components/Toast";
import { Button } from "@/components/Button";
import { PageHeader } from "@/components/PageHeader";
import { TrustCopy } from "@/components/TrustCopy";

const REPORT_SECTIONS = [
  "Executive summary — counts by severity band",
  "Top exposure paths — highest-scoring findings",
  "Findings detail — evidence chain and risk components",
  "Remediation plan — Microsoft-native steps and effort",
  "Scenario runs — persona/lens drill results",
  "Methodology — deterministic scoring model and scope",
];

export default function ReportsPage() {
  const { dataVersion } = useWorkspace();
  const toast = useToast();
  const [format, setFormat] = useState<ReportFormat>("markdown");
  const [report, setReport] = useState<Report | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const generate = async () => {
    setBusy(true);
    setError(undefined);
    try {
      const result = await api.createReport(format);
      setReport(result);
      toast.success(`${result.format === "html" ? "HTML" : "Markdown"} report generated.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Report generation failed.";
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  // Reset a stale report if the underlying data was re-scanned.
  void dataVersion;

  const selectClass =
    "rounded-md border border-surface-border bg-surface px-2.5 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/30";

  return (
    <>
      <PageHeader
        title="Reports"
        description="Generate a deterministic, exportable CISO report. Same findings always produce the same report bytes."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-lg border border-surface-border bg-surface p-5">
            <h2 className="text-sm font-semibold text-ink">Generate report</h2>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <label className="flex items-center gap-2 text-xs font-medium text-ink-soft">
                Format
                <select
                  className={selectClass}
                  value={format}
                  onChange={(e) => setFormat(e.target.value as ReportFormat)}
                >
                  <option value="markdown">Markdown</option>
                  <option value="html">HTML</option>
                </select>
              </label>
              <Button onClick={() => void generate()} busy={busy}>
                Generate report
              </Button>
            </div>

            {error ? <p className="mt-3 text-xs text-severity-critical">{error}</p> : null}

            {report ? (
              <div className="mt-4 rounded-md border border-surface-border bg-surface-subtle p-4">
                <p className="text-sm text-ink">
                  Report ready · <span className="uppercase">{report.format}</span>
                </p>
                <p className="mt-0.5 text-xs text-ink-faint">
                  Generated {formatDateTime(report.generatedAt)} · {report.findingIds.length} finding
                  {report.findingIds.length === 1 ? "" : "s"} included
                </p>
                <a
                  href={api.reportDownloadUrl(report.id)}
                  className="mt-3 inline-flex items-center rounded-md bg-brand px-3.5 py-2 text-sm font-medium text-white no-underline hover:bg-brand/90"
                  download
                >
                  Download {report.format === "html" ? "HTML" : "Markdown"}
                </a>
              </div>
            ) : null}
          </div>

          <TrustCopy />
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-ink">Report sections</h2>
          <div className="rounded-lg border border-surface-border bg-surface p-4">
            <ol className="list-decimal space-y-1.5 pl-5 text-sm text-ink-soft">
              {REPORT_SECTIONS.map((section) => (
                <li key={section}>{section}</li>
              ))}
            </ol>
            <p className="mt-3 text-xs text-ink-faint">
              Preview note: the report is built from the latest scan&apos;s findings, evidence, and remediation —
              no document contents are ever included.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
