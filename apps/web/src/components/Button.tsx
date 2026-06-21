"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  busy?: boolean;
  children: ReactNode;
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand/90 disabled:bg-brand/50",
  secondary:
    "border border-surface-border bg-surface text-ink hover:bg-surface-subtle disabled:text-ink-faint",
  ghost: "text-ink-soft hover:bg-surface-muted",
};

export function Button({ variant = "primary", busy, disabled, children, className, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || busy}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed ${
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
