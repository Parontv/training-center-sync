# Garmin Stats progressive D1 conversion

This asset is a progressive, importable conversion copy of the preserved original Garmin Stats dashboard.

- Source reference remains unchanged: \`garmin-original-clone.json\` (62 panels / 143 original targets).
- Output: \`garmin-stats-d1-progressive.json\` (same 62 panel IDs/layout).
- Five panels are connected to the existing authenticated Worker endpoint \`/dashboard-data\`: Recent Activity (38), Activities timeline (41), HR difference (48), Activity Distance (53), and Activity Duration (54).
- The mapping uses the documented \`activities\` response fields: \`start_time_local\`, \`activity_type\`, \`activity_name\`, \`duration_s\`, \`distance_m\`, \`average_hr\`, \`max_hr\`, and \`calories\`.
- Other query panels remain visually preserved but query-inert, marked as pending mapping. No guessed Garmin field paths are used.
- Infinity datasource UID: \`training-center-d1\`; its secure Authorization header is configured at the datasource, never in dashboard JSON.

## Limitation

The Worker response returns the most recent 500 activities and does not apply Grafana's time-picker range to that array. The five connected panels therefore show recent records, not a time-filtered historical series. This is a static contract/importability verification only; authenticated Worker data and Grafana rendering were not live-tested in this run.

## Build and test

\`\`\`sh
node grafana/build-progressive-clone.mjs
node grafana/test-progressive-clone.mjs
\`\`\`
