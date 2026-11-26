import fs from 'node:fs';import assert from 'node:assert/strict';
const source=JSON.parse(fs.readFileSync('grafana/dashboards/garmin-original-clone.json','utf8'));
const ledger=JSON.parse(fs.readFileSync('grafana/FIELD_VALIDATION_LEDGER.json','utf8'));
assert.equal(ledger.metrics.length,143);
const keys=new Set(ledger.metrics.map(x=>x.stableKey));assert.equal(keys.size,143);
assert.ok(ledger.metrics.every(x=>x.stableKey===x.panelId+':'+x.targetIndex));
assert.ok(ledger.metrics.every(x=>x.status!=='VERIFIED'||(x.mapping&&['daily_records','garmin_records'].includes(x.mapping.source)&&x.mapping.dataset&&x.mapping.field_path&&['avg','min','max','sum'].includes(x.mapping.aggregation)&&typeof x.mapping.unit==='string')),'verified mappings must be complete');
console.log('Conversion engine input integrity tests passed.');
