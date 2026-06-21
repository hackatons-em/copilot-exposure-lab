# Azure Reference Architecture

## MVP services
| Need | Service |
|---|---|
| API/web hosting | Azure Container Apps, App Service, or Static Web Apps + API |
| Jobs | Azure Functions or Container Apps jobs |
| DB | Azure Database for PostgreSQL |
| Storage | Azure Blob Storage |
| Search simulation | Azure AI Search |
| LLM summary | Azure OpenAI / Foundry Models |
| Secrets | Azure Key Vault |
| Monitoring | Azure Monitor / App Insights |
| Identity | Microsoft Entra ID |

## Environments
- Local: Docker Compose, local Postgres, demo data.
- Demo cloud: small Azure resource group.
- Sandbox tenant: fake M365 data.
- Customer pilot: metadata-only or customer-cloud.

## Cost rules
- Use free/dev tiers.
- Delete idle search resources.
- Cache LLM summaries.
- Short log retention.
- Avoid Kubernetes.
- Budget alerts at $100, $250, $500, $800.

## Resource names
- `rg-cel-dev-euw`
- `app-cel-api-dev`
- `app-cel-web-dev`
- `pg-cel-dev`
- `stceldev`
- `kv-cel-dev`
- `srch-cel-dev`
- `appi-cel-dev`
