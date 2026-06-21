# Security Model

## Principles
- Least privilege.
- Metadata-first.
- No full content storage by default.
- Customer-approved scope.
- Audit all sensitive actions.
- Deterministic risk decisions.
- Customer-cloud option.

## Auth
MVP can use simple auth. V1 should support Entra ID SSO.

## Roles
- Owner.
- Admin.
- Analyst.
- Viewer.

## Secrets
- Store in Key Vault.
- Never log.
- Rotate on disconnect.
- Never export in reports.

## Stored by default
- Metadata.
- Permission grants.
- Findings.
- Evidence references.
- Reports.
- Audit events.

## Not stored by default
- Full documents.
- Email bodies.
- Teams messages.
- Credentials.

## Before customer pilot
- Threat model reviewed.
- Graph scopes documented.
- Deletion tested.
- Audit logs working.
- Secrets secured.
- No broad write permissions.
