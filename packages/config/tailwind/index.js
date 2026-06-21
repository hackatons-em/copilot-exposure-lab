/**
 * Shared Tailwind preset — calm, light, enterprise-security aesthetic.
 * Severity is the only place color is used assertively (the band badges).
 * See docs/spec/06_DESIGN/05_VISUAL_STYLE.md.
 *
 * @type {import('tailwindcss').Config}
 */
const preset = {
  content: [],
  theme: {
    extend: {
      colors: {
        // Neutral surfaces — clean white / light neutral base.
        surface: {
          DEFAULT: "#ffffff",
          subtle: "#f7f8fa",
          muted: "#eef1f5",
          border: "#e2e6ec",
        },
        ink: {
          DEFAULT: "#1a1f29",
          soft: "#4a5160",
          faint: "#8a93a3",
        },
        brand: {
          DEFAULT: "#2563eb",
          soft: "#dbe7ff",
        },
        // Severity band tokens — used sparingly, only for risk.
        severity: {
          critical: "#b42318",
          high: "#c4570a",
          medium: "#b7791f",
          low: "#2f6f4f",
          info: "#4a5160",
        },
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};

export default preset;
