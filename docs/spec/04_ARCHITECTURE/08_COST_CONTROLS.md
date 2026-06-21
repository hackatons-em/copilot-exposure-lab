# Cost Controls

## Targets
- First 30-day spend under $500 unless paid pilot exists.
- Keep at least $300 buffer from $1,000.
- Demo cloud under $250/month.

## Controls
- Azure budget alerts at $100, $250, $500, $800.
- Delete idle AI Search resources.
- Cache LLM summaries.
- Scale compute to zero where possible.
- Short log retention.
- No Kubernetes.
- No large indexing until paid pilot.

## Weekly review
Every Friday:
- Current spend.
- Forecast.
- Top cost services.
- Services to stop/delete.
- Remaining credits.
- Continue/freeze decision.
