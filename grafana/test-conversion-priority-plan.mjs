import fs from 'node:fs';import assert from 'node:assert/strict';
const p=JSON.parse(fs.readFileSync('grafana/CONVERSION_PRIORITY_PLAN.json','utf8'));
assert.equal(p.targetCount,143);assert.ok(p.targets.every(x=>x.validationStatus==='NOT_VERIFIED'));
assert.equal(p.counts.core+p.counts.secondary+p.counts.experimental,143);
assert.equal(p.counts.rawQuery+p.counts.simple+p.counts.complex,143);
console.log('Conversion priority plan integrity passed.');
