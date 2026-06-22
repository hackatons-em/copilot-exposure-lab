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
  PlannerSpecimen,
  ReportSpecimen,
  ThreatMatrixSpecimen,
  TrendSpecimen,
} from "@/components/showcase";

export const metadata: Metadata = {
  title: "Product — Copilot Exposure Lab",
  description:
    "A tour, one piece at a time: your risk score, a map of who can reach what, a safe Copilot test, the exact fix, security-framework mapping, ongoing monitoring, and the board report. Backed by evidence, with the same result every time.",
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
    title: "One number, and how you compare",
    body: "A single 0–100 score sums up your whole organization's exposure and shows how you compare to similar organizations. It uses deterministic scoring (the same inputs always produce the same score — no guessing, fully auditable) and only moves when the real exposure does, so a fix is provable, not assumed.",
    bullets: ["Auditable 0–100 score", "How you compare to peers", "Goes down as you fix things"],
    Specimen: GaugeSpecimen,
  },
  {
    eyebrow: "Attack graph",
    title: "The exact path to the data",
    body: "Every finding is a clear path: who can reach what, and through which group, inherited permission, sharing link, or AI assistant. Access passed down through folders, nested groups, outside guests, and company-wide sharing is all traced for you.",
    bullets: ["Traces nested and inherited access", "Highlights the riskiest path", "Stays readable at large scale"],
    Specimen: GraphSpecimen,
  },
  {
    eyebrow: "Copilot exposure",
    title: "What Copilot would actually surface",
    body: "Ask a question as a specific person and see the sensitive documents Copilot would pull up for them — limited strictly to what that person is already allowed to open. It reads only descriptive details, never file contents, and the same question always returns the same result.",
    bullets: ["Limited to one person's access", "Shows the real files they'd reach", "Never reads file contents"],
    Specimen: CopilotSimSpecimen,
  },
  {
    eyebrow: "Find + Fix",
    title: "The exact Microsoft fix, written for you",
    body: "Each finding comes with the precise Microsoft commands to close it, ready to copy and paste and already pointing at the right files and groups. They are advisory only: your team reviews and runs them, and we never change anything in your tenant.",
    bullets: ["Pre-filled with the right targets", "Tailored to each finding", "Never run automatically"],
    Specimen: FixScriptSpecimen,
  },
  {
    eyebrow: "Remediation planner",
    title: "Turn the list into a plan",
    body: "We rank the fixes by how much risk each one removes for the effort involved — for example, fix these five to drop your score from 92 to 52. A live what-if lets you pick any set of fixes and see the projected score before you touch anything.",
    bullets: ["Ranked by impact for the effort", "Live what-if projection", "Sequenced and board-ready"],
    Specimen: PlannerSpecimen,
  },
  {
    eyebrow: "Threat model",
    title: "Mapped to the frameworks you report on",
    body: "Every check maps to MITRE ATT&CK and NIST 800-53 / CISA (the standard security frameworks teams already report against). The mapping shows on each finding, in the report, and as a coverage grid, so findings drop straight into the program you already run.",
    bullets: ["MITRE ATT&CK techniques", "NIST 800-53 / CISA controls", "Coverage grid"],
    Specimen: ThreatMatrixSpecimen,
  },
  {
    eyebrow: "Continuous monitoring",
    title: "Prove the fix keeps holding",
    body: "Re-test on a schedule, or automatically whenever something changes in your tenant. You see what's new, what's resolved, and the net change since the last test — closing the loop from finding to verified fix.",
    bullets: ["Scheduled and change-triggered re-tests", "What changed since last time", "Confirms each fix held"],
    Specimen: TrendSpecimen,
  },
  {
    eyebrow: "Board report",
    title: "A board-ready report in one click",
    body: "Your exposure score, a heat map of where the risk sits, the top risks by business impact, your security-framework coverage, and a step-by-step fix plan. It generates the same way every time, as a document or a print-ready page.",
    bullets: ["Identical output every time", "Document or print-ready page", "Exports to Sentinel, Purview, and Jira"],
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
          <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
            <div className="max-w-2xl animate-rise">
              <span className="eyebrow text-brand">Product</span>
              <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-tightest text-ink md:text-5xl">
                Every surface of the drill
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
                From a single risk score down to the exact Microsoft command that closes the gap, here is the whole
                product, one piece at a time.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  href="/overview"
                  className="inline-flex items-center rounded-full bg-brand px-7 py-3 text-sm font-medium text-white no-underline shadow-elevation transition-all hover:bg-brand-strong active:translate-y-px"
                >
                  Open the dashboard
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center rounded-full border border-hairline bg-surface px-7 py-3 text-sm font-medium text-ink no-underline transition-colors hover:border-ink-faint/40 hover:bg-surface-subtle"
                >
                  See pricing
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Surfaces — alternating */}
        {SURFACES.map((s, i) => {
          const Specimen = s.Specimen;
          const flip = i % 2 === 1;
          return (
            <section key={s.eyebrow} className="border-b border-hairline">
              <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-24 md:py-28 lg:grid-cols-2 lg:gap-16">
                <Reveal className={flip ? "lg:order-2" : ""}>
                  <span className="eyebrow text-brand">{s.eyebrow}</span>
                  <h2 className="mt-3 font-display text-3xl font-semibold tracking-tightest text-ink md:text-[2.1rem]">
                    {s.title}
                  </h2>
                  <p className="mt-4 max-w-lg text-base leading-relaxed text-ink-soft">{s.body}</p>
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
          <div
            aria-hidden
            className="absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(60% 80% at 50% 0%, rgba(0,113,227,0.05), transparent 70%)",
            }}
          />
          <div className="mx-auto max-w-6xl px-6 py-28 text-center md:py-36">
            <Reveal className="mx-auto max-w-2xl">
              <h2 className="font-display text-3xl font-semibold leading-tight tracking-tightest text-ink md:text-[2.4rem]">
                Follow the evidence yourself.
              </h2>
              <p className="mx-auto mt-5 max-w-lg text-lg text-ink-soft">
                Try it on our live demo company. No setup, and we never change anything.
              </p>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/overview"
                  className="inline-flex items-center rounded-full bg-brand px-7 py-3 text-sm font-medium text-white no-underline shadow-elevation transition-all hover:bg-brand-strong active:translate-y-px"
                >
                  Open the dashboard
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center rounded-full border border-hairline bg-surface px-7 py-3 text-sm font-medium text-ink no-underline transition-colors hover:border-ink-faint/40 hover:bg-surface-subtle"
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
