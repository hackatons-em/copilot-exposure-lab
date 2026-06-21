interface LogoProps {
  /** Render only the mark, without the wordmark. */
  markOnly?: boolean;
  /** Mark size in px (the wordmark scales with it). */
  size?: number;
  className?: string;
}

/**
 * Bespoke brand mark for Exposure Lab.
 *
 * Concept: an exposure/permission radar. Concentric arcs sweep outward from an
 * origin node (the tenant), and a single breach line cuts across to a node that
 * has "broken containment" — the moment a permission path reaches sensitive
 * data. Drawn in the iris brand color, crisp at 24–32px. The wordmark is set in
 * the display face (Space Grotesk) with tight tracking.
 */
export function Logo({ markOnly = false, size = 28, className }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <ExposureMark size={size} />
      {markOnly ? null : (
        <span className="font-display text-[15px] font-semibold leading-none tracking-tightest text-ink">
          Exposure Lab
        </span>
      )}
    </span>
  );
}

function ExposureMark({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label="Exposure Lab"
      className="shrink-0"
    >
      {/* Origin node — the tenant. */}
      <circle cx="9" cy="23" r="3" fill="#4733b8" />
      {/* Concentric exposure arcs sweeping outward from the origin. */}
      <path
        d="M9 14.5A8.5 8.5 0 0 1 17.5 23"
        stroke="#4733b8"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.85"
      />
      <path
        d="M9 8.5A14.5 14.5 0 0 1 23.5 23"
        stroke="#4733b8"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.45"
      />
      {/* Breach line: the path that reaches the exposed node. */}
      <path d="M11.1 20.9 22 10" stroke="#4733b8" strokeWidth="2" strokeLinecap="round" />
      {/* The exposed node — broken containment, hollow + ringed. */}
      <circle cx="23.5" cy="8.5" r="3.5" fill="#fbfbf9" stroke="#4733b8" strokeWidth="2" />
      <circle cx="23.5" cy="8.5" r="1.25" fill="#c0362c" />
    </svg>
  );
}
