# CLAUDE.md — Copilot Exposure Lab

Binding guidance for any coding agent working in this repo. These rules **override** convenience, speed, and cleverness. The full build manual is in [`docs/spec/`](./docs/spec) — read it before changing behavior.

## What this product is

A Microsoft-native security product. It safely tests whether **M365 Copilot**, **Copilot Studio agents**, and existing **SharePoint/OneDrive permissions** could expose sensitive company data, then produces evidence-backed findings + deterministic risk scores + Microsoft-native remediation, and reruns to prove the fix. It is **not** a chatbot, a Purview/Defender replacement, or a generic AI dashboard.

## Non-negotiables (do not violate)

1. **Every finding has evidence.** Every `EvidenceItem` carries a `sourceObjectId` (file / site / user / group / permission / link / agent / action). No evidence → no finding. Enforced by a runtime invariant in `scan()` and by the type system.
2. **Every finding has remediation.** No critical/high finding ships without a `RemediationTask`.
3. **Risk scoring is deterministic, 0–100.** The scorer alone sets severity. **LLMs may summarize but must never decide severity or invent facts.** `packages/rule-engine` imports no AI SDK (enforced by eslint `no-restricted-imports`).
4. **Metadata-only by default.** Never store full document content, email bodies, Teams messages, or credentials. The Graph connector requests metadata only.
5. **Least privilege.** Microsoft Graph scopes are read-only, scope-limited, and each is explained in the UI. No write scopes in MVP/V1.
6. **Keep cloud credits alive.** Free/dev tiers, scale-to-zero, short log retention, delete idle resources, budget alerts at $100/$250/$500/$800. **No Kubernetes.**
7. **Determinism everywhere it matters.** Stable finding fingerprints, injected `now`, sorted collections. Same seed → same findings, scores, and report bytes. Golden snapshot tests guard this.
8. **Audit sensitive actions.** Every API write emits an `AuditEvent`. Secrets are never logged or returned.

## Architecture

```
web (Next.js) -> api (Fastify, REST) -> Postgres (Drizzle) + jobs queue + Blob
worker (Node) polls jobs: scan -> graph ingest -> permission graph -> rule-engine -> findings/evidence
                          scenario-run | report-gen (deterministic MD/HTML) | cleanup (retention)
packages: types | rule-engine (core IP) | graph-client (SeedGraphClient + MsGraphClient) | db | ui | config
```

## Risk scoring model (deterministic)

Total 0–100 = Sensitivity 25 + Exposure breadth 20 + External reach 15 + Agent/action 15 + Governance gap 10 + Business criticality 10 + Confidence 5.
Bands: **≥90 Critical · 70–89 High · 40–69 Medium · 10–39 Low · <10 Info.**
Full model: [`docs/spec/02_PRODUCT/07_RISK_SCORING_MODEL.md`](./docs/spec/02_PRODUCT/07_RISK_SCORING_MODEL.md).

## Conventions

- **Language:** TypeScript everywhere. ESM. Node ≥ 20.
- **Package manager:** pnpm workspaces (`pnpm@9.15.9`). Package names are `@cel/*`.
- **Green gate before every push:** `pnpm install && pnpm -r typecheck && pnpm -r lint && pnpm -r test && pnpm --filter @cel/web build`. Never push red.
- **Commits:** Conventional Commits. Build increment-by-increment; each commit leaves the repo green. End every commit with:
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
- **Tests:** Vitest. Rule-engine logic (classifier, breadth, link, guest/external, agent rules, scoring) needs unit tests; the demo seed has a golden snapshot.

## Repo / deploy facts

- GitHub: `hackatons-em/copilot-exposure-lab` (public).
- Deploy target: **Azure** (Container Apps + Postgres Flexible + Blob + Key Vault + AI Search + App Insights). IaC in `infra/azure` (Bicep).
- Two steps need interactive human login: Entra app registration (`docs/SETUP-GRAPH.md`) and `az login` deploy (`docs/SETUP-AZURE.md`).

## Where things live

- Core IP: `packages/rule-engine/src` (classifier, graph, rules, scoring, scenarios).
- Contracts: `packages/types/src`.
- Demo data (the 7 intentional issues): `seed/demo-company/*.json` — see [`docs/spec/08_DEMO/02_DEMO_DATASET.md`](./docs/spec/08_DEMO/02_DEMO_DATASET.md).
- Data model: [`docs/spec/04_ARCHITECTURE/04_DATA_MODEL.md`](./docs/spec/04_ARCHITECTURE/04_DATA_MODEL.md). API spec: [`docs/spec/04_ARCHITECTURE/05_API_SPEC.md`](./docs/spec/04_ARCHITECTURE/05_API_SPEC.md).
