# Copilot Exposure Lab

A Microsoft-native security product that safely tests whether **Microsoft 365 Copilot**, **Copilot Studio agents**, and existing **SharePoint / OneDrive permissions** could expose sensitive company data — then gives security teams exact evidence and remediation steps before rollout.

> Run a Copilot exposure drill **before** rollout. See the evidence, fix what matters first, prove the fix.

## What it does

1. Builds a permission + resource graph from Microsoft 365 metadata (or a seeded demo tenant).
2. Runs realistic **exposure scenarios** (normal employee, contractor/guest, broad sharing, sensitive file, risky agent).
3. Produces **evidence-backed findings** — every finding traces a source object (file, site, user, group, permission, link, agent).
4. Scores risk with a **deterministic 0–100 model** (LLMs never decide severity).
5. Maps each finding to **Microsoft-native remediation**, then reruns to prove the exposure is fixed.
6. Exports a CISO-ready **report** (Markdown / HTML).

## Non-negotiables

- Every finding has **evidence with a source-object id**. Every finding has **remediation**.
- Risk scoring is **deterministic**. LLMs may summarize, never invent severity or facts.
- **Metadata-only** by default — no document-content storage.
- **Least-privilege** Microsoft Graph scopes. No Kubernetes. Keep cloud credits alive.

See [`docs/`](./docs) for the full build manual and [`CLAUDE.md`](./CLAUDE.md) for the binding constraints.

## Monorepo layout

```
apps/
  web/       Next.js dashboard
  api/       Fastify REST API
  worker/    scan / scenario / report / cleanup jobs
packages/
  types/         shared domain contracts
  rule-engine/   deterministic risk logic (the core IP)
  graph-client/  Microsoft Graph + demo provider
  db/            Postgres schema + Drizzle migrations
  ui/            shared enterprise components
  config/        eslint / tsconfig / tailwind presets
infra/
  azure/     Bicep IaC (Container Apps, Postgres, Blob, Key Vault, AI Search)
  docker/    Dockerfiles + docker-compose local stack
seed/
  demo-company/  Acme Health Finance Ltd demo dataset
docs/        full spec / build manual
```

## Quick start (local)

```bash
pnpm install
pnpm seed:demo     # load the Acme demo company
pnpm demo:run      # run scenarios, generate findings + report
pnpm dev           # web + api + worker
```

## Status

Validation-first build, in active development. Built increment-by-increment — see commit history.
