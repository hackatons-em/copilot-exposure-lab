"use client";

/**
 * Marketing specimen — the remediation fix script.
 *
 * The exact, advisory Microsoft Graph PowerShell script for the org-wide-link
 * finding, wired to its source ids. A non-functional "Copy" affordance (styled
 * like the real one) and an honest caveat line. No API, no clipboard — purely a
 * static depiction matching FixScriptPanel. Reduced-motion-safe via the hook.
 */
import { useInView } from "@/lib/useInView";
import { AlertIcon } from "@/components/icons";

const SCRIPT = `Connect-MgGraph -Scopes 'Files.ReadWrite.All','Sites.ReadWrite.All'

$driveId = '<driveId>'
$itemId  = 'f-salary'
$permId  = 'pg-orgwide-7c2'

Remove-MgDriveItemPermission \`
  -DriveId $driveId \`
  -DriveItemId $itemId \`
  -PermissionId $permId \`
  -Confirm:$false`;

export function FixScriptSpecimen({ className }: { className?: string }) {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div ref={ref} className={`relative ${className ?? ""}`}>
      <div aria-hidden className="absolute -inset-6 -z-10 rounded-[28px] bg-brand-soft/30 blur-2xl" />

      <figure
        className="overflow-hidden rounded-lg border border-hairline bg-surface shadow-elevation-lg"
        style={{
          opacity: inView ? 1 : 0,
          transform: inView ? "translateY(0)" : "translateY(10px)",
          transition: "opacity 600ms ease, transform 700ms cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <div className="flex items-center justify-between border-b border-hairline bg-surface-subtle px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span aria-hidden className="h-2 w-2 rounded-full bg-severity-low/70" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">remediation / fix</span>
          </div>
          <span className="font-mono text-[10px] text-ink-faint">FIX-001</span>
        </div>

        <div className="p-5">
          {/* Tooling badge + static Copy affordance. */}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className="rounded-md border border-hairline bg-surface-subtle px-2 py-0.5 font-mono text-[11px] text-ink-soft">
              Microsoft Graph PowerShell
            </span>
            <span
              aria-hidden
              className="inline-flex items-center rounded-md border border-hairline bg-surface px-2.5 py-1 text-[11px] font-medium text-ink-soft"
            >
              Copy
            </span>
          </div>

          <pre className="overflow-x-auto rounded-lg border border-hairline bg-[#1a1b26] p-4 text-[12.5px] leading-relaxed text-[#c0caf5]">
            <code className="font-mono">{SCRIPT}</code>
          </pre>

          <p className="mt-2.5 flex items-start gap-1.5 text-[11px] leading-relaxed text-severity-medium">
            <span aria-hidden className="mt-px shrink-0">
              <AlertIcon size={12} />
            </span>
            Advisory — review before running. Never auto-executed.
          </p>
        </div>
      </figure>
    </div>
  );
}
