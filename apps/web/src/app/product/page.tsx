import type { Metadata } from "next";
import Link from "next/link";
import type { ComponentType } from "react";
import { MarketingFooter } from "@/components/landing/MarketingFooter";
import { MarketingNav } from "@/components/landing/MarketingNav";
import { Reveal } from "@/components/landing/Reveal";
import {
  CopilotSimSpecimen,
  FixScriptSpecimen,
  GaugeSpecimen,
  GraphSpecimen,
  ReportSpecimen,
  ThreatMatrixSpecimen,
  TrendSpecimen,
} from "@/components/showcase";

export const metadata: Metadata = {
  title: "Product — Copilot Exposure Lab",
  description:
    "A surface-by-surface tour: exposure score, attack graph, Copilot simulation, the exact fix, threat model, continuous monitoring, and the board report. Deterministic and evidence-backed.",
};

interface Surface {
  eyebrow: string;
  title: string;
  body: string;
  bullets: string[];
  Specimen: ComponentType<{ className?: string }>;
}

const SURFACES: Surface[] = [
  {
    eyebrow: "Exposure score",
    title: "One deterministic number, benchmarked",
    body: "A transparent 0–100 tenant score aggregates every finding and is benchmarked against comparable tenants. It moves only when the underlying exposure does — so a fix is provable, not assumed.",
    bullets: ["Auditable 0–100 model", "Peer percentile context", "Trends down as you remediate"],
    Specimen: GaugeSpecimen,
  },
  {
    eyebrow: "Attack graph",
    title: "The exact path to the data",
    body: "Every finding is a traced chain — who reaches what, through which group, inherited permission, sharing link, or agent. Group expansion, inheritance, guests, and org-wide access are all resolved.",
    bullets: ["Resolved nested + inherited access", "Worst-severity path highlighted", "Aggregates gracefully at scale"],
    Specimen: GraphSpecimen,
  },
  {
    eyebrow: "Copilot exposure",
    title: "What Copilot would actually surface",
    body: "Simulate a prompt as a real persona and see the sensitive documents Copilot would ground on — grounded strictly in what that identity can already access. Deterministic and metadata-only; no LLM decides risk.",
    bullets: ["Persona-scoped retrieval", "Cited, reachable documents", "No document contents read"],
    Specimen: CopilotSimSpecimen,
  },
  {
    eyebrow: "Find + Fix",
    title: "The exact Microsoft fix, written for you",
    body: "Each finding ships a copy-pasteable Microsoft Graph PowerShell / PnP / Power Platform script wired to its real source-object ids. Advisory by design — you review and run it; the product never writes to your tenant.",
    bullets: ["Wired to real ids", "Per-rule, deterministic", "Never auto-executed"],
    Specimen: FixScriptSpecimen,
  },
  {
    eyebrow: "Threat model",
    title: "Mapped to the frameworks you report on",
    body: "Every rule maps to MITRE ATT&CK techniques and NIST 800-53 / CISA controls, surfaced on each finding, in the report, and as a coverage matrix — so findings route straight into your existing program.",
    bullets: ["MITRE ATT&CK techniques", "NIST 800-53 / CISA controls", "Coverage matrix"],
    Specimen: ThreatMatrixSpecimen,
  },
  {
    eyebrow: "Continuous monitoring",
    title: "Prove the fix over time",
    body: "Schedule re-scans or trigger them on Graph change notifications. The exposure trend and drift show new, resolved, and net change since the last scan — closing the loop from finding to verified fix.",
    bullets: ["Scheduled + change-driven re-scans", "Trend + drift", "Proof-of-fix re-verification"],
    Specimen: TrendSpecimen,
  },
  {
    eyebrow: "Board report",
    title: "A CISO-grade report in one click",
    body: "Exposure score, an exposure-by-rule heat map, top risks by business impact, threat-framework coverage, and a sequenced remediation roadmap — generated deterministically as Markdown or print-ready HTML.",
    bullets: ["Deterministic bytes", "Markdown + HTML", "Sentinel / Purview / Jira exports"],
    Specimen: ReportSpecimen,
  },
];

export default function ProductPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <MarketingNav />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-hairline">
          <div aria-hidden className="bg-dotgrid absolute inset-0 -z-10 opacity-70" />
          <div className="mx-auto max-w-6xl px-6 py-16 text-center md:py-24">
            <Reveal className="mx-auto max-w-2xl">
              <span className="eyebrow text-brand">Product</span>
              <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-tightest text-ink md:text-5xl">
                Every surface of the drill
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
                From a single deterministic score down to the exact PowerShell that closes the path — here&rsquo;s the
                whole product, surface by surface.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/overview"
                  className="inline-flex items-center rounded-md bg-brand px-6 py-3 text-sm font-medium text-white no-underline shadow-elevation transition-all hover:bg-brand-strong active:translate-y-px"
                >
                  Open the dashboard
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center rounded-md border border-hairline bg-surface px-6 py-3 text-sm font-medium text-ink no-underline shadow-sm transition-colors hover:border-ink-faint/40 hover:bg-surface-subtle"
                >
                  See pricing
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Surfaces — alternating */}
        {SURFACES.map((s, i) => {
          const Specimen = s.Specimen;
          const flip = i % 2 === 1;
          return (
            <section key={s.eyebrow} className="border-b border-hairline">
              <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 md:py-20 lg:grid-cols-2 lg:gap-16">
                <Reveal className={flip ? "lg:order-2" : ""}>
                  <span className="eyebrow text-brand">{s.eyebrow}</span>
                  <h2 className="mt-3 font-display text-3xl font-semibold tracking-tightest text-ink md:text-[2.1rem]">
                    {s.title}
                  </h2>
                  <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-ink-soft">{s.body}</p>
                  <ul className="mt-5 space-y-2">
                    {s.bullets.map((b) => (
                      <li key={b} className="flex items-center gap-2 text-sm text-ink">
                        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-brand" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </Reveal>
                <Reveal delay={100} className={flip ? "lg:order-1" : ""}>
                  <Specimen />
                </Reveal>
              </div>
            </section>
          );
        })}

        {/* CTA */}
        <section className="relative overflow-hidden">
          <div aria-hidden className="bg-dotgrid absolute inset-0 -z-10 opacity-70" />
          <div className="mx-auto max-w-6xl px-6 py-20 text-center md:py-24">
            <Reveal className="mx-auto max-w-2xl">
              <h2 className="font-display text-3xl font-semibold leading-tight tracking-tightest text-ink md:text-[2.4rem]">
                Walk the evidence chain yourself.
              </h2>
              <p className="mx-auto mt-5 max-w-lg text-lg text-ink-soft">
                Run the drill against the live demo tenant — no setup, no write access.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/overview"
                  className="inline-flex items-center rounded-md bg-brand px-6 py-3 text-sm font-medium text-white no-underline shadow-elevation transition-all hover:bg-brand-strong active:translate-y-px"
                >
                  Open the dashboard
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center rounded-md border border-hairline bg-surface px-6 py-3 text-sm font-medium text-ink no-underline shadow-sm transition-colors hover:border-ink-faint/40 hover:bg-surface-subtle"
                >
                  See pricing
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
