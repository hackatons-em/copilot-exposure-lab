# Microsoft Graph Integration

## Goal
Collect minimum metadata needed to reason about Microsoft 365 exposure paths.

## MVP targets
- Users.
- Groups.
- Sites.
- Drives.
- Drive items.
- Permissions.
- Sharing links.
- Optional labels/agent metadata if available.

## Provider abstraction
Implement:
- `listUsers()`
- `listGroups()`
- `listGroupMembers(groupId)`
- `listSites(scope)`
- `listDrives(siteId)`
- `listDriveItems(driveId)`
- `listItemPermissions(driveId, itemId)`
- `getChanges(scope)` later

## Modes
- Demo mode: seeded data only.
- Sandbox mode: M365 dev tenant.
- Customer assessment: scope-limited metadata.
- Customer-cloud: scanner runs in customer's Azure.

## Requirements
- Least privilege.
- Selected scopes when possible.
- Retry-After handling.
- Exponential backoff.
- Checkpoint scans.
- No full content by default.
- Show permission explanation in UI.
