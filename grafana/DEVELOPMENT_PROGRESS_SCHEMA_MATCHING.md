# Development progress — schema automation and field matching

Date: 2026-11-26

## Completed in this development pass
- Added sanitized schema snapshot helper to convert the authenticated raw schema audit into metadata-only field paths/types/coverage counts.
- Added deterministic heuristic field matching suggestions across the 143 Garmin Stats target inventory.
- Suggestions are explicitly non-verifying: no mapping is marked VERIFIED and the conversion engine remains fail-closed.
- Integrated sanitization and suggestions into the existing read-only schema discovery workflow.
- Corrected workflow triggers to include PR and feature-branch updates, while retaining manual and monthly schedule triggers.
- Updated workflow artifact to contain only sanitized schema snapshot, candidate catalogue and field suggestions.
- Raw live audit JSON is deleted in the cleanup step; it is never uploaded as artifact.
- Added guardrail test and CI validation workflow.
- Added setup instructions for the automatic schema snapshot workflow.

## Verification status
- Source files and workflow were fetched back from GitHub to verify contents.
- GitHub Actions run results for the newest commits have not yet been returned by the connector.
- Live D1 field data has not been fetched in this session: the Actions secret SYNC_BEARER_TOKEN may still be missing.
- No D1, Garmin sync, Worker deployment, cron, or Grafana publication changes were made.

## Next
1. Verify the repository Actions secret and WORKER_BASE variable.
2. Run the read-only schema discovery workflow.
3. Review sanitized artifact with field suggestions.
4. Select fields and units for actual mappings, then convert highest-priority panels.

## Follow-on development pass (2026-11-26)
- Improved field matching: token extraction from query references and ranking by exact field path, dataset, and panel title signals.
- Added synthetic integration test that creates a fixture snapshot, runs the matching engine, verifies 143-target output and unverified status, then removes generated files.
- Added deterministic 143-target work-priority generator that separates CORE/SECONDARY/EXPERIMENTAL tiers and query complexity.
- Added priority-plan integrity tests and wired these into CI.
- Latest PR #10 head verified mergeable and remains draft. No Actions results returned for this newest head.
