// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import globals from "globals";

/** Shared ignore globs. */
export const ignores = {
  ignores: [
    "**/dist/**",
    "**/.next/**",
    "**/node_modules/**",
    "**/coverage/**",
    "**/*.config.js",
    "**/*.config.mjs",
    "**/*.config.ts",
  ],
};

/**
 * Override that BANS large-language-model SDK imports.
 *
 * Spread this into the flat config of any package whose code must remain
 * deterministic (above all `@cel/rule-engine`): LLMs may summarize in the
 * report layer but must never decide severity or invent facts. See CLAUDE.md.
 */
export const restrictAiImports = {
  rules: {
    "no-restricted-imports": [
      "error",
      {
        paths: [
          { name: "ai", message: "No LLM SDKs in deterministic code — severity is computed, never generated." },
          { name: "openai", message: "No LLM SDKs in deterministic code." },
          { name: "@anthropic-ai/sdk", message: "No LLM SDKs in deterministic code." },
          { name: "@azure/openai", message: "No LLM SDKs in deterministic code." },
        ],
        patterns: [
          { group: ["@ai-sdk/*"], message: "No LLM SDKs in deterministic code." },
          { group: ["langchain", "langchain/*"], message: "No LLM SDKs in deterministic code." },
        ],
      },
    ],
  },
};

/** Base flat config: JS + TS recommended, Node globals, prettier-compatible. */
export default tseslint.config(
  ignores,
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "no-console": "off",
    },
  },
  prettier,
);
