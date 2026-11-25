import fs from 'node:fs';import assert from 'node:assert/strict';
const s=fs.readFileSync('grafana/analyze-live-schema.mjs','utf8');
assert.ok(s.includes('garmin_records'));assert.ok(s.includes('daily_records'));assert.ok(s.includes('candidate_metrics'));assert.ok(s.includes('weight'));console.log('Analyzer smoke checks passed.');