# End-to-end tests (Playwright)

The web app ships a small Playwright suite (`apps/web/e2e`) that walks the demo
flow end to end: landing → overview findings → critical finding evidence chain →
report generation.

## Running locally

The suite is self-contained. `playwright.config.ts` boots **both** servers via
`webServer`, so you don't start anything by hand:

- API: `pnpm --filter @cel/api start` on port 4000 (in-memory store — it
  auto-seeds and scans a ready `ws-demo` workspace on boot, no database needed).
- Web: `pnpm --filter @cel/web dev -- -p 3100` with
  `NEXT_PUBLIC_API_URL=http://localhost:4000` and `NEXT_PUBLIC_WORKSPACE_ID=ws-demo`.

First time only, install the browser:

```bash
pnpm --filter @cel/web test:e2e:install
```

Then run the suite:

```bash
pnpm --filter @cel/web test:e2e
```

Locally `reuseExistingServer` is on, so if you already have the api/web running
on those ports Playwright reuses them.

## Notes

- These tests are **not** part of `pnpm -r test` — that gate stays browserless
  and fast. E2E runs only via `test:e2e` (and the dedicated `e2e.yml` CI job).
- `e2e/**` and `playwright.config.ts` are outside the web `tsconfig` include and
  are excluded from eslint, so they never affect `typecheck`/`lint`/`build`.
