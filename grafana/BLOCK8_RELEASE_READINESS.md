# Block 8 — Stabilization / release readiness

**Status: release readiness audit COMPLETE; release intentionally not issued.**

## Repository safety
- Dashboard source JSON and generated candidate assets are versioned.
- Field ledger and private live schema artifact are git-ignored; bearer secrets must not be committed.
- Candidate generator only enables targets with complete VERIFIED mappings.
- Production Worker/D1 sync and cron are protected from this work.
- No publishing/import or production deployment was performed.

## Release blockers
- Authenticated live schema and coverage audit.
- Validation of field semantics and units for mapped metrics.
- Infinity datasource live connection and header verification.
- Time picker/server-side range behavior.
- Panel render and transformation validation.
- Progressive clone comparison against reference.
- Final CI evidence for the newest commits.

## Release gate
Do not import or publish the candidate dashboards until the blockers above are resolved. This repository work remains on the feature branch and draft PR.
