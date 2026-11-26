# Block 6 — Training Center thematic dashboard audit

**Status: static audit COMPLETE; consolidation recommendation recorded.**

## Existing dashboards
| Dashboard | UID | Panels | Targets |
|---|---|---:|---:|
| Garmin Master | training-center-master | 9 | 9 |
| Garmin Overview | training-center-overview | 6 | 6 |
| Attività & Archivio | training-center-activity | 7 | 7 |

All 22 panels declare the Infinity datasource UID `training-center-d1`. Their target definitions use the Worker `/dashboard-data` endpoint. These are static assets; no live Grafana rendering/authentication has been verified.

## Overlap found
Master and Overview duplicate core archive stats, dataset coverage, activity list and activity quality panels. Master contains more archive detail and appears to be the fuller master view. Activity dashboard focuses on archive/activity metrics.

## Recommendation
- Preserve UIDs and panel IDs.
- Treat Garmin Master as the central entry/dashboard.
- Keep Overview only if it becomes a compact landing dashboard; otherwise consolidate duplicate panel concepts in a later reviewed migration.
- Keep Attività & Archivio separate as drill-down.
- Avoid rewriting these dashboards before live Infinity authentication and endpoint payload checks.

No dashboard JSON was altered during this audit. No publishing or import performed.
