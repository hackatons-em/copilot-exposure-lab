interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-hairline bg-surface px-4 py-6 text-sm text-ink-soft shadow-elevation">
      <span
        aria-hidden
        className="h-4 w-4 animate-spin rounded-full border-2 border-surface-muted border-t-brand"
      />
      {label}
    </div>
  );
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="rounded-lg border border-severity-critical/30 bg-severity-critical-soft px-4 py-4 text-sm shadow-elevation">
      <p className="font-medium text-severity-critical">Something went wrong</p>
      <p className="mt-1 text-ink-soft">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-md border border-hairline bg-surface px-3 py-1.5 text-xs font-medium text-ink shadow-sm transition-colors duration-150 hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
