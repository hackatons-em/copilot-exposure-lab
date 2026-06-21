# Data Model

## Core entities
- Workspace.
- TenantConnection.
- Principal.
- Resource.
- PermissionGrant.
- Scenario.
- ScenarioRun.
- Finding.
- EvidenceItem.
- RemediationTask.
- Report.
- AuditEvent.

## Important tables

### principals
- id
- workspace_id
- source_id
- type: user/group/external/link
- display_name
- email
- metadata
- synced_at

### resources
- id
- workspace_id
- source_id
- source_type: site/drive/file/folder/agent/connector
- name
- path
- url
- owner_principal_id
- sensitivity_tags
- metadata
- synced_at

### permission_grants
- id
- workspace_id
- resource_id
- principal_id
- role
- permission_type: direct/inherited/link/guest/orgwide
- source_permission_id
- expiration_at
- metadata

### findings
- id
- workspace_id
- scenario_run_id
- title
- severity
- score
- status
- resource_id
- actor_principal_id
- summary
- business_impact
- remediation_summary
- timestamps

### evidence_items
- id
- finding_id
- evidence_type
- source_object_id
- summary
- data
- created_at

## Rules
- Keep source IDs for traceability.
- Do not store full content by default.
- Every finding must be reproducible from evidence.
- Workspace deletion must remove all workspace data.
