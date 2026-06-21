# Permissions Model

## Product RBAC
| Role | Connect | Scan | View findings | Export | Manage users | Delete |
|---|---:|---:|---:|---:|---:|---:|
| Owner | yes | yes | yes | yes | yes | yes |
| Admin | yes | yes | yes | yes | no | no |
| Analyst | no | yes | yes | yes | no | no |
| Viewer | no | no | yes | no | no | no |

## Microsoft permissions strategy
- Start selected/scope-limited.
- Prefer read-only.
- Explain every scope.
- No write permissions in MVP.
- No full content unless explicitly enabled.

## Exposure path model
A finding must answer:
- Who can access it?
- Why can they access it?
- Is access direct, inherited, link-based, group-based, guest, external?
- Is access too broad?
- What is the fix?

## Example
Bob -> Everyone Except External Users -> organization-wide link -> HR salary file -> critical exposure.
