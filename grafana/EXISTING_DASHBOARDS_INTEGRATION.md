# Reused dashboard setup from PR #8

The existing dashboards have been carried forward into the development branch unchanged, preserving UIDs and panel definitions:

- `training-center-master.json` UID `training-center-master`
- `training-center-overview.json` UID `training-center-overview`

Architecture from the original guide:
Grafana Cloud (Free) -> Infinity datasource -> authenticated Worker -> D1.

Datasource setup:
- Name: `Training Center D1`
- UID: `training-center-d1`
- Base URL: `https://training-center-sync.listaconcerti.workers.dev`
- Authorization header: Bearer token stored securely in Grafana datasource configuration, never in dashboard JSON or Git.

The original overview uses the bounded `/dashboard-data` endpoint and is explicitly not full historical analytics. Next work is to extend it using verified read-only historical endpoints. Keep dashboards private and read-only. No Worker/D1 mutation or deployment is performed by this branch.
