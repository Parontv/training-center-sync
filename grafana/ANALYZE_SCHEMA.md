# Metric field candidate analysis

After running the authenticated schema audit locally, analyze the private JSON:

```bash
node grafana/analyze-live-schema.mjs grafana/live-schema-audit.json
```

Produces `grafana/metric-candidates.json` (local/private). It matches field paths and dataset names to metric families as a **heuristic**. Do not commit either report: they may contain Garmin samples. Treat the output as a review aid, not verified field mapping or unit information.
