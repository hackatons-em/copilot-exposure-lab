# Non-Negotiables

## Startup
- Do not build just because it is interesting.
- Do not pretend this is a confirmed 9/10 until buyers prove urgency and budget.
- Do not build a generic AI security dashboard.
- Do not build a Microsoft admin wrapper.
- Do not build a Purview clone.
- Do not build anything that cannot be demoed in 5 minutes.
- Do not expand scope before validation.

## Product
- Every finding needs evidence.
- Every evidence item needs a source object: file, site, user, group, permission, link, agent, or action.
- Every finding needs remediation.
- Use deterministic logic for risk scoring.
- LLMs may summarize but must not invent severity or facts.
- Start metadata-only.
- Request least privilege.
- Support customer-cloud deployment if trust becomes the blocker.

## Engineering
- No Kubernetes in MVP.
- No broad Microsoft Graph scopes unless justified.
- No permanent full-content storage by default.
- Audit all sensitive actions.
- Build demo-first but not throwaway.
- Keep the $1,000 credits alive: delete idle services, use free/dev tiers, cache model calls.

## Validation
- Talk to customers while building.
- Ask about past behavior, not future interest.
- Ask for money early.
- Kill if buyer says Microsoft already solves it well enough.
- Kill if all feedback is "interesting, keep me updated."
