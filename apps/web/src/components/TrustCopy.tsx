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
      className={`space-y-1.5 rounded-md border border-hairline bg-surface-subtle px-3.5 py-3 text-xs text-ink-soft ${
        className ?? ""
      }`}
    >
      {lines.map((line) => (
        <p key={line} className="flex items-start gap-2">
          <span aria-hidden className="mt-1 h-1 w-1 shrink-0 rounded-full bg-brand" />
          <span className="leading-relaxed">{line}</span>
        </p>
      ))}
    </div>
  );
}
