import fs from 'node:fs'; import assert from 'node:assert/strict';
const source=JSON.parse(fs.readFileSync('grafana/dashboards/garmin-original-clone.json','utf8'));
const detail=JSON.parse(fs.readFileSync('grafana/dashboards/garmin-original-query-details-audit.json','utf8'));
const inventory=JSON.parse(fs.readFileSync('grafana/dashboards/garmin-original-query-inventory.json','utf8'));
const master=JSON.parse(fs.readFileSync('grafana/REFERENCE_MASTER_INVENTORY.json','utf8'));
const panels=source.panels; assert.equal(panels.length,62); assert.equal(detail.panels.length,62); assert.equal(inventory.panels.length,62); assert.equal(master.panels.length,62);
const ids=panels.map(p=>p.id); assert.equal(new Set(ids).size,62,'source panel IDs unique');
const index=(arr)=>new Map(arr.map(p=>[p.id,p])); const di=index(detail.panels), ii=index(inventory.panels), mi=index(master.panels);
for(const p of panels){ for(const [label,m] of [['details',di],['query inventory',ii],['master inventory',mi]]) assert.ok(m.has(p.id),label+' missing panel '+p.id); const d=di.get(p.id),i=ii.get(p.id),m=mi.get(p.id); for(const q of [d,i,m]) {assert.equal(q.title,p.title,'title mismatch panel '+p.id); assert.equal(q.type,p.type,'type mismatch panel '+p.id); assert.deepEqual(q.gridPos,p.gridPos,'gridPos mismatch panel '+p.id);} assert.equal(d.targets.length,p.targets?.length??0,'details target count mismatch panel '+p.id); assert.equal(i.targets.length,p.targets?.length??0,'inventory target count mismatch panel '+p.id); assert.equal(m.targetCount,p.targets?.length??0,'master target count mismatch panel '+p.id); }
assert.equal(master.targets.length,143); const stable=new Set(master.targets.map(t=>t.stableKey)); assert.equal(stable.size,143); assert.ok(master.targets.every(t=>stable.has(t.panelId+':'+t.targetIndex)));
console.log('Reference fidelity audit passed: 62 panels, IDs/layout/title/type and target counts agree across source and three inventories; 143 unique target keys.');
