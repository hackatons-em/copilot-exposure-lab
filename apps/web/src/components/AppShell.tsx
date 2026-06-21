"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "./Button";
import { PlayDemoButton } from "./guided/PlayDemoButton";
import { Logo } from "./Logo";
import { useWorkspace } from "./WorkspaceProvider";

interface NavItem {
  href: string;
  label: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Grouped navigation — eyebrow-labelled sections give the rail structure. */
const NAV: NavGroup[] = [
  {
    label: "Assess",
    items: [
      { href: "/overview", label: "Overview" },
      { href: "/findings", label: "Findings" },
      { href: "/graph", label: "Exposure graph" },
      { href: "/threat-model", label: "Threat model" },
      { href: "/identities", label: "Identities" },
    ],
  },
  {
    label: "Prove",
    items: [
      { href: "/scenarios", label: "Scenarios" },
      { href: "/copilot-sim", label: "Copilot sim" },
      { href: "/agents", label: "Agents" },
      { href: "/resources", label: "Resources" },
    ],
  },
  {
    label: "Act",
    items: [
      { href: "/remediation", label: "Remediation" },
      { href: "/reports", label: "Reports" },
      { href: "/exports", label: "Exports" },
      { href: "/schedules", label: "Schedules" },
    ],
  },
  {
    label: "Govern",
    items: [
      { href: "/audit", label: "Audit Log" },
      { href: "/settings", label: "Settings" },
    ],
  },
];

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** The grouped nav links, shared by the desktop rail and the mobile drawer. */
function NavSections({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      {NAV.map((group) => (
        <div key={group.label}>
          <p className="eyebrow px-3 pb-2">{group.label}</p>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={`group relative flex items-center rounded-md px-3 py-2 text-sm no-underline transition-colors duration-150 ${
                    active
                      ? "bg-brand-soft font-medium text-brand"
                      : "text-ink-soft hover:bg-surface-subtle hover:text-ink"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-brand transition-opacity duration-150 ${
                      active ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { runAssessment, scanning, lastRun } = useWorkspace();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close the mobile drawer on route change.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-hairline bg-surface md:flex">
        <div className="flex h-16 items-center border-b border-hairline px-5">
          <Link href="/" className="no-underline" aria-label="Copilot Exposure Lab — home">
            <Logo />
          </Link>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          <NavSections pathname={pathname} />
        </nav>

        <div className="border-t border-hairline px-5 py-4">
          <p className="text-xs leading-relaxed text-ink-faint">
            Metadata-only mode. Document contents are not stored.
          </p>
        </div>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            aria-hidden
            className="absolute inset-0 bg-ink/20 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="animate-fade-in absolute inset-y-0 left-0 flex w-72 max-w-[80vw] flex-col border-r border-hairline bg-surface shadow-elevation-lg">
            <div className="flex h-16 items-center justify-between border-b border-hairline px-5">
              <Logo />
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setDrawerOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-hairline text-ink"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                  <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
              <NavSections pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
            </nav>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 flex-wrap items-center justify-between gap-3 border-b border-hairline bg-surface/85 px-4 backdrop-blur-md md:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-hairline text-ink md:hidden"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                <path d="M3 5h12M3 9h12M3 13h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
            <span className="md:hidden">
              <Logo size={26} markOnly />
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface-subtle px-2.5 py-1 text-xs font-medium text-ink-soft">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-severity-low" />
              Demo · metadata-only
            </span>
          </div>
          <div className="flex items-center gap-3">
            {lastRun ? (
              <span className={`hidden text-xs sm:inline ${lastRun.ok ? "text-ink-soft" : "text-severity-critical"}`}>
                {lastRun.message}
              </span>
            ) : null}
            <PlayDemoButton />
            <Button onClick={() => void runAssessment()} busy={scanning}>
              {scanning ? "Running assessment…" : "Run exposure assessment"}
            </Button>
          </div>
        </header>

        <main className="flex-1">
          <div className="mx-auto w-full max-w-[1200px] px-4 py-8 md:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
