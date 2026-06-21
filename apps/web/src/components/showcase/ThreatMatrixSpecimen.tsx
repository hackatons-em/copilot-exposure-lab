"use client";

/**
 * Marketing specimen — the threat model matrix.
 *
 * Three rules, each mapped to MITRE ATT&CK techniques + control references via
 * the real <ThreatChips/> component (size="sm"). The data is inline mock — no API.
 * Rows fade/slide in on scroll-in. Reduced-motion-safe via the shared hook.
 */
import type { ControlRef, ThreatTechnique } from "@cel/types";
import { ThreatChips } from "@/components/ThreatChips";
import { useInView } from "@/lib/useInView";

interface MatrixRow {
  title: string;
  techniques: ThreatTechnique[];
  controls: ControlRef[];
}

const ROWS: MatrixRow[] = [
  {
    title: "Org-wide link",
    techniques: [
      {
        id: "T1213.002",
        name: "Data from Information Repositories: SharePoint",
        tactic: "Collection",
        url: "https://attack.mitre.org/techniques/T1213/002/",
      },
      {
        id: "T1530",
        name: "Data from Cloud Storage",
        tactic: "Collection",
        url: "https://attack.mitre.org/techniques/T1530/",
      },
    ],
    controls: [{ framework: "NIST 800-53", id: "AC-6", name: "Least Privilege" }],
  },
  {
    title: "Stale guest access",
    techniques: [
      {
        id: "T1078.004",
        name: "Valid Accounts: Cloud Accounts",
        tactic: "Persistence",
        url: "https://attack.mitre.org/techniques/T1078/004/",
      },
    ],
    controls: [{ framework: "NIST 800-53", id: "AC-2", name: "Account Management" }],
  },
  {
    title: "Risky agent connector",
    techniques: [
      {
        id: "T1567",
        name: "Exfiltration Over Web Service",
        tactic: "Exfiltration",
        url: "https://attack.mitre.org/techniques/T1567/",
      },
    ],
    controls: [{ framework: "NIST 800-53", id: "AC-4", name: "Information Flow Enforcement" }],
  },
];

export function ThreatMatrixSpecimen({ className }: { className?: string }) {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div ref={ref} className={`relative ${className ?? ""}`}>
      <div aria-hidden className="absolute -inset-6 -z-10 rounded-[28px] bg-brand-soft/40 blur-2xl" />

      <figure className="overflow-hidden rounded-lg border border-hairline bg-surface shadow-elevation-lg">
        <div className="flex items-center justify-between border-b border-hairline bg-surface-subtle px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span aria-hidden className="h-2 w-2 rounded-full bg-brand/70" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">threat model</span>
          </div>
          <span className="font-mono text-[10px] text-ink-faint">MITRE ATT&amp;CK</span>
        </div>

        <div className="divide-y divide-hairline">
          {ROWS.map((row, i) => (
            <div
              key={row.title}
              className="px-5 py-4"
              style={{
                opacity: inView ? 1 : 0,
                transform: inView ? "translateY(0)" : "translateY(8px)",
                transition: `opacity 500ms ease ${i * 120}ms, transform 600ms cubic-bezier(0.16,1,0.3,1) ${i * 120}ms`,
              }}
            >
              <div className="mb-2.5 flex items-center gap-2">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-brand" />
                <h3 className="font-display text-[14px] font-semibold leading-none tracking-tightest text-ink">
                  {row.title}
                </h3>
              </div>
              <ThreatChips techniques={row.techniques} controls={row.controls} size="sm" />
            </div>
          ))}
        </div>
      </figure>
    </div>
  );
}
