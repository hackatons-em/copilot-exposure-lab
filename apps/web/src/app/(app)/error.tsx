"use client";

import Link from "next/link";

/**
 * Route-segment error boundary for the dashboard. A throw in any (app) page lands
 * here instead of blanking the screen; the user can recover (reset) or go home.
 */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-sm uppercase tracking-wider text-severity-critical">Something broke</p>
      <h1 className="mt-3 font-display text-2xl font-semibold tracking-tightest text-ink">
        This view hit an unexpected error.
      </h1>
      <p className="mt-2 max-w-md text-sm text-ink-soft">
        The rest of the app is fine. Try again, or head back to the overview. If it keeps happening, the API may be
        unreachable.
      </p>
      {error.digest ? <p className="mt-2 font-mono text-[11px] text-ink-faint">ref: {error.digest}</p> : null}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center rounded-md bg-brand px-5 py-2.5 text-sm font-medium text-white no-underline shadow-elevation transition-all hover:bg-brand-strong active:translate-y-px"
        >
          Try again
        </button>
        <Link
          href="/overview"
          className="inline-flex items-center rounded-md border border-hairline bg-surface px-5 py-2.5 text-sm font-medium text-ink no-underline shadow-sm transition-colors hover:border-ink-faint/40 hover:bg-surface-subtle"
        >
          Back to overview
        </Link>
      </div>
    </div>
  );
}
