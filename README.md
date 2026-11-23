# Training Center Sync

Private, personal Garmin Connect data archive for the Training Center project.

## Goals
- Pull the owner's Garmin Connect Personal API data on a Cloudflare Cron Trigger.
- Recover a rolling historical window so missed days are not lost.
- Store raw JSON and normalized activity/day records in Cloudflare D1.
- Deduplicate activities by Garmin activity ID and daily records by date + dataset.
- Keep credentials in Cloudflare Worker Secrets only.
- Never write personal data or credentials into Git.

## Architecture
Garmin Connect Personal API -> Cloudflare Worker (scheduled) -> Cloudflare D1.
The Excel Master remains the authoritative human-readable archive and is not modified by this service.

## Garmin API
This project uses Garmin's official Personal API, read-only. Create a Personal API key in Garmin Connect Web under Profile & Account -> Settings -> Personal API Key. The key is shown only once. The Worker exchanges it for a bearer token when it runs; Garmin bearer tokens last up to 24 hours.

Official references:
- https://developer.garmin.com/gc-developer-program/personal/personal-api/
- https://developer.garmin.com/gc-developer-program/personal/personal-faq/
- https://developer.garmin.com/gc-developer-program/personal/swagger-docs/
- https://github.com/garmin/connect-personal-api-python

## Cloudflare setup (to be completed)
1. Create a D1 database named `training-center-db`.
2. Apply `schema.sql`.
3. Create a Worker from this repository or deploy with Wrangler.
4. Bind the D1 database as `DB`.
5. Add Worker Secret `GARMIN_PERSONAL_API_KEY` (never commit it).
6. Add a random Worker Secret `SYNC_BEARER_TOKEN` to protect the manual sync endpoint.
7. Configure the Cron Trigger from `wrangler.toml`.

## Endpoints
- `GET /health`: non-sensitive service status.
- `POST /sync`: manual sync; requires `Authorization: Bearer <SYNC_BEARER_TOKEN>`.

## Important
- First deployment is not considered successful until a real authenticated Garmin request succeeds.
- The sync uses a rolling lookback window and upserts records; it does not delete historical records.
- No Excel file is modified automatically in this first stage.
- Do not paste API keys, passwords, bearer tokens, or Cloudflare tokens into GitHub issues, commits, or ChatGPT.

## Historical backfill
- `POST /backfill` runs one bounded seven-day historical window.
- The cursor is stored in D1 table `sync_state` and advances only when every dataset in the window succeeds.
- The initial date defaults to `2015-01-01`; it can be overridden with Worker variable `BACKFILL_START_DATE`.
- Repeat the authenticated POST request to continue from the saved cursor. The endpoint is intentionally separate from the daily cron so historical imports do not make the scheduled sync exceed runtime limits.
- A failed or partial window does not advance the cursor; rerunning it is safe because records are upserted by dataset + record key.
- Historical availability is limited to what Garmin Personal API actually returns for the account. The start date is a configurable search boundary, not a guarantee that Garmin has data back to that date.

The normal daily cron remains a rolling-window sync. Backfill is manually advanced and must be run after deploying the updated Worker.

## Activity details
During activity synchronization, the Worker now fetches the Garmin activity detail endpoint for activities that do not yet have a detail row in D1. Full detail JSON is stored in `activity_details`, keyed by Garmin activity ID. Existing details are not repeatedly downloaded on every rolling sync. The activity summary and detail are separate records by design.

Original Garmin activity ZIP downloads are implemented as an optional feature. They activate only when the Worker has an R2 binding named `RAW_BUCKET`; without that binding, the sync continues to archive activity summaries and details in D1 and skips binary downloads. ZIP bytes are stored in R2 under `activities/{activityId}.zip`, while `activity_files` stores metadata in D1.

### Additional date-scoped health datasets
The sync also archives daily heart-rate detail (`daily_heart_rate`), fitness age (`fitness_age`), and SpO2/acclimation (`spo2_acclimation`) using Garmin Personal API endpoints documented by Garmin's reference client. These endpoints are date-scoped, so the Worker checks D1 first and requests only dates not already present for that dataset. Missing responses are left missing; they are not converted to zero values.

### Enable original activity file archival (Cloudflare R2)
1. Create an R2 bucket in the same Cloudflare account.
2. Add this binding to the Worker configuration, replacing the bucket name with the exact bucket you created:
   ```toml
   [[r2_buckets]]
   binding = "RAW_BUCKET"
   bucket_name = "YOUR_ACTUAL_R2_BUCKET_NAME"
   ```
3. Deploy the Worker and apply migration `0005_activity_files.sql` to D1 (or run the updated `schema.sql` for a new database).
4. The next sync will archive original ZIP files for activities it processes, skipping activity IDs already present in `activity_files`.

Do not put API keys or bearer tokens in `wrangler.toml`. The R2 binding is configuration, not a secret.
