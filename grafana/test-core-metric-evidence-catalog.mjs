import fs from 'node:fs';import assert from 'node:assert/strict';
const catalog=JSON.parse(fs.readFileSync('grafana/CORE_METRIC_EVIDENCE_CATALOG.json','utf8'));
assert.ok(catalog.metrics.length>=15);
assert.equal(catalog.statusPolicy,'SCHEMA_CONFIRMED_CANDIDATE_NOT_VERIFIED');
for(const m of catalog.metrics){
 assert.ok(m.metric&&m.sourceCandidate&&m.dataset&&m.field_path&&m.value_type,'candidate mapping fields must be complete');
 assert.ok(Number.isFinite(m.records_with_field)&&m.records_with_field>=0,'coverage count must be numeric');
 assert.notEqual(m.status,'VERIFIED','schema evidence must never imply semantic verification');
 assert.ok(m.status==='SCHEMA_CONFIRMED_CANDIDATE_NOT_VERIFIED');
}
assert.ok(catalog.metrics.some(m=>m.metric==='steps'));
assert.ok(catalog.metrics.some(m=>m.metric==='sleep_duration'));
assert.ok(catalog.metrics.some(m=>m.metric==='resting_hr'));
console.log('Core metric evidence catalog safeguards passed.');
