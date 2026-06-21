/**
 * Bespoke, thin-stroke icon set — crisp 1.5px line glyphs on a 24-grid, drawn in
 * `currentColor`. These replace every emoji in the product (a major AI-slop tell):
 * exposure-graph node types, the exposure-path arrow, and inline alert/check marks.
 * Apple/Linear-grade: monochrome, consistent weight, scalable, colourable.
 */
import type { SVGProps } from "react";

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "width" | "height"> {
  size?: number;
}

function base({ size = 16, ...props }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...props,
  };
}

export function UserIcon(p: IconProps) {
  return (
    <svg {...base(p)} aria-hidden>
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5.5 19a6.5 6.5 0 0 1 13 0" />
    </svg>
  );
}

export function GroupIcon(p: IconProps) {
  return (
    <svg {...base(p)} aria-hidden>
      <circle cx="9" cy="8.5" r="2.75" />
      <path d="M3.5 18.5a5.5 5.5 0 0 1 11 0" />
      <path d="M15.5 6.2a2.75 2.75 0 0 1 0 5.3" />
      <path d="M16.8 13.2a5.5 5.5 0 0 1 3.7 5.3" />
    </svg>
  );
}

export function LinkIcon(p: IconProps) {
  return (
    <svg {...base(p)} aria-hidden>
      <path d="M10 14a3.5 3.5 0 0 0 5 0l2.5-2.5a3.54 3.54 0 0 0-5-5L16 8" />
      <path d="M14 10a3.5 3.5 0 0 0-5 0L6.5 12.5a3.54 3.54 0 0 0 5 5L8 16" />
    </svg>
  );
}

export function FileIcon(p: IconProps) {
  return (
    <svg {...base(p)} aria-hidden>
      <path d="M13.5 3.5H7a1.5 1.5 0 0 0-1.5 1.5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8.5z" />
      <path d="M13.5 3.5V8.5h5" />
    </svg>
  );
}

export function FolderIcon(p: IconProps) {
  return (
    <svg {...base(p)} aria-hidden>
      <path d="M4 7.5A1.5 1.5 0 0 1 5.5 6h3.4a1.5 1.5 0 0 1 1.06.44L11.5 7.5h7A1.5 1.5 0 0 1 20 9v8.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z" />
    </svg>
  );
}

export function SiteIcon(p: IconProps) {
  return (
    <svg {...base(p)} aria-hidden>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c2.5 2.4 2.5 14.6 0 17M12 3.5c-2.5 2.4-2.5 14.6 0 17" />
    </svg>
  );
}

export function DriveIcon(p: IconProps) {
  return (
    <svg {...base(p)} aria-hidden>
      <rect x="3.5" y="5" width="17" height="6" rx="1.5" />
      <rect x="3.5" y="13" width="17" height="6" rx="1.5" />
      <path d="M7 8h.01M7 16h.01" />
    </svg>
  );
}

export function AgentIcon(p: IconProps) {
  return (
    <svg {...base(p)} aria-hidden>
      <rect x="4.5" y="8" width="15" height="11" rx="3" />
      <path d="M12 8V4.5M12 4.5h.01" />
      <path d="M9.5 13h.01M14.5 13h.01" />
      <path d="M9.5 16h5" />
    </svg>
  );
}

export function ConnectorIcon(p: IconProps) {
  return (
    <svg {...base(p)} aria-hidden>
      <circle cx="6.5" cy="12" r="2.5" />
      <circle cx="17.5" cy="12" r="2.5" />
      <path d="M9 12h6" />
    </svg>
  );
}

export function PermissionIcon(p: IconProps) {
  return (
    <svg {...base(p)} aria-hidden>
      <rect x="5.5" y="10.5" width="13" height="9" rx="1.8" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
      <path d="M12 14v2.5" />
    </svg>
  );
}

export function ActionIcon(p: IconProps) {
  return (
    <svg {...base(p)} aria-hidden>
      <path d="M13 3.5 5 13.5h5l-1 7 8-10h-5z" />
    </svg>
  );
}

export function ArrowRightIcon(p: IconProps) {
  return (
    <svg {...base(p)} aria-hidden>
      <path d="M4.5 12h15M13.5 6l6 6-6 6" />
    </svg>
  );
}

export function AlertIcon(p: IconProps) {
  return (
    <svg {...base(p)} aria-hidden>
      <path d="M12 4.5 21 19.5H3z" />
      <path d="M12 10v4M12 17h.01" />
    </svg>
  );
}

export function CheckIcon(p: IconProps) {
  return (
    <svg {...base(p)} aria-hidden>
      <path d="M4.5 12.5l5 5 10-11" />
    </svg>
  );
}
