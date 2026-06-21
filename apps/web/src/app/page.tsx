import Link from "next/link";

import { CountStat } from "@/components/landing/CountStat";
import { FaqAccordion, type FaqItem } from "@/components/landing/FaqAccordion";
import { HeroArtifact } from "@/components/landing/HeroArtifact";
import { IntegrationBand } from "@/components/landing/IntegrationBand";
import { MarketingFooter } from "@/components/landing/MarketingFooter";
import { MarketingNav } from "@/components/landing/MarketingNav";
import { Quotes } from "@/components/landing/Quotes";
import { Reveal } from "@/components/landing/Reveal";
import { ProductTour } from "@/components/showcase/ProductTour";
import { TIERS } from "@/lib/pricing";

/**
 * Marketing landing page — editorial, premium, statically rendered.
 *
 * No data fetching: product visuals are bespoke static artifacts (HeroArtifact +
 * the showcase specimens in ProductTour). The hero headline and the /overview CTA
 * text are load-bearing (asserted by Playwright) and must not change wording.
 */

const SAMPLE_REPORT_URL =
  "https://github.com/hackatons-em/copilot-exposure-lab/blob/main/docs/sample-report/acme-exposure-report.md";

const STEPS = [
  {
    title: "Connect, metadata-only",
    body: "Read-only Microsoft Graph scopes. We ingest labels, permissions, groups, links, and agents — never document contents.",
  },
  {
    title: "Build the permission graph",
    body: "Every user, group, site, file, sharing link, and Copilot agent becomes a node. Inherited and nested access is resolved.",
  },
  {
    title: "Run exposure scenarios",
    body: "Safe drills as real personas — an employee, a guest, a Copilot Studio agent — trace what sensitive data each could actually reach.",
  },
  {
    title: "Get evidence + score + fix",
    body: "Each finding carries an evidence chain to its source object, a deterministic 0–100 score, and a Microsoft-native remediation.",
  },
  {
    title: "Re-scan to prove the fix",
    body: "Close the path, re-run the same drill, and watch the exposure score trend down. The fix is provable, not assumed.",
  },
];

const FEATURES = [
  {
    eyebrow: "Defensible",
    title: "Evidence, not vibes",
    body: "Every finding traces to a concrete source object — the file, group, link, or agent that created the exposure. Nothing is asserted without proof.",
  },
  {
    eyebrow: "Deterministic",
    title: "Scoring you can audit",
    body: "A transparent 0–100 model sets severity — same input, same score, every time. LLMs may summarize; they never decide risk or invent facts.",
  },
  {
    eyebrow: "Actionable",
    title: "The exact fix, written",
    body: "Each finding ships a copy-pasteable Microsoft Graph PowerShell / PnP script wired to its real ids. Advisory — reviewed and run by you, never auto-executed.",
  },
  {
    eyebrow: "Mapped",
    title: "Threat-framework rigor",
    body: "Every rule maps to MITRE ATT&CK techniques and NIST 800-53 / CISA controls, so findings route straight into your existing program.",
  },
  {
    eyebrow: "Operational",
    title: "Report + exports built in",
    body: "A print-ready CISO report plus Microsoft Sentinel, Purview, and Jira exports, so findings land in the tools your team already runs.",
  },
  {
    eyebrow: "Trusted",
    title: "Your cloud, least privilege",
    body: "Runs on read-only, scope-limited access in your own Microsoft tenant. Metadata only — no document contents leave your environment.",
  },
];

const FAQ: FaqItem[] = [
  {
    q: "Is this a Purview or Defender replacement?",
    a: "No. It's complementary. We focus narrowly on whether Copilot, agents, and existing SharePoint/OneDrive permissions could expose sensitive data — and we surface it as evidence-backed, scored, fixable findings.",
  },
  {
    q: "Does Copilot need to be rolled out first?",
    a: "No — that's the point. Run the drill before rollout to see what Copilot would surface, so you fix the permission surface first instead of doing a postmortem after.",
  },
  {
    q: "How do you avoid false positives?",
    a: "Findings are deterministic and evidence-backed: each one points at the exact permission, link, group, or agent that creates the path, with a confidence band. No evidence, no finding.",
  },
  {
    q: "What does it cost?",
    a: "A complete exposure scan is free. Continuous monitoring (Team) and Enterprise plans are on the pricing page.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <MarketingNav />

      <main>
        {/* ── Hero ──────────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-hairline">
          <div aria-hidden className="bg-dotgrid absolute inset-0 -z-10" />
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 -z-10 h-24 bg-gradient-to-b from-canvas to-transparent"
          />
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:py-28 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
            <Reveal className="max-w-xl">
              <span className="eyebrow inline-flex items-center gap-2">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-brand" />
                Microsoft 365 Copilot readiness
              </span>
              <h1 className="mt-5 font-display text-[2.6rem] font-semibold leading-[1.04] tracking-tightest text-ink sm:text-5xl md:text-[3.4rem]">
                Run a Copilot Exposure Drill Before Rollout
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-soft">
                Copilot is only as safe as the permissions beneath it. Simulate the exposure paths, see the
                evidence, and fix what matters — before you flip the switch.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/overview"
                  className="inline-flex items-center rounded-md bg-brand px-6 py-3 text-sm font-medium text-white no-underline shadow-elevation transition-all hover:bg-brand-strong active:translate-y-px"
                >
                  Run an exposure assessment
                </Link>
                <Link
                  href="/product"
                  className="inline-flex items-center rounded-md border border-hairline bg-surface px-6 py-3 text-sm font-medium text-ink no-underline shadow-sm transition-colors hover:border-ink-faint/40 hover:bg-surface-subtle"
                >
                  See the product
                </Link>
              </div>
              <p className="mt-5 font-mono text-[11px] uppercase tracking-wider text-ink-faint">
                Read-only · metadata-only · Microsoft-native
              </p>
            </Reveal>

            <Reveal delay={120} className="lg:pl-4">
              <HeroArtifact />
            </Reveal>
          </div>
        </section>

        {/* ── Integration / credibility band ────────────────────── */}
        <IntegrationBand />

        {/* ── Problem / why now ─────────────────────────────────── */}
        <section className="border-b border-hairline">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
            <Reveal className="max-w-3xl">
              <span className="eyebrow">Why now</span>
              <p className="mt-5 font-display text-2xl font-medium leading-snug tracking-tightest text-ink md:text-[1.75rem]">
                A decade of M365 oversharing has been mostly invisible. Copilot makes it instant — one prompt can
                surface a file that &ldquo;Everyone&rdquo; could technically always read.{" "}
                <span className="text-ink-soft">
                  Security teams need proof of what Copilot would expose, before rollout — not a postmortem after.
                </span>
              </p>
            </Reveal>
          </div>
        </section>

        {/* ── Product tour (the showcase) ───────────────────────── */}
        <section id="product" className="scroll-mt-20 border-b border-hairline bg-surface-subtle/40">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
            <Reveal className="max-w-2xl">
              <span className="eyebrow text-brand">See it work</span>
              <h2 className="mt-4 font-display text-3xl font-semibold tracking-tightest text-ink md:text-4xl">
                The whole drill, on one screen
              </h2>
              <p className="mt-4 text-base text-ink-soft">
                Score, attack graph, Copilot simulation, the exact fix, threat mapping, and the board report — every
                surface is deterministic and evidence-backed.
              </p>
            </Reveal>
            <div className="mt-12">
              <ProductTour />
            </div>
            <Reveal className="mt-10">
              <Link href="/product" className="text-sm font-medium text-brand no-underline hover:underline">
                Explore the full product →
              </Link>
            </Reveal>
          </div>
        </section>

        {/* ── How it works ──────────────────────────────────────── */}
        <section id="how-it-works" className="scroll-mt-20 border-b border-hairline">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
            <Reveal className="max-w-2xl">
              <span className="eyebrow">How it works</span>
              <h2 className="mt-4 font-display text-3xl font-semibold tracking-tightest text-ink md:text-4xl">
                From connection to provable fix
              </h2>
              <p className="mt-4 text-base text-ink-soft">
                Five steps. No write access, no agents installed in your tenant, no document contents stored.
              </p>
            </Reveal>

            <ol className="mt-12 divide-y divide-hairline border-t border-hairline">
              {STEPS.map((step, index) => (
                <Reveal as="li" key={step.title} delay={index * 60}>
                  <div className="grid gap-3 py-6 md:grid-cols-[5rem_1fr] md:gap-8 md:py-7">
                    <div className="flex items-baseline gap-3 md:block">
                      <span className="font-mono text-sm text-brand">{String(index + 1).padStart(2, "0")}</span>
                    </div>
                    <div className="grid gap-2 md:grid-cols-[18rem_1fr] md:gap-8">
                      <h3 className="font-display text-lg font-semibold tracking-tightest text-ink">{step.title}</h3>
                      <p className="max-w-xl text-[15px] leading-relaxed text-ink-soft">{step.body}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Feature grid ──────────────────────────────────────── */}
        <section className="border-b border-hairline bg-surface-subtle/60">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
            <Reveal className="max-w-2xl">
              <span className="eyebrow">Why it&rsquo;s credible</span>
              <h2 className="mt-4 font-display text-3xl font-semibold tracking-tightest text-ink md:text-4xl">
                Built for the security buyer
              </h2>
              <p className="mt-4 text-base text-ink-soft">
                For CISOs, security architects, and M365 admins who need defensible evidence — not another AI black box.
              </p>
            </Reveal>

            <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((item, index) => (
                <Reveal key={item.title} delay={index * 50}>
                  <div className="h-full bg-surface p-6 md:p-7">
                    <span className="eyebrow text-brand">{item.eyebrow}</span>
                    <h3 className="mt-3 font-display text-xl font-semibold tracking-tightest text-ink">{item.title}</h3>
                    <p className="mt-2.5 text-[15px] leading-relaxed text-ink-soft">{item.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Outcome strip (animated) ──────────────────────────── */}
        <section className="border-b border-hairline">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
            <Reveal className="flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
              <p className="max-w-xl font-display text-2xl font-medium leading-snug tracking-tightest text-ink md:text-[1.75rem]">
                One number your board can track:{" "}
                <span className="text-ink-soft">an exposure score that trends down as you close paths.</span>
              </p>
              <div className="flex shrink-0 items-end gap-4">
                <CountStat
                  value={92}
                  className="font-display text-6xl font-semibold tabular-nums tracking-tightest text-severity-critical"
                />
                <span aria-hidden className="mb-3 text-2xl text-ink-faint">→</span>
                <CountStat
                  value={18}
                  className="font-display text-6xl font-semibold tabular-nums tracking-tightest text-severity-low"
                />
                <span className="mb-2 font-mono text-[11px] uppercase tracking-wider text-ink-faint">
                  exposure
                  <br />
                  score
                </span>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Illustrative quotes ───────────────────────────────── */}
        <Quotes />

        {/* ── Pricing teaser ────────────────────────────────────── */}
        <section id="pricing" className="scroll-mt-20 border-b border-hairline bg-surface-subtle/60">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
            <Reveal className="max-w-2xl">
              <span className="eyebrow">Pricing</span>
              <h2 className="mt-4 font-display text-3xl font-semibold tracking-tightest text-ink md:text-4xl">
                Start free. Scale to always-on.
              </h2>
              <p className="mt-4 text-base text-ink-soft">
                Run a full exposure scan for free; upgrade for continuous monitoring that proves the fix.
              </p>
            </Reveal>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {TIERS.map((tier, i) => (
                <Reveal key={tier.id} delay={i * 70}>
                  <div
                    className={`flex h-full flex-col rounded-lg border bg-surface p-6 shadow-elevation ${
                      tier.highlight ? "border-brand/40 ring-1 ring-brand/20" : "border-hairline"
                    }`}
                  >
                    <h3 className="font-display text-lg font-semibold tracking-tightest text-ink">{tier.name}</h3>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className="font-display text-3xl font-semibold tracking-tightest text-ink">{tier.price}</span>
                      {tier.unit && <span className="text-[11px] leading-tight text-ink-faint">{tier.unit}</span>}
                    </div>
                    <p className="mt-2 text-[13px] text-ink-soft">{tier.tagline}</p>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal className="mt-8">
              <Link
                href="/pricing"
                className="inline-flex items-center rounded-md bg-brand px-6 py-3 text-sm font-medium text-white no-underline shadow-elevation transition-all hover:bg-brand-strong active:translate-y-px"
              >
                See full pricing
              </Link>
            </Reveal>
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────── */}
        <section className="border-b border-hairline">
          <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
            <Reveal>
              <span className="eyebrow">FAQ</span>
              <h2 className="mt-4 font-display text-3xl font-semibold tracking-tightest text-ink md:text-4xl">
                Questions, answered
              </h2>
            </Reveal>
            <div className="mt-8">
              <FaqAccordion items={FAQ} />
            </div>
          </div>
        </section>

        {/* ── Final CTA ─────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          <div aria-hidden className="bg-dotgrid absolute inset-0 -z-10 opacity-70" />
          <div className="mx-auto max-w-6xl px-6 py-24 text-center md:py-28">
            <Reveal className="mx-auto max-w-2xl">
              <h2 className="font-display text-3xl font-semibold leading-tight tracking-tightest text-ink md:text-[2.6rem]">
                Know what Copilot would expose — <span className="text-brand">before you turn it on.</span>
              </h2>
              <p className="mx-auto mt-5 max-w-lg text-lg text-ink-soft">
                Run the drill against the live demo tenant and walk the evidence chain yourself.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/overview"
                  className="inline-flex items-center rounded-md bg-brand px-6 py-3 text-sm font-medium text-white no-underline shadow-elevation transition-all hover:bg-brand-strong active:translate-y-px"
                >
                  Open the dashboard
                </Link>
                <a
                  href={SAMPLE_REPORT_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-md border border-hairline bg-surface px-6 py-3 text-sm font-medium text-ink no-underline shadow-sm transition-colors hover:border-ink-faint/40 hover:bg-surface-subtle"
                >
                  Read the sample report
                </a>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
