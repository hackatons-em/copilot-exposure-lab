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
      transitionTimingFunction: {
        // The expressive ease used by the guided demo — reuse for premium motion.
        spring: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        // Gentle vertical drift for the hero halo / floating accents.
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        // Continuous left scroll for the integration/credibility marquee. The
        // track duplicates its content, so -50% loops seamlessly.
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        // Sweeping highlight — used on "live"/processing affordances.
        shimmer: {
          "0%": { backgroundPosition: "-150% 0" },
          "100%": { backgroundPosition: "250% 0" },
        },
        // Left-anchored fill for the product-tour auto-advance progress sliver.
        progress: {
          from: { transform: "scaleX(0)" },
          to: { transform: "scaleX(1)" },
        },
        // Soft entrance for cross-faded panels.
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        marquee: "marquee 32s linear infinite",
        shimmer: "shimmer 2.4s linear infinite",
        progress: "progress 6000ms linear forwards",
        "fade-in": "fade-in 420ms cubic-bezier(0.16,1,0.3,1) both",
      },
    },
  },
  plugins: [],
};

export default preset;
