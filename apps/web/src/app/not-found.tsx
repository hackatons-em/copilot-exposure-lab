import Link from "next/link";
import { MarketingFooter } from "@/components/landing/MarketingFooter";
import { MarketingNav } from "@/components/landing/MarketingNav";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <MarketingNav />
      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-24 text-center">
        <div aria-hidden className="bg-dotgrid absolute inset-0 -z-10 opacity-60" />
        <div className="max-w-lg">
          <p className="font-mono text-sm uppercase tracking-wider text-brand">404 — no path here</p>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-tightest text-ink md:text-5xl">
            This page isn&rsquo;t exposed.
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-soft">
            The page you&rsquo;re looking for doesn&rsquo;t exist. The ones that matter — your exposure paths — are on
            the dashboard.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center rounded-md bg-brand px-6 py-3 text-sm font-medium text-white no-underline shadow-elevation transition-all hover:bg-brand-strong active:translate-y-px"
            >
              Back home
            </Link>
            <Link
              href="/overview"
              className="inline-flex items-center rounded-md border border-hairline bg-surface px-6 py-3 text-sm font-medium text-ink no-underline shadow-sm transition-colors hover:border-ink-faint/40 hover:bg-surface-subtle"
            >
              Open the dashboard
            </Link>
          </div>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
