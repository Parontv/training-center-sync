# Phase 3 — Read-only API contract audit

Date: 2026-11-26. Branch `feat/grafana-automated-builder`.

## Scope and evidence
Static inspection of the Worker read-only routes for schema metadata, field values, field coverage, aggregates, record dates and dashboard data. Each is gated by the configured bearer token and GET method; field routes validate source, dataset/path lengths, ISO date boundaries and bounded limits/aggregation values. SQL parameters bind dataset/path/date values; table source is allowlisted. Static contracts remain limited and do not prove runtime behavior or Grafana Infinity configuration.

## Defect corrected
The `/dashboard-data` route previously called `ensureCoreSchema`, which performs CREATE TABLE/INDEX and potentially ALTER TABLE. That made the endpoint not strictly read-only despite its intended contract. Removed the schema-initialization call from this route. Sync/bootstrap remains responsible for schema setup; dashboard-data now only reads existing tables. Added a regression test guarding GET-only/authenticated and absence of schema/DML statements in the route.

## Verification boundary
- [x] Static read-only API route audit.
- [x] Strict read-only regression test added to CI.
- [ ] Live authenticated runtime test: deferred to explicit validation, avoiding production D1 mutation/deployment.
- [ ] Grafana Infinity UI/parser/time-range behavior: still external validation.

No deployment, D1 write, sync/backfill or cron change was made.
