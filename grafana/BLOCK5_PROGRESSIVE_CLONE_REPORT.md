# Block 5 — Progressive Garmin Stats conversion audit

**Status: structural audit and conversion sequencing COMPLETE; panel conversion blocked by live schema validation.**

## Structural verification
- Original dashboard: 62 panels, 143 targets.
- Progressive clone: 62 panels.
- All panel IDs preserved.
- No duplicate panel IDs in the progressive clone.
- 5 activity-oriented panels have one active target each (IDs 38, 41, 48, 53, 54).
- 57 source target mappings remain inert in the progressive clone, not guessed.
- Clone removes InfluxDB datasource dependency and declares Infinity.
- The progressive clone test validates the five active targets, response columns, datasource UID, query root, preserved panel 48 calculation, no secret references and no Influx references.

## Conversion phase queue
Created `grafana/PROGRESSIVE_CONVERSION_PHASES.json` with 143 target records and phased conversion order. The queue explicitly marks all as pending live-field verification:
- 5A/5B: Class A scalar/daily candidate targets.
- 5B/5C: Class B transform/semantic review.
- 5D: Class C intraday, spatial, histogram and complex panel work.

## CI
Added `grafana/test-progressive-phase-queue.mjs` and included it in the catalog workflow.

## Remaining
Actual conversion of the remaining 57 targets requires verified D1 field paths, units, coverage and compatible endpoint response shapes. This is a genuine dependency on Block 2 live evidence and Block 3 live API testing. No dashboard was published/imported and no production data was changed.

**Status: structural audit complete; progressive conversion waiting on verified data mappings.**
