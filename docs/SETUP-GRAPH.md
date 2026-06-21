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

## 6. Or connect through the API

The API exposes the connector directly. Create a workspace, then start a
Microsoft connection — the metadata is ingested immediately and a scan can run:

```bash
WS=ws-acme-pilot
curl -X POST http://localhost:4000/api/workspaces \
  -H 'content-type: application/json' -d "{\"id\":\"$WS\",\"name\":\"Acme pilot\"}"

curl -X POST http://localhost:4000/api/workspaces/$WS/connections/microsoft/start \
  -H 'content-type: application/json' \
  -d "{\"tenantId\":\"$CEL_GRAPH_TENANT_ID\",\"clientId\":\"$CEL_GRAPH_CLIENT_ID\",\"clientSecret\":\"$CEL_GRAPH_CLIENT_SECRET\",\"tenantName\":\"contoso.onmicrosoft.com\"}"

curl -X POST http://localhost:4000/api/workspaces/$WS/scans -d '{}' -H 'content-type: application/json'
curl http://localhost:4000/api/workspaces/$WS/findings
```

The `clientSecret` is used transiently to acquire a token and is **never logged,
returned, or persisted** (the audit log records only the tenant name + mode).
Key Vault-backed secret storage and scheduled re-scans remain V1 work.

## 7. Change notifications (live)

The product can re-scan automatically when a tenant changes, using
[Microsoft Graph change notifications](https://learn.microsoft.com/en-us/graph/change-notifications-overview).

- The deployed API exposes a **single** notification URL: `POST /api/webhooks/graph`
  (not workspace-scoped — Graph calls one URL and we route by `clientState`).
- Ask the API how to subscribe a workspace:
  `GET /api/workspaces/<workspaceId>/notifications/subscribe-info` returns the
  `notificationUrl`, the `clientState` to use (= the workspace id), and the
  recommended `resource` string.
- Create a Graph subscription pointing `notificationUrl` at that route, with
  `clientState=<workspaceId>`. Use the `MsGraphClient.createSubscription` helper,
  or `az`/Graph Explorer:

  ```ts
  const sub = await client.createSubscription({
    resource: "/drives/<drive-id>/root",
    notificationUrl: "https://<your-app>/api/webhooks/graph",
    clientState: "<workspaceId>",
    expirationMinutes: 60,
  });
  ```

- On creation Graph performs a **validation handshake**: it calls the
  notificationUrl with a `validationToken` query param, and the route echoes it
  back as `text/plain` within 10s (already implemented).
- When tenant data changes, Graph POSTs a notification batch. For each entry whose
  `clientState` maps to a known workspace, the API triggers a re-scan and records a
  `notification.received` audit event. Unknown/malformed payloads are accepted
  (202) and skipped — Graph retries aggressively, so the route never returns 5xx.
- **Subscriptions expire** (drive resources allow a short max lifetime) and must be
  **renewed** before `expirationDateTime` by PATCHing the subscription with a new
  expiration. A production deployment would re-ingest only the changed items via
  `MsGraphClient.getChanges(deltaLink)` before re-scanning.
