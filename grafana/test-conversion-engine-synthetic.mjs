import fs from 'node:fs';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';
const ledgerPath='grafana/FIELD_VALIDATION_LEDGER.json', candidatePath='grafana/dashboards/garmin-stats-d1-conversion-candidate.json',queuePath='grafana/CONVERSION_ENGINE_QUEUE.json';
const originalLedger=fs.readFileSync(ledgerPath,'utf8'),originalCandidate=fs.existsSync(candidatePath)?fs.readFileSync(candidatePath,'utf8'):null,originalQueue=fs.existsSync(queuePath)?fs.readFileSync(queuePath,'utf8'):null;
try{
 const ledger=JSON.parse(originalLedger);
 const target=ledger.metrics.find(x=>x.stableKey==='30:0');
 assert.ok(target,'fixture target 30:0 must exist');
 target.status='VERIFIED';target.mapping={source:'daily_records',dataset:'daily_records',field_path:'totalSteps',aggregation:'sum',unit:'steps',label:'Steps'};
 fs.writeFileSync(ledgerPath,JSON.stringify(ledger,null,2));
 const run=spawnSync(process.execPath,['grafana/build-d1-conversion-candidate.mjs'],{encoding:'utf8'});
 assert.equal(run.status,0,run.stderr||run.stdout);
 const dashboard=JSON.parse(fs.readFileSync(candidatePath,'utf8')),queue=JSON.parse(fs.readFileSync(queuePath,'utf8'));
 const panel=dashboard.panels.find(p=>p.id===30);
 assert.ok(panel,'panel 30 exists');
 assert.equal(panel.targets.length,1,'only the verified target should be wired');
 assert.equal(panel.targets[0].url.endsWith('/dashboard-metrics'),true);
 assert.equal(panel.targets[0].queryParams.field_path,'totalSteps');
 assert.equal(queue.enabledTargets,1,'fixture should activate exactly one target');
 assert.equal(queue.targetCount,143);
 const inert=dashboard.panels.filter(p=>(p.targets||[]).length>0).flatMap(p=>p.targets||[]);
 assert.equal(inert.length,1,'no unverified target may be wired');
 console.log('Synthetic conversion-engine test passed: one verified fixture target enabled, all others inert.');
}finally{
 fs.writeFileSync(ledgerPath,originalLedger);
 if(originalCandidate===null)fs.rmSync(candidatePath,{force:true});else fs.writeFileSync(candidatePath,originalCandidate);
 if(originalQueue===null)fs.rmSync(queuePath,{force:true});else fs.writeFileSync(queuePath,originalQueue);
}
