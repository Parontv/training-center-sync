# Block 4 — Deterministic conversion engine scaffold

**Status: scaffold and input safeguards complete; production panel conversion remains dependent on verified live fields.**

## Implemented
- `grafana/build-d1-conversion-candidate.mjs`: deterministic generator based on stable identity `panelId:targetIndex`.
- Generator reads the preserved source dashboard and the field-validation ledger.
- It enables a target only when status is VERIFIED and the mapping is complete (allowlisted source, dataset, exact field path, valid aggregation and unit).
- Unverified targets are inert, rather than guessed or given fabricated query fields.
- Generator produces a conversion-candidate JSON and a conversion queue.
- `grafana/test-conversion-engine.mjs`: validates ledger target count, stable-key integrity and the complete mapping requirements for any target marked VERIFIED.
- CI workflow updated to run conversion-engine input test.

## Safety / limitations
- The candidate has **0 active targets** because the ledger contains no verified live D1 mapping yet. This is intentional.
- Generated JSON is a candidate artifact, not imported or published in Grafana.
- Infinity query parameter semantics and time-picker interpolation still need a live end-to-end test before any target can be enabled.
- No live Worker/D1/Grafana operations or publishing performed.

## Files
- `grafana/build-d1-conversion-candidate.mjs`
- `grafana/test-conversion-engine.mjs`
- `.github/workflows/grafana-catalog.yml`

## Validation
- Generator input integrity tests are committed and added to CI.
- Actual generation requires running the script in a repository checkout; the current GitHub connector does not provide a shell checkout or workflow-run result for the newest commit at this point, so generated candidate runtime and CI status remain pending.

**Status: SCAFFOLD COMPLETE.** The verified-only engine is ready to accept real mappings. Continue with Block 5 progressive panel conversion audit.
