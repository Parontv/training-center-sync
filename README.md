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
- The sync uses a three-day rolling lookback window and upserts records; it does not delete historical records.
- No Excel file is modified automatically in this first stage.
- Do not paste API keys, passwords, bearer tokens, or Cloudflare tokens into GitHub issues, commits, or ChatGPT.

## Historical backfill
- `POST /backfill` runs one bounded three-day historical window manually.
- The cursor is stored in D1 table `sync_state` and advances only when every dataset in the window succeeds.
- The initial date defaults to `2015-01-01`; it can be overridden with Worker variable `BACKFILL_START_DATE`.
- The scheduled agent resumes automatically from the saved cursor; repeated manual requests are not required.
- A failed or partial window does not advance the cursor; the next scheduled run retries it. Records are upserted by dataset + record key.
- Historical availability is limited to what Garmin Personal API actually returns for the account. The start date is a configurable search boundary, not a guarantee that Garmin has data back to that date.

The Cron Trigger runs every 15 minutes. While the historical cursor is behind the current date, each invocation processes one bounded three-day window and does not waste requests repeating the recent sync. Once the cursor passes today, the agent automatically switches to the normal rolling three-day sync. Each invocation limits activity-detail/workout downloads to three activities. A partial/failed window does not advance the cursor and is retried on a later scheduled run. The manual `/backfill` endpoint remains available for one-step diagnostics.

## Activity details
During activity synchronization, the Worker now fetches the Garmin activity detail endpoint for activities that do not yet have a detail row in D1. Full detail JSON is stored in `activity_details`, keyed by Garmin activity ID. Existing details are not repeatedly downloaded on every rolling sync. The activity summary, full detail and available workout structure are stored separately in D1. Original FIT/ZIP files are intentionally not downloaded because the Personal API JSON data is sufficient for the current project scope.

### Additional date-scoped health datasets
The sync also archives daily heart-rate detail (`daily_heart_rate`), fitness age (`fitness_age`), and SpO2/acclimation (`spo2_acclimation`) using Garmin Personal API endpoints documented by Garmin's reference client. These endpoints are date-scoped, so the Worker checks D1 first and requests only dates not already present for that dataset. Missing responses are left missing; they are not converted to zero values.

## Expanded automatic Garmin coverage
The Worker archives additional Personal API datasets, using only documented Garmin endpoints:
- Daily heart-rate detail, daily HRV readings, detailed daily sleep, fitness age, SpO2/acclimation, and food logs (date-scoped; a date is requested only when no record for that dataset/date exists).
- Activity workouts for each activity, fetched once per activity ID.
- Profile settings, heart-rate zones, and activity type catalog (stored once initially).
- Effective weight goals for each sync date range.
Existing range datasets include daily summaries, steps, stress, sleep summaries, HRV summaries, Body Battery, weight measurements, hydration, VO2 Max, and wellness activity summaries.
All responses are retained as raw JSON in D1. Empty Garmin responses remain absent, not zero-filled. Endpoint availability and historical depth depend on the Garmin account and Personal API permissions; a successful endpoint definition does not guarantee that every account has data for it.

## Authenticated data export
- `GET /export?dataset=garmin_records&limit=250&offset=0` returns a paginated JSON page of the raw Garmin archive.
- Supported datasets: `garmin_records`, `activities`, `activity_details`, and `daily_records`.
- Maximum page size is 500 rows. Follow `nextOffset` until it is `null`.
- Every export request requires `Authorization: Bearer <SYNC_BEARER_TOKEN>`. Never publish the token or expose this endpoint without authentication.
- The export endpoint is the bridge for generating the separate Excel Master from D1. It does not modify an existing workbook.
