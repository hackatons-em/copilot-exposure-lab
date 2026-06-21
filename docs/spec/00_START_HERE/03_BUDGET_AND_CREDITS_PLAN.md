# $1,000 Credits Plan

## Budget principle

The credits are for demo and validation speed, not production scale.

## Suggested allocation

| Area | Budget | Rule |
|---|---:|---|
| Azure AI Search | $100-250 | Use free/dev/basic/serverless options first. Delete idle indexes. |
| Azure OpenAI / Foundry models | $50-150 | Summaries only. Cache outputs. No LLM in rule loops. |
| App hosting | $100-250 | Azure Container Apps/App Service/Functions. Keep tiny. |
| Database and storage | $50-150 | Postgres + Blob. Avoid managed bloat. |
| Monitoring | $25-100 | App Insights/Monitor with short retention. |
| Domain/landing/outbound | $25-100 | Cheap/free tools. |
| Buffer | $300-500 | Keep for customer demos and mistakes. |

## Kill switches
- If Azure spend hits $150 before 10 buyer conversations, freeze build and inspect.
- If spend hits $400 before the demo produces strong buyer reactions, stop new services.
- If spend hits $700 before paid pilot intent, only run demo infrastructure.

## Do not spend on
- Ads.
- Kubernetes.
- Fancy design systems.
- Expensive observability.
- Large-scale indexing.
- Production compliance before validation.
