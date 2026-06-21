import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config for @cel/web. Self-contained: it boots BOTH the API and the web
 * dev server so `pnpm --filter @cel/web test:e2e` needs no external setup.
 *
 * The API uses the in-memory store (no DATABASE_URL), which auto-seeds and
 * scans a ready `ws-demo` workspace on boot — so the demo flow is testable
 * immediately, with no database.
 *
 * This file is intentionally outside the web `tsconfig` include and is excluded
 * from eslint, so it never affects the fast `typecheck`/`lint`/`build` gate.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "line" : "list",
  use: {
    baseURL: "http://localhost:3100",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "pnpm --filter @cel/api start",
      port: 4000,
      env: {},
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      // Run next directly so the port override is clean. The repo's `dev` script
      // hard-codes `-p 3000`, and `pnpm ... dev -- -p 3100` passes the literal
      // `-- -p 3100` to next (which then treats `-p` as the project dir and
      // fails). `exec next dev -p 3100` avoids that and binds to 3100.
      command: "pnpm --filter @cel/web exec next dev -p 3100",
      url: "http://localhost:3100",
      env: {
        NEXT_PUBLIC_API_URL: "http://localhost:4000",
        NEXT_PUBLIC_WORKSPACE_ID: "ws-demo",
      },
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
});
