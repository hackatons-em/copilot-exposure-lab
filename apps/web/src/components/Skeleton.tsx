/**
 * Skeleton placeholders — anchor the layout while data loads so there's no jump
 * to a spinner then to content. The shimmer sweep is motion-safe (global guard).
 */
export function Skeleton({ className }: { className?: string }) {
  return <div className={`shimmer-fill animate-shimmer rounded-md bg-surface-subtle ${className ?? ""}`} />;
}

/** A card-shaped skeleton (matches MetricCard / panel chrome). */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={`rounded-2xl border border-hairline bg-surface p-5 shadow-elevation ${className ?? ""}`}>
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-3 h-7 w-12" />
    </div>
  );
}

/** A table skeleton — header row + N body rows. */
export function SkeletonTable({ rows = 6 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-surface shadow-elevation">
      <div className="border-b border-hairline bg-surface-subtle px-4 py-2.5">
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="divide-y divide-hairline">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-10" />
          </div>
        ))}
      </div>
    </div>
  );
}
