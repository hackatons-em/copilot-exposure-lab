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
    title: "Connect safely, read-only",
    body: "You grant read-only access through Microsoft Graph (Microsoft's official API for your 365 data). We read who can open which files, plus labels, groups, sharing links, and AI assistants — never the contents of any document.",
  },
  {
    title: "Map who can reach what",
    body: "We turn your tenant into a map: every person, team, site, file, sharing link, and Copilot assistant, connected by who is allowed to open what. Access passed down through folders or nested groups is fully traced.",
  },
  {
    title: "Safely test real scenarios",
    body: "We safely test what different people could reach — an employee, an outside guest, a custom AI assistant — without touching a single file. The test shows exactly which sensitive documents each one could open today.",
  },
  {
    title: "See the proof, score, and fix",
    body: "Each finding points to the exact file, group, or link that caused it, gets a 0–100 risk score (higher means more exposed), and comes with the precise Microsoft fix to close it.",
  },
  {
    title: "Re-test to prove it's fixed",
    body: "Apply the fix, run the same test again, and watch the risk score fall. You get proof the problem is gone, not just an assumption.",
  },
];

const FEATURES = [
  {
    eyebrow: "Provable",
    title: "Proof, not guesswork",
    body: "Every finding points to the exact thing that caused it — the file, the group, the sharing link, the AI assistant. Nothing is flagged without showing you the evidence.",
  },
  {
    eyebrow: "Auditable",
    title: "A score you can check",
    body: "Risk is set by a clear 0–100 model with deterministic scoring (the same inputs always produce the same score — no guessing, fully auditable). AI may help write summaries; it never decides risk or makes up facts.",
  },
  {
    eyebrow: "Actionable",
    title: "The exact fix, written out",
    body: "Each finding comes with the precise Microsoft commands to close it, ready to copy and paste. They are advisory only: your team reviews and runs them, and we never change anything in your tenant.",
  },
  {
    eyebrow: "Mapped",
    title: "Speaks your security language",
    body: "Every check maps to MITRE ATT&CK and NIST 800-53 / CISA (the standard security frameworks teams already report against), so findings drop straight into the program you already run.",
  },
  {
    eyebrow: "Operational",
    title: "Report and exports built in",
    body: "A board-ready report plus one-click exports to the tools your team already uses — Microsoft Sentinel and Purview (Microsoft's security and data-governance tools) and Jira (the issue tracker).",
  },
  {
    eyebrow: "Private",
    title: "Stays in your environment",
    body: "Everything runs on read-only, tightly limited access inside your own Microsoft tenant. We read only descriptive details about files, never their contents, and nothing leaves your environment.",
  },
];

const FAQ: FaqItem[] = [
  {
    q: "Does this replace Microsoft Purview or Defender?",
    a: "No. It works alongside them. We answer one focused question: could Microsoft 365 Copilot, the custom AI assistants teams build, or your existing file permissions (who is allowed to open which files) expose sensitive data? We show the answer as findings with proof, a risk score, and a fix.",
  },
  {
    q: "Do we need to turn Copilot on first?",
    a: "No, and that's the whole idea. Run the test before you turn Copilot on, so you can fix who can reach what first — instead of investigating a leak after the fact.",
  },
  {
    q: "How do you avoid false alarms?",
    a: "Every finding shows the exact permission, sharing link, group, or AI assistant that creates the risk, with a confidence level. If there's no evidence, there's no finding.",
  },
  {
    q: "What does it cost?",
    a: "A full exposure test is free. Always-on monitoring (the Team plan) and large-organization options (Enterprise) are on the pricing page.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <MarketingNav />

      <main>
        {/* ── Hero ──────────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-hairline">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-24 md:py-32 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
            <div className="max-w-xl animate-rise">
              <span className="eyebrow inline-flex items-center gap-2">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-brand" />
                Microsoft 365 Copilot readiness
              </span>
              <h1 className="mt-5 font-display text-[2.6rem] font-semibold leading-[1.04] tracking-tightest text-ink sm:text-5xl md:text-[3.4rem]">
                Run a Copilot Exposure Drill Before Rollout
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-soft">
                Microsoft 365 Copilot (the AI assistant inside Office, Outlook and Teams) can instantly find any file a
                person is allowed to open — including ones quietly over-shared years ago. We safely test what it could
                expose, show you the proof, and hand you the exact fix, before you turn it on.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  href="/overview"
                  className="inline-flex items-center rounded-full bg-brand px-7 py-3 text-sm font-medium text-white no-underline shadow-elevation transition-all hover:bg-brand-strong active:translate-y-px"
                >
                  Run an exposure assessment
                </Link>
                <Link
                  href="/product"
                  className="inline-flex items-center rounded-full border border-hairline bg-surface px-7 py-3 text-sm font-medium text-ink no-underline transition-colors hover:border-ink-faint/40 hover:bg-surface-subtle"
                >
                  See the product
                </Link>
              </div>
              <p className="mt-6 font-mono text-[11px] uppercase tracking-wider text-ink-faint">
                Read-only · metadata-only · Microsoft-native
              </p>
            </div>

            <Reveal delay={120} className="lg:pl-4">
              <HeroArtifact />
            </Reveal>
          </div>
        </section>

        {/* ── Integration / credibility band ────────────────────── */}
        <IntegrationBand />

        {/* ── Problem / why now ─────────────────────────────────── */}
        <section className="border-b border-hairline">
          <div className="mx-auto max-w-6xl px-6 py-24 md:py-28">
            <Reveal className="max-w-3xl">
              <span className="eyebrow">Why now</span>
              <p className="mt-5 font-display text-2xl font-medium leading-snug tracking-tightest text-ink md:text-[1.75rem]">
                For years, files have been quietly over-shared inside Microsoft 365, and almost no one noticed. Copilot
                changes that overnight: one question can surface a file that &ldquo;everyone in the company&rdquo; was
                technically always allowed to read.{" "}
                <span className="text-ink-soft">
                  Security teams need proof of what Copilot would expose before they turn it on, not an investigation
                  after something leaks.
                </span>
              </p>
            </Reveal>
          </div>
        </section>

        {/* ── Product tour (the showcase) ───────────────────────── */}
        <section id="product" className="scroll-mt-20 border-b border-hairline bg-surface-subtle/40">
          <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
            <Reveal className="max-w-2xl">
              <span className="eyebrow text-brand">See it work</span>
              <h2 className="mt-4 font-display text-3xl font-semibold tracking-tightest text-ink md:text-4xl">
                The whole drill, on one screen
              </h2>
              <p className="mt-4 text-base text-ink-soft">
                The risk score, the map of who can reach what, a safe Copilot test, the exact fix, the security-framework
                mapping, and the board report. Every part shows its evidence and produces the same result every time.
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
          <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
            <Reveal className="max-w-2xl">
              <span className="eyebrow">How it works</span>
              <h2 className="mt-4 font-display text-3xl font-semibold tracking-tightest text-ink md:text-4xl">
                From connect to a fix you can prove
              </h2>
              <p className="mt-4 text-base text-ink-soft">
                Five steps. We never change anything in your tenant, never install software in it, and never store the
                contents of your files.
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
                      <p className="max-w-xl text-base leading-relaxed text-ink-soft">{step.body}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Feature grid ──────────────────────────────────────── */}
        <section className="border-b border-hairline bg-surface-subtle/60">
          <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
            <Reveal className="max-w-2xl">
              <span className="eyebrow">Why you can trust it</span>
              <h2 className="mt-4 font-display text-3xl font-semibold tracking-tightest text-ink md:text-4xl">
                Built for the security buyer
              </h2>
              <p className="mt-4 text-base text-ink-soft">
                For the security and IT leaders who answer for the risk and need evidence they can defend, not another
                AI tool that asks to be trusted.
              </p>
            </Reveal>

            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((item, index) => (
                <Reveal key={item.title} delay={index * 60} className={index === 0 ? "sm:col-span-2 lg:col-span-1" : ""}>
                  <div className="flex h-full flex-col rounded-2xl border border-hairline bg-surface p-7 shadow-elevation transition-shadow duration-200 hover:shadow-elevation-lg">
                    <span className="eyebrow text-brand">{item.eyebrow}</span>
                    <h3 className="mt-3 font-display text-xl font-semibold tracking-tightest text-ink">{item.title}</h3>
                    <p className="mt-2.5 text-base leading-relaxed text-ink-soft">{item.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Outcome strip (animated) ──────────────────────────── */}
        <section className="border-b border-hairline">
          <div className="mx-auto max-w-6xl px-6 py-24 md:py-28">
            <Reveal className="flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
              <p className="max-w-xl font-display text-2xl font-medium leading-snug tracking-tightest text-ink md:text-[1.75rem]">
                One number your board can follow:{" "}
                <span className="text-ink-soft">a risk score that goes down as you close off who can reach what.</span>
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
          <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
            <Reveal className="max-w-2xl">
              <span className="eyebrow">Pricing</span>
              <h2 className="mt-4 font-display text-3xl font-semibold tracking-tightest text-ink md:text-4xl">
                Start free. Scale to always-on.
              </h2>
              <p className="mt-4 text-base text-ink-soft">
                Run a full exposure test for free. Upgrade for always-on monitoring that keeps proving the fix held.
              </p>
            </Reveal>

            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {TIERS.map((tier, i) => (
                <Reveal key={tier.id} delay={i * 70}>
                  <div
                    className={`flex h-full flex-col rounded-2xl border bg-surface p-7 shadow-elevation ${
                      tier.highlight ? "border-brand/40 ring-1 ring-brand/20" : "border-hairline"
                    }`}
                  >
                    <h3 className="font-display text-lg font-semibold tracking-tightest text-ink">{tier.name}</h3>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className="font-display text-3xl font-semibold tracking-tightest text-ink">{tier.price}</span>
                      {tier.unit && <span className="text-[11px] leading-tight text-ink-faint">{tier.unit}</span>}
                    </div>
                    <p className="mt-2 text-sm text-ink-soft">{tier.tagline}</p>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal className="mt-10">
              <Link
                href="/pricing"
                className="inline-flex items-center rounded-full bg-brand px-7 py-3 text-sm font-medium text-white no-underline shadow-elevation transition-all hover:bg-brand-strong active:translate-y-px"
              >
                See full pricing
              </Link>
            </Reveal>
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────── */}
        <section className="border-b border-hairline">
          <div className="mx-auto max-w-3xl px-6 py-24 md:py-32">
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
              <h2 className="font-display text-3xl font-semibold leading-tight tracking-tightest text-ink md:text-[2.6rem]">
                Know what Copilot would expose <span className="text-brand">before you turn it on.</span>
              </h2>
              <p className="mx-auto mt-5 max-w-lg text-lg text-ink-soft">
                Try it on our live demo company and follow the evidence yourself, finding by finding.
              </p>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/overview"
                  className="inline-flex items-center rounded-full bg-brand px-7 py-3 text-sm font-medium text-white no-underline shadow-elevation transition-all hover:bg-brand-strong active:translate-y-px"
                >
                  Open the dashboard
                </Link>
                <a
                  href={SAMPLE_REPORT_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full border border-hairline bg-surface px-7 py-3 text-sm font-medium text-ink no-underline transition-colors hover:border-ink-faint/40 hover:bg-surface-subtle"
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
