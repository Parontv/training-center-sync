import fs from 'node:fs'; import assert from 'node:assert/strict';
const files=['grafana/dashboards/training-center-master.json','grafana/dashboards/training-center-overview.json'];
const expected=['training-center-master','training-center-overview'];
for(let i=0;i<files.length;i++){
 const d=JSON.parse(fs.readFileSync(files[i],'utf8'));
 assert.equal(d.uid,expected[i],files[i]+' stable UID');
 assert.ok(Array.isArray(d.panels)&&d.panels.length>0,files[i]+' has panels');
 const ids=d.panels.map(p=>p.id).filter(x=>x!==undefined);
 assert.equal(new Set(ids).size,ids.length,files[i]+' unique panel IDs');
 for(const p of d.panels) for(const t of p.targets||[]){ if(t.url) assert.ok(!t.url.includes('SYNC_BEARER_TOKEN')&&!t.url.includes('Bearer '),'no token in panel URL');}
}
const generator=fs.readFileSync('grafana/build-dashboards.mjs','utf8');\nassert.ok(generator.includes(\"uid:'training-center-d1'\"),'generated dashboard datasource UID must match reused dashboard datasource UID');\nfor(const file of files){const dashboard=JSON.parse(fs.readFileSync(file,'utf8'));for(const panel of dashboard.panels)if(panel.datasource?.uid)assert.equal(panel.datasource.uid,'training-center-d1',file+' datasource UID consistency');}\nconsole.log('Existing dashboard asset integrity checks passed.');
