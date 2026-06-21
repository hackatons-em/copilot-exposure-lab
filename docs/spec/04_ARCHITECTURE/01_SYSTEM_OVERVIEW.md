# System Overview

```text
Microsoft 365 / Demo Dataset
        |
        v
Connector Service
        |
        v
Metadata Store + Permission Graph
        |
        v
Exposure Scenario Engine
        |
        v
Risk Scoring Engine --> Evidence Store
        |                     |
        v                     v
Dashboard UI <------ Report Generator
        |
        v
Remediation Tracker / Exports
```

## Services
- Web app: dashboard, findings, scenarios, reports, settings.
- API: workspace, findings, scenarios, reports, auth.
- Worker: scans, permission graph, scenarios, reports.
- Connector: Graph and demo provider.
- Rule engine: deterministic risk logic.
- Report generator: Markdown/HTML/PDF-ready outputs.

## MVP stack
- Frontend: Next.js + TypeScript.
- Backend: FastAPI or Node/Fastify.
- Database: PostgreSQL.
- Storage: Azure Blob.
- Jobs: simple worker, Azure Functions, or Container Apps job.
- Search demo: Azure AI Search.
- Summaries: Azure OpenAI/Foundry model.
- Secrets: Key Vault.
- Monitoring: App Insights/Azure Monitor.
