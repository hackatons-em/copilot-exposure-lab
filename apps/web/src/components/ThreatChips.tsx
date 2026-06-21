import type { ControlRef, ThreatTechnique } from "@cel/types";

/**
 * Renders a finding's threat-framework context: MITRE ATT&CK techniques (each a
 * link to the canonical technique page) and control-framework references. Used on
 * the finding detail and the threat-model page so the styling stays identical.
 */
export function ThreatChips({
  techniques,
  controls,
  size = "md",
}: {
  techniques: ThreatTechnique[];
  controls: ControlRef[];
  size?: "sm" | "md";
}) {
  const pad = size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs";

  return (
    <div className="space-y-3">
      <div>
        <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">MITRE ATT&amp;CK</h3>
        {techniques.length === 0 ? (
          <p className="text-xs text-ink-faint">
            No adversary technique — a governance gap that enables others. See controls.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {techniques.map((t) => (
              <a
                key={t.id}
                href={t.url}
                target="_blank"
                rel="noreferrer"
                title={`${t.tactic} · ${t.name}`}
                className={`inline-flex items-center gap-1.5 rounded-md border border-hairline bg-surface-subtle font-mono no-underline transition-colors duration-150 hover:border-brand/40 hover:bg-brand-soft ${pad}`}
              >
                <span className="font-semibold text-brand">{t.id}</span>
                <span className="font-sans text-ink-soft">{t.name}</span>
              </a>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Controls</h3>
        <div className="flex flex-wrap gap-1.5">
          {controls.map((c) => (
            <span
              key={`${c.framework}-${c.id}`}
              title={`${c.framework} · ${c.name}`}
              className={`inline-flex items-center gap-1.5 rounded-md border border-hairline bg-surface font-mono text-ink-soft ${pad}`}
            >
              <span className="font-semibold text-ink">{c.id}</span>
              <span className="font-sans">{c.name}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
