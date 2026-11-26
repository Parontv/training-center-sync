import fs from 'node:fs'; import assert from 'node:assert/strict';
const inv=JSON.parse(fs.readFileSync('grafana/reference-panel-inventory.json','utf8'));
assert.equal(inv.dashboards.length,2);
assert.ok(inv.dashboards[0].panels.length>=50,'reference Garmin Stats inventory');
assert.ok(inv.dashboards[1].panels.length>=15,'reference Strength inventory');
assert.ok(inv.dashboards.flatMap(d=>d.panels).every(p=>p.title&&p.type),'panels must retain title/type');
assert.ok(inv.note.includes('verified Training Center D1 fields')||inv.note.includes('adapt'),'inventory is reference only');
console.log('Reference panel inventory checks passed.');
