import Link from "next/link";

import { Logo } from "@/components/Logo";
import { HeroArtifact } from "@/components/landing/HeroArtifact";
import { Reveal } from "@/components/landing/Reveal";

/**
 * Marketing landing page — editorial, premium, statically rendered.
 *
 * No data fetching: the "product visual" is a bespoke static artifact
 * (HeroArtifact). The hero headline and the /overview CTA text are load-bearing
 * (asserted by Playwright) and must not change wording.
 */

// The committed, deterministic sample report (Acme Health Finance demo). Lives
// in the repo, not served by this static app — link to the rendered Markdown on
// GitHub so prospects can read a real CISO-grade artifact.
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

const DIFFERENTIATORS = [
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
    eyebrow: "Operational",
    title: "Report + exports built in",
    body: "A print-ready CISO report plus Microsoft Sentinel and Jira exports, so findings land in the tools your team already runs.",
  },
  {
    eyebrow: "Trusted",
    title: "Your cloud, least privilege",
    body: "Runs in your own Microsoft tenant on read-only, scope-limited access. Metadata only — no document contents leave your environment.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-canvas">
      {/* ── Top bar ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-hairline bg-canvas/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <Logo />
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              href="#how-it-works"
              className="hidden rounded-md px-3 py-2 text-sm font-medium text-ink-soft no-underline transition-colors hover:text-ink sm:inline-flex"
            >
              How it works
            </Link>
            <a
              href={SAMPLE_REPORT_URL}
              target="_blank"
              rel="noreferrer"
              className="hidden rounded-md px-3 py-2 text-sm font-medium text-ink-soft no-underline transition-colors hover:text-ink sm:inline-flex"
            >
              Sample report
            </a>
            <Link
              href="#pricing"
              className="hidden rounded-md px-3 py-2 text-sm font-medium text-ink-soft no-underline transition-colors hover:text-ink sm:inline-flex"
            >
              Pricing
            </Link>
            <Link
              href="/overview"
              className="ml-1 inline-flex items-center rounded-md bg-brand px-4 py-2 text-sm font-medium text-white no-underline shadow-elevation transition-colors hover:bg-brand-strong"
            >
              Open the dashboard
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* ── Hero ──────────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-hairline">
          <div aria-hidden className="bg-dotgrid absolute inset-0 -z-10" />
          {/* soft top fade so the grid dissolves into the bar */}
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
                <a
                  href={SAMPLE_REPORT_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-md border border-hairline bg-surface px-6 py-3 text-sm font-medium text-ink no-underline shadow-sm transition-colors hover:border-ink-faint/40 hover:bg-surface-subtle"
                >
                  See a sample report
                </a>
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
                      <span className="font-mono text-sm text-brand">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <div className="grid gap-2 md:grid-cols-[18rem_1fr] md:gap-8">
                      <h3 className="font-display text-lg font-semibold tracking-tightest text-ink">
                        {step.title}
                      </h3>
                      <p className="max-w-xl text-[15px] leading-relaxed text-ink-soft">{step.body}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Proof / differentiators ───────────────────────────── */}
        <section className="border-b border-hairline bg-surface-subtle/60">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
            <Reveal className="max-w-2xl">
              <span className="eyebrow">Why it&rsquo;s credible</span>
              <h2 className="mt-4 font-display text-3xl font-semibold tracking-tightest text-ink md:text-4xl">
                Built for the security buyer
              </h2>
              <p className="mt-4 text-base text-ink-soft">
                For CISOs, security architects, and M365 admins who need defensible evidence — not another
                AI black box.
              </p>
            </Reveal>

            <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-hairline bg-hairline sm:grid-cols-2">
              {DIFFERENTIATORS.map((item, index) => (
                <Reveal key={item.title} delay={index * 60}>
                  <div className="h-full bg-surface p-6 md:p-8">
                    <span className="eyebrow text-brand">{item.eyebrow}</span>
                    <h3 className="mt-3 font-display text-xl font-semibold tracking-tightest text-ink">
                      {item.title}
                    </h3>
                    <p className="mt-2.5 text-[15px] leading-relaxed text-ink-soft">{item.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Outcome strip ─────────────────────────────────────── */}
        <section className="border-b border-hairline">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
            <Reveal className="flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
              <p className="max-w-xl font-display text-2xl font-medium leading-snug tracking-tightest text-ink md:text-[1.75rem]">
                One number your board can track:{" "}
                <span className="text-ink-soft">an exposure score that trends down as you close paths.</span>
              </p>
              <div className="flex shrink-0 items-end gap-4">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display text-6xl font-semibold tracking-tightest text-severity-critical">
                    92
                  </span>
                </div>
                <span aria-hidden className="mb-3 text-2xl text-ink-faint">
                  →
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display text-6xl font-semibold tracking-tightest text-severity-low">
                    18
                  </span>
                </div>
                <span className="mb-2 font-mono text-[11px] uppercase tracking-wider text-ink-faint">
                  exposure
                  <br />
                  score
                </span>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Pricing teaser ────────────────────────────────────── */}
        <section id="pricing" className="scroll-mt-20 border-b border-hairline">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
            <Reveal>
              <div className="flex flex-col items-start justify-between gap-6 rounded-lg border border-hairline bg-surface p-7 shadow-elevation md:flex-row md:items-center md:p-8">
                <div>
                  <span className="eyebrow">Pricing</span>
                  <p className="mt-3 font-display text-xl font-semibold tracking-tightest text-ink">
                    Copilot Exposure Assessment —{" "}
                    <span className="font-mono text-brand">$10k–$25k</span>, 2–4 weeks.
                  </p>
                  <p className="mt-1.5 text-[15px] text-ink-soft">
                    A fixed-scope engagement with a CISO-grade report. Continuous monitoring from there.
                  </p>
                </div>
                <a
                  href={SAMPLE_REPORT_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex shrink-0 items-center rounded-md border border-hairline bg-surface px-5 py-2.5 text-sm font-medium text-ink no-underline shadow-sm transition-colors hover:border-ink-faint/40 hover:bg-surface-subtle"
                >
                  See what you get
                </a>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Final CTA ─────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          <div aria-hidden className="bg-dotgrid absolute inset-0 -z-10 opacity-70" />
          <div className="mx-auto max-w-6xl px-6 py-24 text-center md:py-28">
            <Reveal className="mx-auto max-w-2xl">
              <h2 className="font-display text-3xl font-semibold leading-tight tracking-tightest text-ink md:text-[2.6rem]">
                Know what Copilot would expose —{" "}
                <span className="text-brand">before you turn it on.</span>
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

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="border-t border-hairline bg-surface-subtle/50">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 md:flex-row md:items-center md:justify-between">
          <Logo />
          <p className="max-w-xl text-xs leading-relaxed text-ink-faint">
            Independent product. Does not replace Microsoft Purview, Defender, or SharePoint Advanced Management.
          </p>
        </div>
      </footer>
    </div>
  );
}
