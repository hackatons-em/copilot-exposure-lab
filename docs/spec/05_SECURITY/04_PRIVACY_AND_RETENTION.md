# Privacy and Retention

## Default retention
| Data | Default |
|---|---:|
| Tenant metadata | until disconnect/delete |
| Graph secrets | until disconnect |
| File metadata | 30-90 days in pilot |
| Permission metadata | 30-90 days in pilot |
| Findings | 90 days |
| Reports | 90 days |
| Audit logs | 180 days |
| Full content | not stored by default |

## Deletion
Must support:
- Delete workspace.
- Disconnect tenant.
- Delete report.
- Delete scan run.
- Export before deletion.

## Privacy promise
"The assessment starts metadata-only. We do not need full document bodies to find many high-risk exposure paths."
