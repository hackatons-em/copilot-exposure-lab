# Deployment Environments

## Local
- Docker Compose.
- Web, API, worker, Postgres.
- Seeded demo dataset.
- Mock Graph provider.

## Demo cloud
- Small Azure deployment.
- No real customer data.
- Resettable demo workspace.
- Budget alerts.

## Sandbox tenant
- Microsoft 365 developer sandbox if available.
- Fake files/users/groups.
- App registration.
- Graph integration testing.

## Customer pilot SaaS
- Scope-limited read-only metadata.
- Customer-approved consent.
- Fast setup.

## Customer-cloud
- Scanner/API deployed in customer's Azure.
- Customer controls data and secrets.
- Best for high-trust pilots.

## Enterprise later
- SSO.
- RBAC.
- Tenant isolation.
- Audit logs.
- Retention controls.
- SOC 2 readiness.
