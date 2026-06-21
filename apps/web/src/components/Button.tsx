"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  busy?: boolean;
  children: ReactNode;
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary:
    "bg-brand text-white shadow-elevation hover:bg-brand-strong active:translate-y-px disabled:bg-brand/45 disabled:shadow-none",
  secondary:
    "border border-hairline bg-surface text-ink shadow-sm hover:bg-surface-subtle hover:border-ink-faint/40 disabled:text-ink-faint disabled:shadow-none",
  ghost: "text-ink-soft hover:bg-surface-muted hover:text-ink",
};

export function Button({ variant = "primary", busy, disabled, children, className, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || busy}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:cursor-not-allowed ${
        VARIANT_CLASS[variant]
      } ${className ?? ""}`}
      {...rest}
    >
      {busy ? (
        <span
          aria-hidden
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70"
        />
      ) : null}
      {children}
    </button>
  );
}
