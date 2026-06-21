import config from "@cel/config/eslint";

export default [...config, { ignores: [".next/**", "e2e/**", "playwright.config.ts", "playwright-report/**", "test-results/**"] }];
