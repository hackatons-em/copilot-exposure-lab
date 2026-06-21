import { Fragment } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { MarketingFooter } from "@/components/landing/MarketingFooter";
import { MarketingNav } from "@/components/landing/MarketingNav";
import { FaqAccordion } from "@/components/landing/FaqAccordion";
import { Reveal } from "@/components/landing/Reveal";
import { COMPARISON, PRICING_FAQ, PRICING_NOTE, TIERS, type PricingTier } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Pricing — Copilot Exposure Lab",
  description:
    "Free one-time exposure scan, Team continuous monitoring, and Enterprise for large estates and MSSPs. Read-only, metadata-only, deterministic.",
};

function Check() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-label="included" className="text-severity-low">
      <path d="M3.5 8.5l3 3 6-6.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Dash() {
  return <span aria-label="not included" className="text-ink-faint">—</span>;
}

function Cell({ value }: { value: boolean | string }) {
  if (value === true) return <Check />;
  if (value === false) return <Dash />;
  return <span className="font-mono text-xs text-ink-soft">{value}</span>;
}

function TierCard({ tier }: { tier: PricingTier }) {
  return (
    <div
      className={`relative flex h-full flex-col rounded-2xl border bg-surface p-7 shadow-elevation transition-shadow duration-200 hover:shadow-elevation-lg ${
        tier.highlight ? "border-brand/40 ring-1 ring-brand/20" : "border-hairline"
      }`}
    >
      {tier.highlight && (
        <span className="absolute -top-3 left-7 rounded-md bg-brand px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
          Most popular
        </span>
      )}
      <h3 className="font-display text-lg font-semibold tracking-tightest text-ink">{tier.name}</h3>
      <p className="mt-1 text-sm text-ink-soft">{tier.tagline}</p>
      <div className="mt-4 flex items-baseline gap-1.5">
        <span className="font-display text-4xl font-semibold tracking-tightest text-ink">{tier.price}</span>
        {tier.unit && <span className="text-xs leading-tight text-ink-faint">{tier.unit}</span>}
      </div>
      <Link
        href={tier.cta.href}
        className={`mt-5 inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium no-underline transition-all active:translate-y-px ${
          tier.highlight
            ? "bg-brand text-white shadow-elevation hover:bg-brand-strong"
            : "border border-hairline bg-surface text-ink hover:border-ink-faint/40 hover:bg-surface-subtle"
        }`}
      >
        {tier.cta.label}
      </Link>
      <ul className="mt-6 space-y-2.5 border-t border-hairline pt-5">
        {tier.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-ink-soft">
            <span className="mt-0.5 shrink-0">
              <Check />
            </span>
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <MarketingNav />

      <main>
        <section className="relative overflow-hidden border-b border-hairline">
          <div className="mx-auto max-w-6xl px-6 py-24 md:py-28">
            <Reveal className="max-w-2xl">
              <span className="eyebrow text-brand">Pricing</span>
              <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-tightest text-ink md:text-5xl">
                Start free. Scale to always-on.
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
                Run a complete exposure scan for free. Upgrade when you want continuous monitoring that proves the fix.
              </p>
              <p className="mt-3 font-mono text-[11px] uppercase tracking-wider text-ink-faint">{PRICING_NOTE}</p>
            </Reveal>

            <div className="mt-14 grid gap-5 text-left md:grid-cols-3">
              {TIERS.map((tier, i) => (
                <Reveal key={tier.id} delay={i * 80}>
                  <TierCard tier={tier} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison */}
        <section className="border-b border-hairline">
          <div className="mx-auto max-w-5xl px-6 py-24 md:py-28">
            <Reveal>
              <h2 className="font-display text-2xl font-semibold tracking-tightest text-ink md:text-3xl">
                Compare plans
              </h2>
            </Reveal>
            <div className="mt-10 overflow-x-auto rounded-2xl border border-hairline bg-surface shadow-elevation">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-hairline">
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                      Capability
                    </th>
                    {TIERS.map((t) => (
                      <th
                        key={t.id}
                        className="w-28 px-4 py-3 text-center font-display text-sm font-semibold tracking-tightest text-ink"
                      >
                        {t.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((group) => (
                    <Fragment key={group.group}>
                      <tr className="bg-surface-subtle/60">
                        <td colSpan={4} className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                          {group.group}
                        </td>
                      </tr>
                      {group.rows.map((row) => (
                        <tr key={row.label} className="border-b border-hairline last:border-0">
                          <td className="px-4 py-3 text-ink-soft">{row.label}</td>
                          <td className="px-4 py-3 text-center"><Cell value={row.free} /></td>
                          <td className="px-4 py-3 text-center"><Cell value={row.team} /></td>
                          <td className="px-4 py-3 text-center"><Cell value={row.enterprise} /></td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Illustrative quote */}
        <section className="border-b border-hairline bg-surface-subtle/50">
          <div className="mx-auto max-w-3xl px-6 py-24 text-center md:py-28">
            <Reveal>
              <p className="font-display text-2xl font-medium leading-snug tracking-tightest text-ink md:text-[1.75rem]">
                &ldquo;Finally, proof of what Copilot would surface — with the exact fix and a number my board can
                track.&rdquo;
              </p>
              <p className="mt-4 text-sm text-ink-faint">
                — CISO, mid-market financial services{" "}
                <span className="font-mono text-[11px] uppercase tracking-wide">(illustrative)</span>
              </p>
            </Reveal>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-b border-hairline">
          <div className="mx-auto max-w-3xl px-6 py-24 md:py-28">
            <Reveal>
              <h2 className="font-display text-2xl font-semibold tracking-tightest text-ink md:text-3xl">
                Pricing questions
              </h2>
            </Reveal>
            <div className="mt-8">
              <FaqAccordion items={PRICING_FAQ} />
            </div>
          </div>
        </section>

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
                Run your first exposure scan free.
              </h2>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/overview"
                  className="inline-flex items-center rounded-full bg-brand px-7 py-3 text-sm font-medium text-white no-underline shadow-elevation transition-all hover:bg-brand-strong active:translate-y-px"
                >
                  Open the dashboard
                </Link>
                <Link
                  href="/product"
                  className="inline-flex items-center rounded-full border border-hairline bg-surface px-7 py-3 text-sm font-medium text-ink no-underline transition-colors hover:border-ink-faint/40 hover:bg-surface-subtle"
                >
                  See the product
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
