import fs from 'node:fs'; import assert from 'node:assert/strict';
const files=['grafana/dashboards/training-center-master.json','grafana/dashboards/training-center-overview.json'];
const expected=['training-center-master','training-center-overview'];
const trustedBase='https://training-center-sync.listaconcerti.workers.dev/dashboard-data';
for(let i=0;i<files.length;i++){
 const d=JSON.parse(fs.readFileSync(files[i],'utf8'));
 assert.equal(d.uid,expected[i],files[i]+' stable UID');
 assert.ok(Array.isArray(d.panels)&&d.panels.length>0,files[i]+' has panels');
 const ids=[],urls=[];
 function walk(panels){for(const p of panels||[]){if(p.id!==undefined)ids.push(p.id);for(const t of p.targets||[])if(t.url)urls.push(t.url);walk(p.panels);}}
 walk(d.panels);
 assert.equal(new Set(ids).size,ids.length,files[i]+' unique panel IDs recursively');
 for(const url of urls){assert.equal(url,trustedBase,'panel URLs must use the known read-only dashboard endpoint');assert.ok(!url.includes('SYNC_BEARER_TOKEN')&&!url.includes('Bearer '),'no token in panel URL');}
 for(const p of d.panels) if(p.datasource?.uid)assert.equal(p.datasource.uid,'training-center-d1',files[i]+' datasource UID consistency');
}
const generator=fs.readFileSync('grafana/build-dashboards.mjs','utf8');
assert.ok(generator.includes("uid:'training-center-d1'"),'generated dashboard datasource UID must match reused dashboard datasource UID');
const readme=fs.readFileSync('grafana/README.md','utf8');
assert.ok(readme.includes('Bearer')&&readme.includes('secure/custom HTTP headers'),'datasource auth setup must be documented');
assert.ok(readme.includes('Do not put the token into dashboard JSON'),'token handling safeguards documented');
console.log('Existing dashboard asset integrity checks passed.');


// Additional dashboard invariants: grid bounds, stable target refs, and non-empty titles.
for(const file of files){
 const d=JSON.parse(fs.readFileSync(file,'utf8'));
 function check(panels){
  for(const p of panels||[]){
   assert.ok(typeof p.title==='string'&&p.title.trim(),file+' panel title');
   if(p.gridPos){assert.ok(p.gridPos.w>0&&p.gridPos.h>0,file+' positive panel dimensions');assert.ok(p.gridPos.x>=0&&p.gridPos.y>=0,file+' nonnegative grid position');assert.ok(p.gridPos.x+p.gridPos.w<=24,file+' panel fits 24-column grid');}
   const refs=(p.targets||[]).map(t=>t.refId);
   assert.equal(new Set(refs).size,refs.length,file+' target ref IDs unique per panel');
   for(const t of p.targets||[]){assert.ok(t.refId,file+' target has refId');assert.ok(t.root_selector,file+' target selector');}
   check(p.panels);
  }
 }
 check(d.panels);
}
