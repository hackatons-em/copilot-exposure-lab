interface TrustCopyProps {
  /** Override the default trust statements. */
  lines?: string[];
  className?: string;
}

const DEFAULT_LINES = [
  "Metadata-only mode is enabled. Document contents are not stored.",
  "Risk scores are deterministic and evidence-backed.",
];

/** Reusable trust statements shown across the app. */
export function TrustCopy({ lines = DEFAULT_LINES, className }: TrustCopyProps) {
  return (
    <div
      className={`rounded-md border border-surface-border bg-surface-subtle px-3 py-2 text-xs text-ink-soft ${
        className ?? ""
      }`}
    >
      {lines.map((line) => (
        <p key={line} className="flex items-start gap-1.5">
          <span aria-hidden className="mt-0.5 text-ink-faint">
            ●
          </span>
          <span>{line}</span>
        </p>
      ))}
    </div>
  );
}
