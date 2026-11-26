#!/usr/bin/env node
import fs from 'node:fs';
import assert from 'node:assert/strict';

const source = JSON.parse(fs.readFileSync('grafana/dashboards/garmin-original-clone.json', 'utf8'));
const inventory = JSON.parse(fs.readFileSync('grafana/REFERENCE_MASTER_INVENTORY.json', 'utf8'));
const ledger = JSON.parse(fs.readFileSync('grafana/FIELD_VALIDATION_LEDGER.json', 'utf8'));
const review = JSON.parse(fs.readFileSync('grafana/CORE_PANEL_MAPPING_REVIEW.json', 'utf8'));
const catalog = JSON.parse(fs.readFileSync('grafana/CORE_METRIC_EVIDENCE_CATALOG.json', 'utf8'));

const targetKeys = [];
for (const panel of source.panels || []) {
  for (let i = 0; i < (panel.targets || []).length; i++) targetKeys.push(panel.id + ':' + i);
}
assert.equal(targetKeys.length, 143, 'Source dashboard target count changed; review mapping identity');
assert.equal(new Set(targetKeys).size, targetKeys.length, 'Source target stable keys must be unique');
assert.deepEqual(inventory.targets.map(x => x.stableKey).sort(), targetKeys.sort(), 'Master inventory must match source targets exactly');
assert.equal(ledger.metrics.length, targetKeys.length, 'Validation ledger must cover every source target');
assert.deepEqual(ledger.metrics.map(x => x.stableKey).sort(), targetKeys, 'Ledger stable keys must match source targets');
assert.ok(ledger.metrics.every(x => x.status !== 'VERIFIED'), 'This gate does not grant semantic verification');
assert.ok(review.targets.every(x => targetKeys.includes(x.stableKey)), 'Review candidates must reference actual source targets');
assert.ok(review.targets.every(x => x.status === 'REVIEW_CANDIDATE'), 'Candidate review cannot silently promote mappings');
assert.ok(catalog.metrics.every(x => x.status === 'SCHEMA_CONFIRMED_CANDIDATE_NOT_VERIFIED'), 'Schema evidence is not semantic verification');
assert.ok(catalog.metrics.every(x => Number.isFinite(x.records_with_field) && x.records_with_field >= 0), 'Field coverage counts must be valid');
console.log('Source-to-evidence crosswalk passed: 143 stable target identities, no candidate promotion.');
