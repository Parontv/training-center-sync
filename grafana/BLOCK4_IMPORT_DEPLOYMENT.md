# Block 4 — Grafana import and deployment readiness

This repository produces a candidate dashboard JSON artifact; it is not yet an automatically deployed Grafana dashboard.

## Datasource provisioning
Provision `grafana/provisioning/datasources/training-center-d1.yaml` using Grafana provisioning. Set the environment variable `SYNC_BEARER_TOKEN` in Grafana's runtime environment. Never store the token in dashboard JSON or repository files.

The datasource UID is `training-center-d1` and its plugin type is `yesoreyeram-infinity-datasource`.

## Import
1. Install the Infinity datasource plugin in Grafana.
2. Provision the datasource YAML and restart/reload Grafana as appropriate.
3. Import the generated candidate dashboard artifact from GitHub Actions.
4. Validate queries and panel visualization individually. Candidate panels are not semantic validation and must not be treated as a finished Garmin Stats clone.

## Current limitations
- Scalar metrics endpoint only; activity-specific, GPS, histogram, distribution, and multi-series targets need endpoint-specific designs.
- No automatic Grafana API push is configured.
- Authentication is configured at datasource level; generated dashboard artifacts must never include bearer credentials.
