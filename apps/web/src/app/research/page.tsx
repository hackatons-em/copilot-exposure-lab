import type { Metadata } from "next";
import { MarketingChrome } from "@/components/landing/MarketingChrome";

export const metadata: Metadata = {
  title: "The State of Copilot Exposure — Copilot Exposure Lab",
  description:
    "Why Microsoft 365 Copilot turns a decade of quiet over-sharing into an instant data-exposure problem, and the eight patterns our engine finds before you turn it on.",
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
  { value: "~5,060", label: "files, sites, and other items" },
  { value: "~6,380", label: "grants of who-can-open-what" },
  { value: "~1,330", label: "exposure findings per test" },
  { value: "~14 / ~850", label: "critical / high-risk paths" },
];

export default function ResearchPage() {
  return (
    <MarketingChrome>
      <span className="eyebrow text-brand">Point of view</span>
      <h1 className="mt-4 font-display text-4xl font-semibold tracking-tightest text-ink">
        The State of Copilot Exposure
      </h1>
      <p className="mt-5 text-lg leading-relaxed text-ink-soft">
        Over a decade, access piles up: files shared with everyone, broad groups, outside guests who were never removed,
        and permissions quietly passed down through folders that no one reviewed. It never felt urgent, because finding
        a file still meant knowing it existed in the first place.{" "}
        <span className="text-ink">Copilot removes that last bit of friction.</span> One question pulls up anything the
        person asking is allowed to see. Years of forgotten over-sharing turn into something anyone can stumble into,
        overnight.
      </p>

      <div className="mt-6 rounded-2xl border border-severity-medium/30 bg-severity-medium-soft/40 px-5 py-4">
        <p className="text-[13px] leading-relaxed text-ink-soft">
          <strong className="text-ink">Honesty note.</strong> The figures below come from our deterministic engine run
          over a <strong className="text-ink">synthetic reference enterprise</strong>, not customer tenants. They are
          illustrative — to show the <em>shape</em> of the problem at scale. We&rsquo;ll publish anonymized pilot data
          when we have it, and say so plainly.
        </p>
      </div>

      <section className="mt-16">
        <h2 className="font-display text-2xl font-semibold tracking-tightest text-ink">The eight ways files get exposed</h2>
        <p className="mt-2 text-base text-ink-soft">
          These are the eight patterns we look for. Each one comes with evidence, a 0–100 risk score, and a mapping to
          MITRE ATT&amp;CK and the other standard security frameworks teams already report against.
        </p>
        <div className="mt-6 overflow-hidden rounded-2xl border border-hairline bg-surface shadow-elevation">
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

      <section className="mt-16">
        <h2 className="font-display text-2xl font-semibold tracking-tightest text-ink">Illustrative figures</h2>
        <p className="mt-2 text-base text-ink-soft">
          From a made-up example company of about 1,100 people, tested in well under a second.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {FIGURES.map((f) => (
            <div key={f.label} className="rounded-2xl border border-hairline bg-surface p-5 shadow-elevation">
              <div className="font-display text-2xl font-semibold tracking-tightest text-ink">{f.value}</div>
              <div className="mt-1 text-[12px] leading-snug text-ink-faint">{f.label}</div>
            </div>
          ))}
        </div>
        <p className="mt-5 text-base leading-relaxed text-ink-soft">
          The real story isn&rsquo;t any single number. It&rsquo;s{" "}
          <strong className="text-ink">how much there is, multiplied by how easily Copilot can reach it</strong>. At
          this scale, checking by hand is hopeless. A risk score that&rsquo;s the same every time, plus findings ranked
          by risk and backed by evidence, are what make the problem manageable.
        </p>
      </section>

      <div className="mt-16">
        <a
          href={DOC_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center rounded-full border border-hairline bg-surface px-6 py-2.5 text-sm font-medium text-ink no-underline transition-colors hover:border-ink-faint/40 hover:bg-surface-subtle"
        >
          Read the full write-up →
        </a>
      </div>
    </MarketingChrome>
  );
}
