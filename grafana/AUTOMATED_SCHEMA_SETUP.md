# Automated live D1 schema snapshot

The schema audit can run without downloading/uploading JSON manually.

## One-time repository setup
1. In GitHub repository Settings → Secrets and variables → Actions, add repository secret `SYNC_BEARER_TOKEN` using the existing Cloudflare Worker bearer token. Never commit it.
2. After this workflow is merged into the default branch, the schedule runs every 6 hours. Until then, run it manually on the feature branch via Actions → Refresh sanitized D1 schema snapshot → Run workflow.
3. The workflow performs GET-only access to the Worker schema endpoint, discards example values, and writes only dataset/field path/type/count metadata.
4. PR-triggered runs upload the sanitized report as a short-lived artifact (7 days) instead of pushing commits.

## Security
- Only sanitized metadata is retained.
- The token is passed as a GitHub Actions secret to the process environment.
- The Worker endpoint remains authenticated.
- The script does not change D1, Worker configuration, sync, cron or Grafana.
