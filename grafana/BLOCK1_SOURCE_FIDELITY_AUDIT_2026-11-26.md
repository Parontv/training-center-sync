# Block 1 — Source acquisition and fidelity audit (2026-11-26)

## Status: CLOSED — source fidelity baseline verified

### Source and reference
- Source project: arpanghosh8453/garmin-grafana, Garmin Stats dashboard.
- Repository reference JSON: `grafana/dashboards/garmin-original-clone.json`.
- Dashboard structural inventory: **62 panels, 143 targets**.
- Stable target identity: `panelId:targetIndex`.
- Reference remains an InfluxDB-based source template only; queries are not directly executable against Training Center D1/Infinity.

### Cross-inventory fidelity
The existing reference fidelity audit test asserts:
- 62 panels present in source, detail audit, query inventory, and master inventory.
- Unique panel IDs.
- Title, panel type, and grid layout agree across all inventories.
- Target counts match for every panel.
- Master inventory contains 143 target records and stable target keys.

### Live Grafana evidence acquired
Read-only API access verified on 26 Nov 2026 via GitHub Actions run 45895097382 (success):
- Authenticated Grafana API user.
- Datasource list endpoint accessible.
- Current dashboard UID `lirklwv`, title `garmin dashboard`, version 18.
- Current dashboard contains **2 panels**, not the 62-panel Garmin Stats reference.
- Current dashboard panels: activity table and average/max heart-rate bar chart, both using Infinity and the Worker `/dashboard-data` endpoint.
- Datasource found by normalized name matching: `TrainingCenter-D1`, UID `fg59opbqak9ogb`, Infinity type.
- Read-only evidence artifact successfully uploaded and downloaded for inspection.

### Discrepancy clarified
The live API evidence is the user's currently working dashboard (2 panels). The 62-panel source is the external Garmin Stats reference clone in the repository. They are different dashboards; the 2-panel live dashboard is not evidence that the reference clone has been replicated.

### Safety
No dashboard writes/publishing, Worker deployment, D1 writes, Garmin sync/backfill/cron changes, or PR merge occurred.

### Block 1 exit
- [x] Source JSON and inventories available.
- [x] Panel and target counts reconciled.
- [x] Stable panel-target identities documented.
- [x] Live current dashboard and datasource read-only evidence collected.
- [x] Difference between current live dashboard and reference clone explicitly identified.

**Next block:** Block 2 — dataset/field mapping and evidence normalization, starting with CORE daily metrics and prioritizing fields with coverage, date semantics, units, aggregation and query suitability evidence.