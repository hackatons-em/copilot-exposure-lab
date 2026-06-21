/**
 * Shared Tailwind preset — Exposure Lab's bespoke, instrument-grade light theme.
 *
 * Design language: warm off-white canvas, white cards, hairline 1px borders,
 * a confident deep iris/violet accent (NOT generic startup blue), refined
 * severity bands with soft tints, and a layered type system:
 *   - display (Space Grotesk)  → headings, wordmark, big numbers
 *   - sans    (Inter)          → body / UI
 *   - mono    (JetBrains Mono) → ids, scores, paths (tabular)
 *
 * Tokens are semantic so components reference intent (bg-canvas, bg-surface,
 * border-hairline, text-ink, text-brand, …). Legacy names (surface.border, the
 * `surface`/`ink`/`brand` scales) are preserved as the same keys so existing
 * class usages stay valid while their *values* are refined.
 *
 * See docs/spec/06_DESIGN/05_VISUAL_STYLE.md.
 *
 * @type {import('tailwindcss').Config}
 */
const preset = {
  content: [],
  theme: {
    extend: {
      colors: {
        // Page canvas — warm off-white "paper". Use behind the app shell.
        canvas: "#fbfbf9",

        // Surfaces — white cards on the warm canvas, with quiet neutrals.
        surface: {
          DEFAULT: "#ffffff",
          subtle: "#f4f4f1",
          muted: "#ecebe6",
          // `border` kept as a key so existing `border-surface-border` usages
          // keep working; it now resolves to the refined hairline value.
          border: "#e6e5df",
        },
        // Explicit hairline alias — the preferred name for new code.
        hairline: "#e6e5df",

        // Ink — near-black headline, soft body, faint meta.
        ink: {
          DEFAULT: "#16161a",
          soft: "#56565f",
          faint: "#9795a0",
        },

        // Brand — a confident deep iris/violet. Distinct, enterprise, calm.
        brand: {
          DEFAULT: "#4733b8",
          strong: "#3a2a99",
          soft: "#eceafb",
          ring: "#4733b8",
        },

        // Severity bands — refined, used assertively only for risk. Each has a
        // soft tint for badge/callout backgrounds.
        severity: {
          critical: "#c0362c",
          "critical-soft": "#fbedeb",
          high: "#c4570a",
          "high-soft": "#fbeee2",
          medium: "#b07a12",
          "medium-soft": "#faf2dd",
          low: "#2f6f4f",
          "low-soft": "#e8f3ec",
          info: "#56565f",
          "info-soft": "#f0f0ee",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        display: ["var(--font-display)", "var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: [
          "var(--font-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "14px",
      },
      boxShadow: {
        // Soft, layered elevation — a low ambient + a longer cast shadow.
        elevation: "0 1px 2px rgba(16,16,26,0.04), 0 4px 16px -8px rgba(16,16,26,0.10)",
        "elevation-lg": "0 2px 4px rgba(16,16,26,0.05), 0 12px 32px -12px rgba(16,16,26,0.16)",
      },
      letterSpacing: {
        tightest: "-0.02em",
      },
    },
  },
  plugins: [],
};

export default preset;
