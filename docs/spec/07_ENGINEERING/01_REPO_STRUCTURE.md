# Repo Structure

```text
copilot-exposure-lab/
  apps/
    web/
    api/
    worker/
  packages/
    types/
    ui/
    config/
    rule-engine/
    graph-client/
  infra/
    azure/
    docker/
  seed/
    demo-company/
  tests/
    fixtures/
  docs/
```

## Apps
- web: Next.js dashboard.
- api: REST API.
- worker: scan/scenario/report jobs.

## Packages
- rule-engine: deterministic risk logic.
- graph-client: Microsoft Graph/demo provider.
- types: shared types.
- ui: shared components.

## Commands
- `pnpm install`
- `pnpm dev`
- `pnpm test`
- `pnpm lint`
- `pnpm seed:demo`
- `pnpm demo:run`
