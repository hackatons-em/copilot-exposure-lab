"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Button } from "./Button";
import { useWorkspace } from "./WorkspaceProvider";

const NAV: { href: string; label: string }[] = [
  { href: "/overview", label: "Overview" },
  { href: "/findings", label: "Findings" },
  { href: "/scenarios", label: "Scenarios" },
  { href: "/resources", label: "Resources" },
  { href: "/remediation", label: "Remediation" },
  { href: "/reports", label: "Reports" },
  { href: "/exports", label: "Exports" },
  { href: "/schedules", label: "Schedules" },
  { href: "/audit", label: "Audit Log" },
  { href: "/settings", label: "Settings" },
];

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { runAssessment, scanning, lastRun } = useWorkspace();

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-surface-border bg-surface md:flex">
        <div className="border-b border-surface-border px-4 py-4">
          <Link href="/" className="block text-sm font-semibold text-ink no-underline">
            Copilot Exposure Lab
          </Link>
          <p className="mt-0.5 text-xs text-ink-faint">Microsoft-native exposure testing</p>
        </div>
        <nav className="flex-1 space-y-0.5 p-2">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-md px-3 py-2 text-sm no-underline transition-colors ${
                  active
                    ? "bg-brand-soft font-medium text-brand"
                    : "text-ink-soft hover:bg-surface-subtle hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-surface-border p-3 text-xs text-ink-faint">
          Metadata-only mode. Document contents are not stored.
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-surface-border bg-surface/95 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-ink md:hidden">Copilot Exposure Lab</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-ink-soft ring-1 ring-inset ring-surface-border">
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
            <Button onClick={() => void runAssessment()} busy={scanning}>
              {scanning ? "Running assessment…" : "Run exposure assessment"}
            </Button>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
