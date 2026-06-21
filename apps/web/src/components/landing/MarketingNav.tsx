"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";

const SAMPLE_REPORT_URL =
  "https://github.com/hackatons-em/copilot-exposure-lab/blob/main/docs/sample-report/acme-exposure-report.md";

interface NavLink {
  href: string;
  label: string;
  external?: boolean;
}

const LINKS: NavLink[] = [
  { href: "/product", label: "Product" },
  { href: "/pricing", label: "Pricing" },
  { href: "/security", label: "Security" },
  { href: SAMPLE_REPORT_URL, label: "Sample report", external: true },
];

/**
 * Shared marketing top bar — used by the landing, /product, /pricing, and the
 * MarketingChrome pages. Sticky; gains a hairline + blur once the page scrolls so
 * it lifts off the hero cleanly.
 */
export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = (): void => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-30 transition-colors duration-300 ${
        scrolled ? "border-b border-hairline bg-canvas/85 backdrop-blur" : "border-b border-transparent bg-canvas/0"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <Link href="/" className="no-underline" aria-label="Copilot Exposure Lab — home">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {LINKS.map((link) =>
            link.external ? (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="hidden rounded-md px-3 py-2 text-sm font-medium text-ink-soft no-underline transition-colors hover:text-ink sm:inline-flex"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="hidden rounded-md px-3 py-2 text-sm font-medium text-ink-soft no-underline transition-colors hover:text-ink sm:inline-flex"
              >
                {link.label}
              </Link>
            ),
          )}
          <Link
            href="/overview"
            className="ml-1 inline-flex items-center rounded-md bg-brand px-4 py-2 text-sm font-medium text-white no-underline shadow-elevation transition-all hover:bg-brand-strong active:translate-y-px"
          >
            Open the dashboard
          </Link>
        </nav>
      </div>
    </header>
  );
}
