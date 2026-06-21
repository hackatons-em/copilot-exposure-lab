import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { MarketingFooter } from "./MarketingFooter";

/**
 * Page chrome for top-level marketing/credibility pages (/security, /research):
 * the landing's top bar + shared footer, with an editorial content column. Keeps
 * these pages visually part of the marketing site, distinct from the app shell.
 */
export function MarketingChrome({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-30 border-b border-hairline bg-canvas/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <Link href="/" className="no-underline" aria-label="Copilot Exposure Lab — home">
            <Logo />
          </Link>
          <Link
            href="/overview"
            className="inline-flex items-center rounded-md bg-brand px-4 py-2 text-sm font-medium text-white no-underline shadow-elevation transition-colors hover:bg-brand-strong"
          >
            Open the dashboard
          </Link>
        </div>
      </header>

      <main className="relative">
        <div aria-hidden className="bg-dotgrid absolute inset-x-0 top-0 -z-10 h-40 opacity-60" />
        <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">{children}</div>
      </main>

      <MarketingFooter />
    </div>
  );
}
