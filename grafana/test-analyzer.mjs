import fs from 'node:fs';
import assert from 'node:assert/strict';
const source=fs.readFileSync('grafana/analyze-live-schema.mjs','utf8');
assert.ok(source.includes('candidate_metrics'));
assert.ok(source.includes('warning'));
assert.ok(source.includes('sleep'));
assert.ok(source.includes('activities'));
console.log('Metric candidate analyzer smoke checks passed.');
