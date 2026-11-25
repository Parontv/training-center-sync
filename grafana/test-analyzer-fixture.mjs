import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'tc-analyzer-'));
try{
 const audit=path.join(tmp,'audit.json'),out=path.join(tmp,'candidates.json');
 fs.writeFileSync(audit,JSON.stringify({generatedAt:'test',garmin_records:[{dataset:'sleep',field_path:'$.sleep.duration',sample:'PRIVATE_SLEEP_SAMPLE'},{dataset:'misc',field_path:'$.misc.note'}],daily_records:[{dataset:'hrv',field_path:'$.hrv'}]}));
 const run=spawnSync(process.execPath,['grafana/analyze-live-schema.mjs',audit],{cwd:process.cwd(),env:{...process.env,CANDIDATES_OUTPUT:out},encoding:'utf8'});
 assert.equal(run.status,0,run.stderr||run.stdout);
 const parsed=JSON.parse(fs.readFileSync(out,'utf8'));
 assert.equal(parsed.metrics.length,2,'unmatched fields should be omitted from heuristic candidates');
 assert.ok(parsed.metrics.some(x=>x.source==='garmin_records'&&x.candidate_metrics.includes('sleep')));
 assert.ok(parsed.metrics.some(x=>x.source==='daily_records'&&x.candidate_metrics.includes('hrv')));
 assert.ok(parsed.warning.includes('Heuristic'));
 assert.ok(!JSON.stringify(parsed).includes('PRIVATE_SLEEP_SAMPLE'),'analyzer output must omit raw samples');
 assert.ok(parsed.metrics.every(x=>!Object.hasOwn(x,'sample')&&!Object.hasOwn(x,'example')),'output must be metadata-only');
 assert.ok(!parsed.metrics.some(x=>x.dataset==='misc'),'non-metric dataset should not be classified');
 const empty=path.join(tmp,'empty.json');fs.writeFileSync(empty,JSON.stringify({garmin_records:[],daily_records:[]}));
 const out2=path.join(tmp,'empty-candidates.json');
 const run2=spawnSync(process.execPath,['grafana/analyze-live-schema.mjs',empty],{cwd:process.cwd(),env:{...process.env,CANDIDATES_OUTPUT:out2},encoding:'utf8'});
 assert.equal(run2.status,0,run2.stderr||run2.stdout);
 assert.deepEqual(JSON.parse(fs.readFileSync(out2,'utf8')).metrics,[]);
 console.log('Analyzer fixture tests passed.');
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
