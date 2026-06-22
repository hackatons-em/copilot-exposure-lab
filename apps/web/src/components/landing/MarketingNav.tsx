"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";

const SAMPLE_REPORT_URL = "/sample-report.html";

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

function NavLinkEl({ link, onClick, className }: { link: NavLink; onClick?: () => void; className?: string }) {
  const cls = className ?? "rounded-md px-3 py-2 text-sm font-medium text-ink-soft no-underline transition-colors hover:text-ink";
  return link.external ? (
    <a href={link.href} target="_blank" rel="noreferrer" className={cls} onClick={onClick}>
      {link.label}
    </a>
  ) : (
    <Link href={link.href} className={cls} onClick={onClick}>
      {link.label}
    </Link>
  );
}

/**
 * Shared marketing top bar — used by the landing, /product, /pricing, and the
 * MarketingChrome pages. Sticky; gains a hairline + blur once the page scrolls.
 * Desktop shows inline links; mobile gets a toggle menu.
 */
export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = (): void => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const elevated = scrolled || open;

  return (
    <header
      className={`sticky top-0 z-30 transition-colors duration-300 ${
        elevated ? "border-b border-hairline bg-canvas/90 backdrop-blur" : "border-b border-transparent bg-canvas/0"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <Link href="/" className="no-underline" aria-label="Copilot Exposure Lab — home" onClick={() => setOpen(false)}>
          <Logo />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 sm:flex sm:gap-2">
          {LINKS.map((link) => (
            <NavLinkEl key={link.href} link={link} />
          ))}
          <Link
            href="/overview"
            className="ml-1 inline-flex items-center rounded-full bg-brand px-5 py-2 text-sm font-medium text-white no-underline shadow-elevation transition-all hover:bg-brand-strong active:translate-y-px"
          >
            Open the dashboard
          </Link>
        </nav>

        {/* Mobile toggle */}
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-hairline bg-surface text-ink sm:hidden"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
            {open ? (
              <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            ) : (
              <path d="M3 5h12M3 9h12M3 13h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu panel */}
      {open && (
        <div className="border-t border-hairline bg-canvas/95 backdrop-blur sm:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-6 py-4">
            {LINKS.map((link) => (
              <NavLinkEl
                key={link.href}
                link={link}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-ink no-underline transition-colors hover:bg-surface-subtle"
              />
            ))}
            <Link
              href="/overview"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex items-center justify-center rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white no-underline shadow-elevation transition-colors hover:bg-brand-strong"
            >
              Open the dashboard
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
