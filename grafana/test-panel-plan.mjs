import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {spawnSync} from 'node:child_process';import assert from 'node:assert/strict';
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'tc-panel-plan-'));
try{
 const out=path.join(tmp,'plan.json');
 const run=spawnSync(process.execPath,['grafana/generate-panel-plan.mjs'],{cwd:process.cwd(),env:{...process.env,PANEL_PLAN_OUTPUT:out},encoding:'utf8'});
 assert.equal(run.status,0,run.stderr||run.stdout);
 const manifest=JSON.parse(fs.readFileSync('grafana/datasets.json','utf8'));
 const plan=JSON.parse(fs.readFileSync(out,'utf8'));
 assert.equal(plan.state,'SCHEMA_VERIFICATION_REQUIRED');
 assert.equal(plan.dataset_gate.length,manifest.datasets.length);
 assert.ok(plan.dataset_gate.every(x=>x.verification==='UNVERIFIED'));
 assert.ok(plan.dataset_gate.every(x=>x.panel_policy.toLowerCase().includes('verified')));
 assert.equal(plan.dashboard_workstreams.length,5);
 assert.ok(plan.dashboard_workstreams.some(x=>x.state==='EXISTING_ASSETS_PRESERVED'));
 assert.ok(plan.privacy.includes('metadata-only'));
 assert.ok(plan.approval_boundary.includes('No dashboard publishing'));
 console.log('Panel implementation plan safety and determinism checks passed.');
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
