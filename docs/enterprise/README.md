# Enterprise

Deliverable documents for a prospect's security, procurement, and IT teams. Each reflects the product **as built** — read-only, metadata-only, deterministic scoring, workspace-isolated, Azure-hosted — and is explicit about what's roadmap (RBAC/SSO, SOC 2, productized customer-cloud package).

| Doc | Use it for |
|---|---|
| [`SECURITY_PACKET.md`](./SECURITY_PACKET.md) | The security/procurement review before a pilot: deployment models, exact data handling, Graph permissions, secrets, audit logging, retention/deletion, threat model, hosting, compliance posture, contact. |
| [`CUSTOMER_CLOUD_DEPLOYMENT.md`](./CUSTOMER_CLOUD_DEPLOYMENT.md) | Running the scanner + API + worker entirely inside the customer's own Azure subscription so data never leaves their tenant. |
| [`SUPPORT_AND_SLA.md`](./SUPPORT_AND_SLA.md) | Proposed support model + severity/response targets for paid pilots. |

Related: [`../SETUP-GRAPH.md`](../SETUP-GRAPH.md) (Entra app + least-privilege consent), [`../SETUP-AZURE.md`](../SETUP-AZURE.md) (Azure provisioning/deploy), [`../spec/11_ENTERPRISE`](../spec/11_ENTERPRISE) (source spec), [`../spec/05_SECURITY`](../spec/05_SECURITY) (security spec).
