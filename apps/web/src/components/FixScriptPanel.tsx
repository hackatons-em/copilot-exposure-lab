"use client";

import { useCallback, useState } from "react";
import { api, type FixScript } from "@/lib/api";
import { Button } from "./Button";

/**
 * On-demand "Generate fix" panel for a finding. Fetches the exact, advisory
 * Microsoft remediation script (deterministic, server-generated, never executed)
 * and shows it with a copy button + honest caveats. Lazy: nothing loads until the
 * user asks, keeping the finding page fast.
 */
export function FixScriptPanel({ findingId }: { findingId: string }) {
  const [fix, setFix] = useState<FixScript | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [copied, setCopied] = useState(false);

  const generate = useCallback(async () => {
    setBusy(true);
    setError(undefined);
    try {
      setFix(await api.getFixScript(findingId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate the fix script.");
    } finally {
      setBusy(false);
    }
  }, [findingId]);

  const copy = useCallback(async () => {
    if (!fix) return;
    try {
      await navigator.clipboard.writeText(fix.script);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setError("Clipboard unavailable — select the script and copy manually.");
    }
  }, [fix]);

  return (
    <div className="mt-4 border-t border-hairline pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Generate fix</h3>
          <p className="mt-0.5 text-xs text-ink-soft">
            The exact Microsoft script for this finding, wired to its source ids — advisory, never auto-run.
          </p>
        </div>
        {!fix ? (
          <Button variant="secondary" onClick={() => void generate()} busy={busy}>
            Generate fix script
          </Button>
        ) : (
          <Button variant="secondary" onClick={() => void copy()}>
            {copied ? "Copied ✓" : "Copy"}
          </Button>
        )}
      </div>

      {error ? <p className="mt-2 text-xs text-severity-critical">{error}</p> : null}

      {fix ? (
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <span className="rounded-md border border-hairline bg-surface-subtle px-2 py-0.5 font-mono text-[11px] text-ink-soft">
              {fix.tooling}
            </span>
          </div>
          <pre className="mt-2 overflow-x-auto rounded-lg border border-hairline bg-[#1a1b26] p-4 text-[12.5px] leading-relaxed text-[#c0caf5]">
            <code className="font-mono">{fix.script}</code>
          </pre>
          <ul className="mt-2 space-y-1">
            {fix.caveats.map((c) => (
              <li key={c} className="flex gap-1.5 text-[11px] leading-relaxed text-ink-faint">
                <span aria-hidden className="text-severity-medium">
                  ⚠
                </span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
