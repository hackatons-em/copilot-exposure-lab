import type { ReactNode } from "react";
import { MarketingFooter } from "./MarketingFooter";
import { MarketingNav } from "./MarketingNav";

/**
 * Page chrome for top-level marketing/credibility pages (/security, /research):
 * the shared marketing nav + footer, with an editorial content column. Keeps these
 * pages visually part of the marketing site, distinct from the app shell.
 */
export function MarketingChrome({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas">
      <MarketingNav />
      <main className="relative">
        <div className="mx-auto max-w-3xl px-6 py-20 md:py-28">{children}</div>
      </main>
      <MarketingFooter />
    </div>
  );
}
