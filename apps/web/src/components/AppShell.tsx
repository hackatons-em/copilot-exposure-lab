"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
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
    ],
  },
  {
    label: "Prove",
    items: [
      { href: "/scenarios", label: "Scenarios" },
      { href: "/copilot-sim", label: "Copilot sim" },
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

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { runAssessment, scanning, lastRun } = useWorkspace();

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-hairline bg-surface md:flex">
        <div className="flex h-16 items-center border-b border-hairline px-5">
          <Link href="/" className="no-underline" aria-label="Copilot Exposure Lab — home">
            <Logo />
          </Link>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
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
        </nav>

        <div className="border-t border-hairline px-5 py-4">
          <p className="text-xs leading-relaxed text-ink-faint">
            Metadata-only mode. Document contents are not stored.
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 flex-wrap items-center justify-between gap-3 border-b border-hairline bg-surface/85 px-4 backdrop-blur-md md:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="md:hidden">
              <Logo size={26} />
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface-subtle px-2.5 py-1 text-xs font-medium text-ink-soft">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-severity-low" />
              Demo · metadata-only
            </span>
          </div>
          <div className="flex items-center gap-3">
            {lastRun ? (
              <span
                className={`hidden text-xs sm:inline ${
                  lastRun.ok ? "text-ink-soft" : "text-severity-critical"
                }`}
              >
                {lastRun.message}
              </span>
            ) : null}
            <PlayDemoButton />
            <Button onClick={() => void runAssessment()} busy={scanning}>
              {scanning ? "Running assessment…" : "Run exposure assessment"}
            </Button>
          </div>
        </header>

        <main className="bg-dotgrid flex-1">
          <div className="mx-auto w-full max-w-[1200px] px-4 py-8 md:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
