/**
 * Bespoke, static "product visual" for the marketing hero.
 *
 * This is NOT a live component — it renders no data and calls no API. It is a
 * screenshot-grade, decorative artifact composed from markup + inline SVG that
 * evokes the real product: a stylized exposure-path chain (Bob Novak →
 * Everyone Except External Users → org-wide link → 2026_salary_plan.xlsx) with
 * a red Critical terminal node, sitting alongside a mini "92 / Critical"
 * exposure-score arc. Severity reds appear only on the risk elements; the iris
 * accent and mono numerals carry the brand voice.
 */

/** A single node in the decorative exposure chain. */
function ChainNode({
  label,
  meta,
  critical = false,
}: {
  label: string;
  meta: string;
  critical?: boolean;
}) {
  return (
    <div
      className={`rounded-md border px-3 py-2 ${
        critical
          ? "border-severity-critical/40 bg-severity-critical-soft"
          : "border-hairline bg-surface shadow-sm"
      }`}
    >
      <div className={`text-[13px] font-medium leading-tight ${critical ? "text-severity-critical" : "text-ink"}`}>
        {label}
      </div>
      <div className="mt-0.5 font-mono text-[9px] uppercase tracking-wider text-ink-faint">{meta}</div>
    </div>
  );
}

/** The connector between two chain nodes, with a relation label. */
function Connector({ relation }: { relation: string }) {
  return (
    <div className="flex items-center gap-1 px-0.5 text-ink-faint">
      <span className="hidden text-[10px] italic text-ink-soft sm:inline">{relation}</span>
      <span aria-hidden className="text-sm leading-none text-brand">
        →
      </span>
    </div>
  );
}

/** A compact exposure-score arc — the deterministic "92 / Critical". */
function ScoreArc() {
  // 92 / 100 of a 270° sweep. Geometry is fixed (decorative, not data-driven).
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const sweep = 0.75; // 270° arc
  const value = 0.92;
  const track = circumference * sweep;
  const filled = track * value;

  return (
    <div className="relative flex h-[104px] w-[104px] shrink-0 items-center justify-center">
      <svg width="104" height="104" viewBox="0 0 104 104" className="-rotate-[135deg]" aria-hidden>
        <circle
          cx="52"
          cy="52"
          r={radius}
          fill="none"
          stroke="#e6e5df"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${track} ${circumference}`}
        />
        <circle
          cx="52"
          cy="52"
          r={radius}
          fill="none"
          stroke="#c0362c"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-display text-[28px] font-semibold leading-none tracking-tightest text-ink">92</span>
        <span className="mt-1 font-mono text-[9px] uppercase tracking-wider text-severity-critical">Critical</span>
      </div>
    </div>
  );
}

export function HeroArtifact() {
  return (
    <div className="relative">
      <figure className="overflow-hidden rounded-2xl border border-hairline bg-surface shadow-elevation-lg">
        {/* Window chrome — reads as a real app surface. */}
        <div className="flex items-center justify-between border-b border-hairline bg-surface-subtle px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span aria-hidden className="h-2 w-2 rounded-full bg-severity-critical/70" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
              exposure-lab / finding
            </span>
          </div>
          <span className="font-mono text-[10px] text-ink-faint">FND-001</span>
        </div>

        <div className="space-y-5 p-5">
          {/* Finding header + score arc. */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="eyebrow">Critical finding</div>
              <h3 className="mt-1.5 font-display text-[17px] font-semibold leading-snug tracking-tightest text-ink">
                Salary plan shared through an organization-wide link
              </h3>
              <p className="mt-1.5 text-[12px] leading-relaxed text-ink-soft">
                Copilot would surface this file to anyone in the tenant who asks about compensation.
              </p>
            </div>
            <ScoreArc />
          </div>

          {/* The exposure path chain — the heart of the artifact. */}
          <div className="rounded-md border border-hairline bg-canvas/70 p-3.5">
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-brand-soft px-2 py-0.5 font-mono text-[10px] font-medium tracking-wide text-brand">
                via group membership
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-y-2.5">
              <ChainNode label="Bob Novak" meta="user" />
              <Connector relation="member of" />
              <ChainNode label="Everyone Except External" meta="group" />
              <Connector relation="grants" />
              <ChainNode label="Org-wide link" meta="sharing link" />
              <Connector relation="to" />
              <ChainNode label="2026_salary_plan.xlsx" meta="file · confidential" critical />
            </div>
          </div>

          {/* Evidence footer — every finding traces to a source object. */}
          <div className="flex items-center justify-between border-t border-hairline pt-3.5">
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-ink-faint">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-severity-low" />
              4 evidence items · traced to source
            </div>
            <div className="font-mono text-[10px] text-brand">remediation ready →</div>
          </div>
        </div>
      </figure>
    </div>
  );
}
