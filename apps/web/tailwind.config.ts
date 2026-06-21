import type { Config } from "tailwindcss";
import preset from "@cel/config/tailwind";

const config: Config = {
  presets: [preset as Partial<Config>],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
