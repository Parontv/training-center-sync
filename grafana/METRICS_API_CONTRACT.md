# Garmin Metrics API contract for Grafana

## Read-only principle
These contracts are proposed for implementation only after schema/coverage validation. They are not live endpoints yet. Existing `/dashboard-data` currently supplies dataset inventory, activity summaries, recent daily records, steps samples and quality metrics.

## Proposed endpoint
`GET /dashboard-metrics?metric=<metric>&from=<YYYY-MM-DD>&to=<YYYY-MM-DD>&interval=<day|week>`
Authorization: Bearer `SYNC_BEARER_TOKEN`

### Response shape
```json
{
  "ok": true,
  "metric": "hrv",
  "unit": "ms",
  "points": [
    {"date":"2026-01-01","value":42}
  ],
  "coverage": {"records":123,"missing":0}
}
```

## Candidate metric contracts
- `sleep`: duration, stages, score; normalize minutes/hours only after field audit.
- `hrv`: daily value and available baseline/status.
- `weight`: weight values and dates, no fabricated interpolation.
- `resting_hr`: daily resting HR.
- `steps`: daily steps.
- `stress`: daily stress summary.
- `training_load`: load/readiness/recovery fields where available.
- `respiration`, `spo2`, `body_composition`: secondary after coverage audit.

## Required safeguards
- Read-only SQL and allowlisted metric definitions.
- Validate date ranges and interval.
- Return normalized numeric points with explicit units and missing values omitted.
- Bounded payload; aggregate in D1 where possible.
- No user-supplied SQL or field path.
- Never infer data that is missing; expose coverage.
- Dashboard panels must use these normalized contracts rather than raw JSON dumps.

## Status
Proposal only. Do not consider this endpoint implemented until code, tests and deployment are complete.
