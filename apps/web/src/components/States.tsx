interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-surface-border bg-surface px-4 py-6 text-sm text-ink-soft">
      <span
        aria-hidden
        className="h-4 w-4 animate-spin rounded-full border-2 border-surface-border border-t-brand"
      />
      {label}
    </div>
  );
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="rounded-lg border border-severity-critical/30 bg-severity-critical/5 px-4 py-4 text-sm">
      <p className="font-medium text-severity-critical">Something went wrong</p>
      <p className="mt-1 text-ink-soft">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-md border border-surface-border bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-subtle"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
