import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
const source=JSON.parse(fs.readFileSync('grafana/dashboards/garmin-original-clone.json','utf8'));
const ledger=JSON.parse(fs.readFileSync('grafana/FIELD_VALIDATION_LEDGER.json','utf8'));
const run=spawnSync(process.execPath,['grafana/build-d1-conversion-candidate.mjs'],{encoding:'utf8'});
assert.equal(run.status,0,'candidate builder must run: '+run.stderr);
const candidate=JSON.parse(fs.readFileSync('grafana/dashboards/garmin-stats-d1-conversion-candidate.json','utf8'));
const queue=JSON.parse(fs.readFileSync('grafana/CONVERSION_ENGINE_QUEUE.json','utf8'));
assert.equal(candidate.panels.length,source.panels.length,'panel count preserved');
assert.equal(candidate.uid,'garmin-stats-d1-conversion-candidate');
assert.equal(queue.targetCount,ledger.metrics.length,'all stable targets queued');
assert.equal(queue.queue.length,143,'queue target count');
assert.equal(queue.enabledTargets,ledger.metrics.filter(x=>x.status==='VERIFIED').length,'only verified mappings wired');
for(const p of source.panels){const q=candidate.panels.find(x=>x.id===p.id);assert.ok(q,'panel '+p.id+' retained');if((p.targets||[]).length){assert.equal(q.targets.length,(p.targets||[]).filter((t,i)=>ledger.metrics.find(m=>m.stableKey===p.id+':'+i)?.status==='VERIFIED').length,'panel targets only activated when verified');}}
assert.ok(queue.queue.every(x=>x.status!=='VERIFIED'||(x.mapping&&x.mapping.source&&x.mapping.dataset&&x.mapping.field_path&&x.mapping.aggregation&&x.mapping.unit!==undefined)),'verified target mappings complete');
fs.rmSync('grafana/dashboards/garmin-stats-d1-conversion-candidate.json',{force:true});
fs.rmSync('grafana/CONVERSION_ENGINE_QUEUE.json',{force:true});
console.log('PASS: source-faithful candidate generation, 62-panel preservation, stable 143-target queue, verified-only activation.');
