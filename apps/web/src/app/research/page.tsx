import type { Metadata } from "next";
import { MarketingChrome } from "@/components/landing/MarketingChrome";

export const metadata: Metadata = {
  title: "The State of Copilot Exposure — Copilot Exposure Lab",
  description:
    "A point-of-view on why Microsoft 365 Copilot turns a decade of quiet oversharing into an instant data-exposure problem, and the archetypes a deterministic engine finds before rollout.",
};

const DOC_URL =
  "https://github.com/hackatons-em/copilot-exposure-lab/blob/main/docs/research/state-of-copilot-exposure.md";

const ARCHETYPES = [
  { name: "Org-wide link on sensitive file", attack: "T1213.002 · T1530" },
  { name: "Broad department access", attack: "T1213.002" },
  { name: "Inherited broad read", attack: "T1213.002 · T1530" },
  { name: "Stale external access", attack: "T1078.004" },
  { name: "Missing sensitivity label", attack: "— (governance gap)" },
  { name: "Agent send / egress action", attack: "T1567" },
  { name: "Orphaned agent owner", attack: "T1078" },
  { name: "Risky connector", attack: "T1567" },
];

const FIGURES = [
  { value: "~5,060", label: "resources in the reference tenant" },
  { value: "~6,380", label: "permission grants" },
  { value: "~1,330", label: "exposure findings per scan" },
  { value: "~14 / ~850", label: "critical / high paths" },
];

export default function ResearchPage() {
  return (
    <MarketingChrome>
      <span className="eyebrow text-brand">Point of view</span>
      <h1 className="mt-4 font-display text-4xl font-semibold tracking-tightest text-ink">
        The State of Copilot Exposure
      </h1>
      <p className="mt-5 text-lg leading-relaxed text-ink-soft">
        Permissions accreted over a decade — &ldquo;share with everyone&rdquo;, broad groups, guests never offboarded,
        un-audited inheritance. It was never urgent, because reaching a file still meant knowing it existed.{" "}
        <span className="text-ink">Copilot removes that friction.</span> One prompt retrieves anything the asker is
        permitted to see. The latent permission surface becomes an active retrieval surface overnight.
      </p>

      <div className="mt-6 rounded-lg border border-severity-medium/30 bg-severity-medium-soft/40 px-4 py-3">
        <p className="text-[13px] leading-relaxed text-ink-soft">
          <strong className="text-ink">Honesty note.</strong> The figures below come from our deterministic engine run
          over a <strong className="text-ink">synthetic reference enterprise</strong>, not customer tenants. They are
          illustrative — to show the <em>shape</em> of the problem at scale. We&rsquo;ll publish anonymized pilot data
          when we have it, and say so plainly.
        </p>
      </div>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold tracking-tightest text-ink">The eight exposure archetypes</h2>
        <p className="mt-2 text-[15px] text-ink-soft">
          Each is evidence-backed, scored 0–100, and mapped to MITRE ATT&amp;CK + control frameworks.
        </p>
        <div className="mt-5 overflow-hidden rounded-lg border border-hairline bg-surface shadow-elevation">
          <table className="w-full border-collapse text-sm">
            <tbody>
              {ARCHETYPES.map((a) => (
                <tr key={a.name} className="border-b border-hairline last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">{a.name}</td>
                  <td className="w-48 px-4 py-3 text-right font-mono text-xs text-ink-soft">{a.attack}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold tracking-tightest text-ink">Illustrative figures</h2>
        <p className="mt-2 text-[15px] text-ink-soft">
          Synthetic reference tenant (~1,100 principals), scanned in well under a second.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-hairline bg-hairline sm:grid-cols-4">
          {FIGURES.map((f) => (
            <div key={f.label} className="bg-surface p-5">
              <div className="font-display text-2xl font-semibold tracking-tightest text-ink">{f.value}</div>
              <div className="mt-1 text-[12px] leading-snug text-ink-faint">{f.label}</div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">
          The headline isn&rsquo;t any single percentage — it&rsquo;s <strong className="text-ink">volume × reachability</strong>.
          At this scale manual review is hopeless; deterministic scoring and ranked, evidence-backed findings are what
          make the surface governable.
        </p>
      </section>

      <div className="mt-12">
        <a
          href={DOC_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center rounded-md border border-hairline bg-surface px-5 py-2.5 text-sm font-medium text-ink no-underline shadow-sm transition-colors hover:border-ink-faint/40 hover:bg-surface-subtle"
        >
          Read the full write-up →
        </a>
      </div>
    </MarketingChrome>
  );
}
