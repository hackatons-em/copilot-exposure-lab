/**
 * "Built on / works with" marquee — honest credibility, no fake customer logos.
 * Real Microsoft surfaces we read + real frameworks we map to + the systems we
 * export into. Rendered as styled wordmark pills scrolling in a seamless marquee
 * (the track duplicates its content; -50% translate loops). Pauses on hover;
 * motion disabled under prefers-reduced-motion by the global guard.
 */

const ITEMS: { label: string; kind: "ms" | "framework" | "export" }[] = [
  { label: "Microsoft 365", kind: "ms" },
  { label: "SharePoint", kind: "ms" },
  { label: "OneDrive", kind: "ms" },
  { label: "Microsoft Teams", kind: "ms" },
  { label: "Copilot Studio", kind: "ms" },
  { label: "Microsoft Graph", kind: "ms" },
  { label: "Entra ID", kind: "ms" },
  { label: "Microsoft Purview", kind: "ms" },
  { label: "MITRE ATT&CK", kind: "framework" },
  { label: "NIST 800-53", kind: "framework" },
  { label: "CISA SCuBA", kind: "framework" },
  { label: "Microsoft Sentinel", kind: "export" },
  { label: "Jira", kind: "export" },
];

const DOT: Record<string, string> = {
  ms: "bg-brand",
  framework: "bg-severity-low",
  export: "bg-ink-faint",
};

function Pill({ label, kind }: { label: string; kind: string }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-hairline bg-surface px-4 py-2 text-sm font-medium text-ink-soft shadow-sm">
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${DOT[kind] ?? "bg-ink-faint"}`} />
      {label}
    </span>
  );
}

export function IntegrationBand() {
  return (
    <section className="border-b border-hairline bg-surface-subtle/40">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <p className="eyebrow text-center">Built on · maps to · exports into</p>
        <div className="marquee-mask mt-6 overflow-hidden">
          {/* Two identical halves → translateX(-50%) loops seamlessly. */}
          <div className="marquee-track flex w-max gap-3 animate-marquee">
            {[...ITEMS, ...ITEMS].map((item, i) => (
              <Pill key={`${item.label}-${i}`} label={item.label} kind={item.kind} />
            ))}
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-ink-faint">
          Read-only, metadata-only. We don&rsquo;t replace these — we make their exposure visible and fixable.
        </p>
      </div>
    </section>
  );
}
