#!/usr/bin/env node
/**
 * Authenticated, read-only coverage probes for a conservative core metric shortlist.
 * Only sanitized coverage metadata is written. Raw values are never retained.
 */
import fs from 'node:fs';
const token=process.env.SYNC_BEARER_TOKEN;
const base=(process.env.WORKER_BASE||'https://training-center-sync.listaconcerti.workers.dev').replace(/\/+$/,'');
if(!token){console.error('Missing SYNC_BEARER_TOKEN.');process.exit(2);}
const audit=JSON.parse(fs.readFileSync('grafana/live-schema-audit.json','utf8'));
const schema=[...(audit.daily_records||[]).map(x=>({...x,source:'daily_records'})),...(audit.garmin_records||[]).map(x=>({...x,source:'garmin_records'}))];
const shortlist=[
 ['daily_records','daily_summaries','$.movement.steps.value'],
 ['daily_records','daily_summaries','$.movement.steps.distanceInMeters'],
 ['daily_records','daily_summaries','$.calories.burnedTotal'],
 ['daily_records','daily_summaries','$.heartRate.restingValue'],
 ['daily_records','daily_summaries','$.heartRate.maxValue'],
 ['daily_records','daily_summaries','$.bodyBattery.latestValue'],
 ['daily_records','daily_summaries','$.stress.avgLevel'],
 ['daily_records','daily_summaries','$.intensityMinutes.vigorous'],
 ['daily_records','steps','$.totalSteps'],
 ['daily_records','steps','$.totalDistance'],
 ['daily_records','sleep','$.deepSleepSeconds'],
 ['daily_records','sleep','$.lightSleepSeconds'],
 ['daily_records','sleep','$.remSleepSeconds'],
 ['daily_records','sleep','$.sleepTimeSeconds'],
 ['daily_records','stress','$.values.overallStressLevel'],
 ['daily_records','weight','$.dailyWeightSummaries[0].latestWeight.weight'],
 ['daily_records','weight','$.dailyWeightSummaries[0].latestWeight.bodyFat'],
 ['daily_records','fitness_age','$.chronologicalAge']
];
const present=(src,ds,path)=>schema.some(x=>x.source===src&&x.dataset===ds&&x.field_path===path&&['integer','real','number','numeric'].includes(String(x.value_type).toLowerCase()));
const candidates=shortlist.filter(([src,ds,path])=>present(src,ds,path));
const rows=[];
for(const [source,dataset,field_path] of candidates){
 const params=new URLSearchParams({source,dataset,field_path});
 const url=base+'/dashboard-field-coverage?'+params.toString();
 try{
  const res=await fetch(url,{headers:{Authorization:'Bearer '+token},cache:'no-store'});
  if(!res.ok){rows.push({source,dataset,field_path,status:'HTTP_ERROR',httpStatus:res.status});continue;}
  const body=await res.json();
  const safe={source,dataset,field_path,status:'OK'};
  // Keep only aggregate coverage metadata; deliberately discard samples/values.
  for(const key of ['recordCount','recordsWithField','distinctDatesWithField','coverage','dateFrom','dateTo','datasetDateFrom','datasetDateTo','valueType','typeCounts']) if(body[key]!==undefined)safe[key]=body[key];
  if(body.ok===false)safe.status='API_ERROR';
  rows.push(safe);
 }catch(e){rows.push({source,dataset,field_path,status:'REQUEST_ERROR'});}
}
const report={generatedAt:new Date().toISOString(),readOnly:true,probesRequested:shortlist.length,probesMatchedSchema:candidates.length,success:rows.filter(x=>x.status==='OK').length,results:rows,warning:'Coverage is evidence of presence/date coverage only. It does not verify semantics, units, aggregation or chart suitability.'};
fs.writeFileSync('grafana/core-field-coverage-sanitized.json',JSON.stringify(report,null,2)+'\n');
console.log('Core field coverage probes completed: '+report.success+'/'+rows.length+' successful; sanitized metadata only.');
