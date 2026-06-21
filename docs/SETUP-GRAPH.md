# Setup: live Microsoft Graph connector

The demo runs entirely on the bundled Acme seed — **no Microsoft access needed**.
This runbook is for connecting a **real (sandbox) Microsoft 365 tenant** via the
`MsGraphClient`. It requires an interactive admin login that the tooling can't do
for you.

> Principle: **least privilege, read-only, metadata only.** No write scopes. No
> document-content access. Every scope below is explained to the customer in the UI.

## 1. Get a sandbox tenant (recommended)

Join the Microsoft 365 Developer Program and provision an E5 sandbox with sample
data — see https://learn.microsoft.com/en-us/office/developer-program/microsoft-365-developer-program .
Do **not** point this at a production tenant during validation.

## 2. Register an Entra application

In the sandbox tenant → **Microsoft Entra ID → App registrations → New registration**:

- Name: `Copilot Exposure Lab (scanner)`
- Supported account types: single tenant
- No redirect URI (app-only / client-credentials flow)

Record the **Application (client) ID** and **Directory (tenant) ID**.

## 3. Grant least-privilege application permissions

**API permissions → Add → Microsoft Graph → Application permissions** — add only:

| Scope | Why |
|---|---|
| `User.Read.All` | enumerate users (metadata) |
| `Group.Read.All` | groups + membership (broad-access analysis) |
| `Sites.Read.All` | SharePoint sites |
| `Files.Read.All` | drive items + permissions (metadata only) |

Then click **Grant admin consent**. (Do not add write scopes or `Mail.*`.)

## 4. Create a client secret

**Certificates & secrets → New client secret.** Copy the **value** immediately.

## 5. Run a scan against the tenant

Provide the three values as environment variables, then use the client:

```bash
export CEL_GRAPH_TENANT_ID=<tenant-id>
export CEL_GRAPH_CLIENT_ID=<client-id>
export CEL_GRAPH_CLIENT_SECRET=<secret-value>
```

```ts
import { MsGraphClient, createGraphRequester } from "@cel/graph-client";
import { scan } from "@cel/rule-engine";

const requester = createGraphRequester({
  tenantId: process.env.CEL_GRAPH_TENANT_ID!,
  clientId: process.env.CEL_GRAPH_CLIENT_ID!,
  clientSecret: process.env.CEL_GRAPH_CLIENT_SECRET!,
});
const client = new MsGraphClient(requester, {
  workspace: { id: "ws-sandbox", name: "Sandbox tenant" },
  tenantName: "contoso.onmicrosoft.com",
  onCheckpoint: (cp) => console.log("phase", cp.phase, cp.collected),
});

const graph = await client.loadTenantGraph(); // metadata only, throttled, checkpointed
const result = scan(graph, { now: new Date().toISOString() });
console.log(result.findings.map((f) => `${f.risk.total} ${f.risk.band} ${f.ruleId}`));
```

The same `scan()` pipeline that powers the demo runs over the live graph — the
findings, evidence chains, scoring, and report are identical in shape.

> The API's `connections/microsoft/start` wiring and Key Vault-backed secret
> storage are V1 work; for the sandbox spike the script above is enough.
