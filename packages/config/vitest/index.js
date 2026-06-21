/**
 * Shared Vitest base options. Packages do:
 *   import base from "@cel/config/vitest";
 *   import { defineConfig, mergeConfig } from "vitest/config";
 *   export default mergeConfig(base, defineConfig({ ... }));
 */
export default {
  test: {
    environment: "node",
    include: ["**/*.test.ts", "**/*.spec.ts"],
    passWithNoTests: true,
    reporters: "default",
  },
};
