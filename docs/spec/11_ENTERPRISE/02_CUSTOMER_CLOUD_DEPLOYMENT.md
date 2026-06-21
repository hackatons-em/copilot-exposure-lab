# Customer-Cloud Deployment

## Why
Some buyers will not let early startup SaaS store M365 metadata. Customer-cloud reduces trust friction.

## Model
Customer Azure subscription:
- Container App/App Service.
- PostgreSQL.
- Blob Storage.
- Key Vault.
- App Insights.
- Optional AI Search/model endpoint.

## Flow
1. Customer approves Entra app.
2. Scanner runs in customer Azure.
3. Metadata stored in customer Azure.
4. Report generated in customer Azure.
5. Customer chooses what to share.

## Package later
- Docker image.
- Terraform/Bicep.
- Env docs.
- App registration guide.
- Deployment checklist.
- Uninstall script.
