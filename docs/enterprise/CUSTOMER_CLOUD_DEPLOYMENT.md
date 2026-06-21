# Customer-Cloud Deployment

*Run Copilot Exposure Lab entirely inside your own Azure subscription, so your Microsoft 365 metadata never leaves your tenant.*

## Why this exists

Some security teams — especially in regulated industries — will not let an early-stage vendor store Microsoft 365 metadata, even metadata-only. Customer-cloud deployment removes that friction: the scanner, API, and worker all run **inside your Azure subscription**, the data they collect stays in **your** Postgres and **your** Blob storage, and secrets live in **your** Key Vault. The vendor is out of the data path.

The analysis is identical to SaaS — the same deterministic `scan()` engine, the same evidence chains, scoring, and report shape. Only the location of the data and infrastructure changes.

## What runs in your subscription

The deployment provisions a cost-first stack via the same Bicep IaC the product uses for its own demo ([`infra/azure/main.bicep`](../../infra/azure/main.bicep)), deployed by [`infra/azure/deploy.ps1`](../../infra/azure/deploy.ps1) **run from your own `az login`**:

| Component | Azure service | You control |
|---|---|---|
| Compute (api / worker / web) | Azure Container Apps (consumption; **no Kubernetes**) | Scale, region, ingress |
| Database | Azure Database for PostgreSQL Flexible Server (Burstable B1ms) | All metadata, findings, audit |
| Report artifacts | Azure Blob Storage (StorageV2; public access off) | All generated reports |
| Secrets | Azure Key Vault (RBAC; soft-delete on) | Graph credentials, DB connection string |
| Retrieval simulation | Azure AI Search (free tier) | — |
| Telemetry | Application Insights + Log Analytics (30-day retention) | Your logs |
| Cost guard | Budget + alerts at 10/25/50/80% of a $1000 monthly budget | Threshold + alert email |

The container registry, database, Key Vault, and storage account are all created **in your resource group, under your subscription** — so the data, the credentials, and the audit trail are all governed by your existing Azure RBAC and policies.

## Trust benefit

- **Data residency:** Microsoft 365 metadata, the permission graph, findings, and reports never leave your tenant or legal boundary.
- **Credential control:** the Graph client secret lives in *your* Key Vault. It is still used transiently and never logged, returned, or persisted by the application.
- **Auditability:** the append-only audit log and the Azure-level activity log are both in your subscription.
- **Clean teardown:** deleting the resource group removes everything in one step.

## Trade-offs vs SaaS

| | SaaS (metadata-only) | Customer-cloud |
|---|---|---|
| Time to first scan | Fastest — we run it | Slower — you provision + deploy |
| Who operates it | Vendor | Your team (with our setup support) |
| Where data lives | Vendor Azure (metadata only) | Your Azure |
| Upgrades | Automatic | You redeploy a new image |
| Azure cost | Borne by vendor | Borne by you (cost-first; ~cheapest viable tiers) |
| Best for | Fast pilots | Regulated buyers / strict data-residency |

## Deploy steps (mirrors `SETUP-AZURE`)

Prerequisites: Azure CLI (`az`) with the Bicep extension, an Azure subscription, and PowerShell 7+ (`pwsh`). Full runbook: [`../SETUP-AZURE.md`](../SETUP-AZURE.md).

```powershell
az login
az account set --subscription "<your-subscription>"

# from the repo root, run in YOUR subscription:
pwsh ./infra/azure/deploy.ps1 -PgAdminPassword (Read-Host -AsSecureString)
```

The script:

1. Creates the resource group (e.g. `rg-cel-dev-swc`, Sweden Central by default; pass `-Location <region>` if your subscription is refused in a region).
2. Deploys `infra/azure/main.bicep` — ACR, PostgreSQL Flexible B1ms, Blob, Key Vault, free Azure AI Search, App Insights, and the Container Apps environment with api/worker/web.
3. Cloud-builds the images with `az acr build` directly from the public GitHub repo (no local Docker), baking the resolved API URL into the web image.
4. Redeploys the apps with the built images. The **api self-migrates** the database on boot and prints the **Web** and **API** URLs.

### Connect your Microsoft 365 tenant

Register a least-privilege, read-only Entra application and grant admin consent following [`../SETUP-GRAPH.md`](../SETUP-GRAPH.md). The four scopes — `User.Read.All`, `Group.Read.All`, `Sites.Read.All`, `Files.Read.All` — are read-only and metadata-only. Then connect the tenant through the API (`POST /api/workspaces/:id/connections/microsoft/start`); the secret is used transiently and never persisted.

### Verify

Open the printed **Web** URL → run the exposure assessment → open the critical salary finding → review its evidence chain → **Apply fix & re-verify** → generate and download the CISO report.

## Cost controls

The stack uses the cheapest viable tiers (Burstable Postgres, free AI Search, Basic ACR, consumption Container Apps, 30-day log retention) and ships with a **$1000 monthly budget** and email alerts at **$100 / $250 / $500 / $800**. Between scans you can scale `worker`/`api` `minReplicas` to 0 to reduce spend further. **No Kubernetes.**

## Tear down (stop all spend)

```powershell
az group delete --name <your-resource-group> --yes --no-wait
```

This removes the database, Key Vault, storage, and all collected metadata in a single operation.

---

*This deployment is currently a **single-region demo/dev profile**. A productized customer-cloud package — pinned Docker image, parameterized Bicep, env docs, app-registration guide, deployment checklist, and uninstall script — is on the roadmap.*
