# Training Center – Appsmith Community (local)

This is a separate local dashboard environment. It does not modify the Garmin Worker, Cloudflare D1, cron schedules, sync locks, or Garmin credentials.

## Architecture

Browser (this PC) -> Appsmith Community in Docker -> authenticated HTTPS REST API -> existing `training-center-sync` Worker -> existing D1 database.

Appsmith must use the Worker API as a read-only datasource. Do not connect Appsmith directly to D1 and do not add any write/mutation queries.

## Requirements

- Windows 10/11 supported by the current Docker Desktop release.
- Docker Desktop using the WSL 2 backend.
- WSL 2.1.5 or later.
- Hardware virtualization enabled.
- At least 8 GB host RAM is the documented baseline for Appsmith's all-in-one Docker deployment. More RAM is preferable if this PC is also used for other demanding work.
- Internet access to pull the Appsmith image and dependencies.

Official references:
- Appsmith Docker installation: https://docs.appsmith.com/getting-started/setup/installation-guides/docker
- Appsmith self-hosting: https://docs.appsmith.com/getting-started/setup
- Docker Desktop for Windows: https://docs.docker.com/desktop/setup/install/windows-install/
- Docker WSL 2 backend: https://docs.docker.com/desktop/features/wsl/

## Start on Windows

1. Install Docker Desktop from https://www.docker.com/products/docker-desktop/.
2. Start Docker Desktop and wait until it reports that the engine is running.
3. Open PowerShell in this folder (`tools/appsmith-local`).
4. Run:

   ```powershell
   docker compose up -d
   docker compose ps
   ```

5. Open http://localhost:8080. First startup can take several minutes.
6. Create the local Appsmith administrator account. Use a unique password and do not reuse the Garmin or Cloudflare credentials.

## Stop and restart

Stop without deleting data:

```powershell
docker compose stop
```

Start again:

```powershell
docker compose start
```

View logs:

```powershell
docker compose logs -f appsmith
```

Do not run `docker compose down -v` and do not delete the `stacks` directory: they contain Appsmith's persisted configuration.

## Persistent data

Appsmith state is stored in the local `stacks` directory, mounted at `/appsmith-stacks`. This folder is intentionally not committed to Git because it will contain local application configuration and potentially encrypted credentials.

## Read-only datasource plan

Create one Appsmith Authenticated API datasource:

- Name: `TrainingCenterReadOnly`
- Base URL: `https://training-center-sync.listaconcerti.workers.dev`
- Authentication: Bearer Token
- Token: the existing `SYNC_BEARER_TOKEN`, entered only in the Appsmith datasource secret field. Never put it in JavaScript widgets, query URLs, Git, or chat.

Initial GET queries to validate:
- `/health` (public health check; no secret required)
- `/status` (Bearer token required)
- `/dashboard-data` (Bearer token required, if present in the deployed Worker)
- `/dashboard-browser?source=garmin_records&limit=50&offset=0` (Bearer token required, only if this endpoint has been deployed)

Important: the Git branch may contain newer Worker endpoints than the currently deployed Cloudflare Worker. Before connecting Appsmith, test each endpoint against the live Worker. Do not deploy Worker changes as part of Appsmith installation.

## Migration phases

1. Run Appsmith locally and create its administrator account.
2. Test the existing read-only Worker endpoints with the Authenticated API datasource.
3. Build the first page: archive browser with server-side pagination, dataset/date/search filters, clickable rows, JSON detail.
4. Add dedicated pages for Activities, Daily Health, Body Metrics, Sleep/HRV, and Data Quality.
5. Add Sync Monitor as a read-only page. Do not add buttons that trigger backfill or daily sync.
6. Compare counts and sample records with the existing dashboard before switching the bookmark.

## Safety boundaries

- No D1 credentials in Appsmith.
- No direct D1 connection from Appsmith.
- No write, update, insert, delete, backfill, or sync actions in Appsmith.
- Never change Worker code, D1 schema/data, secrets, or cron schedules as part of this local installation.
- Keep the existing Worker dashboard available until the Appsmith replacement has been tested.
- Local-only means the app is reachable at `localhost:8080` on this PC. Do not expose port 8080 to the public internet or configure a tunnel during this phase.
