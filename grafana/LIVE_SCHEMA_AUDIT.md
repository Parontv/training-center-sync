# Live schema audit (read-only)

Run with Node 20+ from repository root:

```bash
WORKER_BASE_URL=https://<your-worker-host> SYNC_BEARER_TOKEN=<token> node grafana/audit-live-schema.mjs
```

Optional output path: `AUDIT_OUTPUT=grafana/live-schema-audit.json`.

- Calls only authenticated GET `/dashboard-schema`.
- Does not call sync/backfill, alter D1, or deploy.
- Token is passed as environment variable and never printed or saved.
- Output may contain personal data samples from Garmin payloads; keep the audit report private and do not commit it.
- If the schema endpoint returns HTTP 401/403, check URL and token locally. The script does not retry or log credentials.
