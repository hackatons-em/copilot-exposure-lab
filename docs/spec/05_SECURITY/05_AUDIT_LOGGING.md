# Audit Logging

## Events
- user.login
- workspace.created
- connection.started/completed/failed/disconnected
- scan.started/completed/failed
- scenario.run.started/completed/failed
- finding.created/status.changed
- remediation.created/completed
- report.generated/downloaded/deleted
- workspace.deleted

## Fields
- id
- workspace_id
- actor_user_id
- actor_type
- event_type
- target_type
- target_id
- timestamp
- metadata

## Rules
- Append-only.
- No secrets.
- No full document content.
- Link audit events to findings/reports.
