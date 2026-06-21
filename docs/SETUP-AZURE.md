# Setup: deploy to Azure

Provisions the demo/dev stack on Azure Container Apps with a cost-first profile.
Requires an interactive `az login` that the tooling can't do for you.

## Prerequisites

- Azure CLI (`az`) installed, and the Bicep extension (`az bicep install`).
- An Azure subscription with the ~$1000 credits.
- `pwsh` (PowerShell 7+).

## Deploy

```powershell
az login
az account set --subscription "<your-subscription>"

# from the repo root:
pwsh ./infra/azure/deploy.ps1 -PgAdminPassword (Read-Host -AsSecureString)
```

The script:

1. Creates resource group `rg-cel-dev-swc` (Sweden Central by default).
2. Deploys `infra/azure/main.bicep` (ACR, Postgres Flexible B1ms, Blob, Key
   Vault, free Azure AI Search, App Insights, Container Apps env + api/worker/web).
3. Cloud-builds the images with `az acr build` **directly from the public GitHub
   repo** (no local Docker, no local context upload — avoids Windows long-path
   errors), baking the resolved API URL into the web image.
4. Redeploys the apps with the built images.

### Notes from a real run

- **Region availability:** credit/free subscriptions are often refused in
  popular regions (`RequestDisallowedByAzure: not accepting new customers`).
  Sweden Central worked; if it doesn't, pass `-Location eastus2` (etc.).
- **No-admin az install:** if you can't install the MSI, `python -m pip install
  --user azure-cli` works (it lands in `%APPDATA%\Python\Python3xx\Scripts`).
- **Resource providers** (Microsoft.App, OperationalInsights, DBforPostgreSQL,
  Search, ...) are auto-registered on a fresh subscription; the first deploy may
  wait a few minutes for that.
- **Windows console + az logs:** set `$env:PYTHONUTF8=1` before deploying so
  `az acr build` log streaming doesn't crash on non-cp1252 build output.

The **api self-migrates** the database and seeds the `ws-demo` workspace on boot
(`RUN_MIGRATIONS=true`), so the dashboard is ready immediately. The script prints
the **Web** and **API** URLs.

## What it costs / cost controls

- PostgreSQL Burstable **B1ms**, free **Azure AI Search**, **Basic** ACR,
  consumption Container Apps, 30-day log retention — the cheapest viable tiers.
- A **$1000 budget** with email alerts at **10/25/50/80%** ($100/$250/$500/$800),
  per `docs/spec/04_ARCHITECTURE/08_COST_CONTROLS.md`.
- No Kubernetes. Scale `worker`/`api` `minReplicas` to 0 between demos to save more.

## Verify the demo

1. Open the printed **Web** URL → `/overview` → **Run exposure assessment**.
2. Confirm **1 critical / 4 high / 4 medium** (9 findings).
3. Open the salary finding → evidence chain → **Apply fix & re-verify**.
4. **Reports → Generate → Download** the CISO report.

## Tear down (stop all spend)

```powershell
az group delete --name rg-cel-dev-euw --yes --no-wait
```
