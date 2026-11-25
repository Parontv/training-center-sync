import fs from 'node:fs';
import assert from 'node:assert/strict';

// Structural contract check between the existing dashboards and /dashboard-data.
// This is static validation only; it does not replace a live Grafana UI test.
const contract = {
  counts: ['activities','activity_details','daily_records','garmin_records','sync_runs'],
  datasets: ['dataset','records','first_date','last_date','empty_records'],
  activities: ['activity_id','start_time_local','activity_type','activity_name','distance_m','duration_s','calories','average_hr','max_hr'],
  recentDailyRecords: ['record_date','dataset','updated_at'],
  'quality.activities': ['total','missing_date','missing_type','missing_distance','missing_duration','missing_average_hr','missing_max_hr','invalid_json'],
  'quality.garminRecords': ['total','empty_payloads','invalid_json']
};
const files=['grafana/dashboards/training-center-master.json','grafana/dashboards/training-center-overview.json'];
const expectedUids=['training-center-master','training-center-overview'];
for (let i=0;i<files.length;i++) {
 const d=JSON.parse(fs.readFileSync(files[i],'utf8'));
 assert.equal(d.uid,expectedUids[i]);
 const panels=d.panels||[];
 const ids=new Set();
 for(const p of panels){
  assert.ok(!ids.has(p.id),'duplicate panel ID '+p.id+' in '+files[i]); ids.add(p.id);
  for(const target of p.targets||[]){
   if(target.source!=='url'||target.type!=='json')continue;
   assert.ok(target.url?.endsWith('/dashboard-data'),'panel must target dashboard-data endpoint');
   assert.ok(Object.hasOwn(contract,target.root_selector),'unsupported root selector '+target.root_selector+' in panel '+p.title);
   const allowed=new Set(contract[target.root_selector]);
   for(const column of target.columns||[]){
    assert.ok(allowed.has(column.selector),'selector '+column.selector+' not in '+target.root_selector+' contract (panel '+p.title+')');
   }
  }
 }
}
console.log('Dashboard /dashboard-data contract checks passed (static, not live UI verification).');
