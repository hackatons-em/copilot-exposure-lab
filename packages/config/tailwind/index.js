/**
 * Shared Tailwind preset — Exposure Lab's Apple-grade light theme.
 *
 * Design language: pristine white canvas, calm Apple greys, soft diffuse shadows,
 * an Apple-blue accent used sparingly (<5% of any surface), severity colour
 * reserved strictly for risk, and a system-native type system:
 *   - display / sans (SF Pro / -apple-system, Inter fallback) → everything
 *   - mono           (JetBrains Mono)                          → ids, scores, paths
 *
 * Tokens are semantic so components reference intent (bg-canvas, bg-surface,
 * border-hairline, text-ink, text-brand, …). The KEYS are stable — only the
 * *values* change — so the whole app re-skins at once.
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
        // Page canvas — pristine white (Apple light).
        canvas: "#ffffff",

        // Surfaces — white cards; subtle = Apple's #f5f5f7 section grey.
        surface: {
          DEFAULT: "#ffffff",
          subtle: "#f5f5f7",
          muted: "#ebebf0",
          // `border` kept as a key so existing `border-surface-border` usages
          // keep working; resolves to the hairline value.
          border: "#e5e5ea",
        },
        // Hairline — soft Apple separator.
        hairline: "#e5e5ea",

        // Ink — Apple near-black headline, soft body, faint meta.
        ink: {
          DEFAULT: "#1d1d1f",
          soft: "#6e6e73",
          faint: "#86868b",
        },

        // Brand — Apple system blue. The single accent; used sparingly.
        brand: {
          DEFAULT: "#0071e3",
          strong: "#0062c4",
          soft: "#f0f6ff",
          ring: "#0071e3",
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
        // System-native first (SF on Apple, Segoe on Windows), Inter loaded as the
        // cross-platform fallback. Display + sans share the family — Apple distinguishes
        // by optical size/weight, not typeface.
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "var(--font-sans)",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        display: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "var(--font-sans)",
          "Segoe UI",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
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
        lg: "16px",
        xl: "20px",
      },
      boxShadow: {
        // Apple-diffuse elevation — soft, large-blur, low opacity.
        elevation: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px -12px rgba(0,0,0,0.10)",
        "elevation-lg": "0 2px 8px rgba(0,0,0,0.05), 0 24px 56px -20px rgba(0,0,0,0.16)",
      },
      letterSpacing: {
        tightest: "-0.022em",
        tighter: "-0.03em",
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
        // Signature hero entrance — lift + settle (scale), Apple-calm.
        rise: {
          from: { opacity: "0", transform: "translateY(14px) scale(0.985)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        marquee: "marquee 32s linear infinite",
        shimmer: "shimmer 2.4s linear infinite",
        progress: "progress 6000ms linear forwards",
        "fade-in": "fade-in 420ms cubic-bezier(0.16,1,0.3,1) both",
        rise: "rise 700ms cubic-bezier(0.16,1,0.3,1) both",
      },
    },
  },
  plugins: [],
};

export default preset;
