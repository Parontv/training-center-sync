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
