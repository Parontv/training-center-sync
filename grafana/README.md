# Grafana automation

This branch is a safe scaffold for dashboards as code against the Training Center read-only Worker API.

## Current state
- `datasets.json`: candidate Garmin metric catalogue; actual CORE inclusion must be verified against live D1 coverage.
- `build-dashboards.mjs`: creates a catalog dashboard JSON from the manifest.
- `test-datasets.mjs`: sanity checks manifest.
- CI validates the manifest and generated dashboard JSON.
- `METRICS_API_CONTRACT.md`: proposal for normalized metrics endpoints.

## Generate
```bash
node grafana/test-datasets.mjs
node grafana/build-dashboards.mjs
```

## Important limitations
This catalogue is not yet a live metric dashboard. The live D1 schema endpoint requires the Worker bearer token; that authenticated live audit has not been run by this development session. The generator deliberately does not invent series or field paths. Publishing to Grafana is also not enabled.

## Next milestones
1. Validate dataset field paths and coverage from live `/dashboard-schema`.
2. Build a strict allowlisted read-only normalized API for confirmed datasets.
3. Generate real time-series panels with units and missing-data handling.
4. Validate Grafana Infinity queries and dashboard API publishing.
