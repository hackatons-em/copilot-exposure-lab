# Background Jobs

## Scan job
Fetch users, groups, sites, drives, files, permissions. Store checkpoints. Respect Graph throttling.

## Permission graph job
Resolve group membership, direct permissions, inherited permissions, links, guests, and broad access.

## Scenario run job
Load scenario config, execute deterministic rules, create findings and evidence.

## Report generation job
Load findings/evidence/remediation, generate Markdown/HTML/PDF-ready report, store artifact.

## Cleanup job
Apply retention policy and delete old reports/temp data.

## MVP queue
Use Postgres queue table or Azure Storage Queue. One worker is enough.

## Failure handling
- queued/running/completed/failed/canceled status.
- checkpoint resume.
- safe error messages.
- no corrupt partial states.
