# Next step: authenticated live schema audit for Grafana (read-only)

## Verified in source
- `wrangler.toml` binds D1 as `DB` to database `storico_garmin` (ID configured in project).
- `GET /dashboard-schema` is implemented in `src/index.js` on branch `feat/grafana-automated-builder`.
- The endpoint requires `Authorization: Bearer <SYNC_BEARER_TOKEN>` and queries JSON leaf fields from `garmin_records` and `daily_records` using `json_tree`. It does not write to D1.
- The `/run` UI includes an **Audit schema Grafana** button, which calls `/dashboard-schema` and downloads `training-center-live-schema-audit.json`.
- The branch contains the endpoint and UI code. Its deployment to the live Worker is **not verified** here. Do not assume it is deployed.

## Safe deployment check (Cloudflare UI)
1. Open Cloudflare Dashboard > Workers & Pages > `training-center-sync`.
2. Inspect the deployment/version currently serving the Worker. Confirm it corresponds to the GitHub branch/commit that contains the endpoint. Do not deploy blindly if the current production version has newer unrelated changes.
3. If a deployment from the audited branch is approved and there are no unexpected changes, deploy that branch using the project's established workflow.
4. Confirm the existing `SYNC_BEARER_TOKEN` secret is present. Do not expose it in code, screenshots, chat, URLs or Git commits. The UI audit uses the same secret.
5. Open the Worker's `/run` page, enter the secret locally, then press **Audit schema Grafana**.
6. Keep the downloaded JSON private. It may include raw sample values from Garmin.
7. Once downloaded, upload the JSON in this chat for field mapping. Never send the token.

## Expected verification
- HTTP 200 and JSON with `ok:true`, `garmin_records`, `daily_records`, `totals`.
- If HTTP 401, secret mismatch or missing secret; if 404, endpoint is not present in the live deployment.
- This audit is read-only and does not alter Garmin sync, historical backfill, D1 rows, or Grafana.

## Why this is the current gate
The original dashboard has 143 Influx targets. We must map their semantics to verified D1 field paths and data coverage before generating Infinity queries. Guessed fields or unit labels would create a visually plausible but incorrect dashboard.
