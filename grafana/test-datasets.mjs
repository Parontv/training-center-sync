import fs from 'node:fs';
import assert from 'node:assert/strict';
const manifest=JSON.parse(fs.readFileSync('grafana/datasets.json','utf8'));
assert.ok(manifest.datasets.length>0);
assert.ok(manifest.datasets.every(d=>manifest.status.includes(d.status)));
assert.ok(manifest.datasets.some(d=>d.key==='sleep'));
assert.ok(manifest.datasets.some(d=>d.key==='hrv'));
assert.ok(manifest.datasets.some(d=>d.key==='weight'));
console.log('Dataset catalogue sanity checks passed.');
