import fs from 'node:fs';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';
const sourcePath='grafana/dashboards/garmin-original-clone.json',outPath='grafana/dashboards/garmin-stats-d1-conversion-candidate.json',queuePath='grafana/CONVERSION_ENGINE_QUEUE.json';
const source=JSON.parse(fs.readFileSync(sourcePath,'utf8')),ledger=JSON.parse(fs.readFileSync('grafana/FIELD_VALIDATION_LEDGER.json','utf8'));
const run=spawnSync(process.execPath,['grafana/build-d1-conversion-candidate.mjs'],{encoding:'utf8'});assert.equal(run.status,0,run.stderr||run.stdout);
const out=JSON.parse(fs.readFileSync(outPath,'utf8')),queue=JSON.parse(fs.readFileSync(queuePath,'utf8'));
assert.equal(out.panels.length,source.panels.length,'panel count must remain unchanged');
for(const p of source.panels){const q=out.panels.find(x=>x.id===p.id);assert.ok(q,'source panel id retained: '+p.id);assert.equal(q.title,p.title,'panel title retained: '+p.id);assert.deepEqual(q.gridPos,p.gridPos,'panel grid position retained: '+p.id);assert.equal(q.type,p.type,'panel type retained: '+p.id);}
const sourceTargets=(source.panels||[]).flatMap(p=>(p.targets||[]).map((t,i)=>p.id+':'+i));assert.equal(queue.targetCount,sourceTargets.length);assert.deepEqual(queue.queue.map(x=>x.stableKey).sort(),sourceTargets.sort(),'every source target must be represented in queue');
const verified=ledger.metrics.filter(x=>x.status==='VERIFIED').length;assert.equal(queue.enabledTargets,verified,'only verified mappings may be enabled');
assert.equal((out.panels||[]).flatMap(p=>p.targets||[]).length,verified,'active targets must match verified mapping count');
console.log('Phase 4 fidelity gate passed: source panel structure retained and target queue complete.');
