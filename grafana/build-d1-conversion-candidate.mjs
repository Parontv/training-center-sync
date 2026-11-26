#!/usr/bin/env node
/**
 * Deterministic Garmin Stats conversion scaffold.
 * Only VERIFIED mappings with an exact source, field path, aggregation and unit
 * are enabled. All other source targets are preserved in an inert queue.
 * This does not publish or deploy dashboards.
 */
import fs from 'node:fs';
const sourcePath='grafana/dashboards/garmin-original-clone.json';
const ledgerPath='grafana/FIELD_VALIDATION_LEDGER.json';
const outPath='grafana/dashboards/garmin-stats-d1-conversion-candidate.json';
const queuePath='grafana/CONVERSION_ENGINE_QUEUE.json';
const base=(process.env.WORKER_BASE_URL||'https://training-center-sync.listaconcerti.workers.dev').replace(/\/+$/,'');
const ds={type:'yesoreyeram-infinity-datasource',uid:'training-center-d1'};
const source=JSON.parse(fs.readFileSync(sourcePath,'utf8'));
const ledger=JSON.parse(fs.readFileSync(ledgerPath,'utf8'));
const clone=JSON.parse(JSON.stringify(source));
clone.id=null; clone.uid='garmin-stats-d1-conversion-candidate';
clone.title='Garmin Stats · D1 Conversion Candidate';
clone.version=1;
clone.description='Generated deterministically from source panel identity and field validation ledger. Only VERIFIED mapping entries are wired. Not a published dashboard.';
clone.__requires=(clone.__requires||[]).filter(x=>!(x.type==='datasource'&&x.id==='influxdb'));
if(!clone.__requires.some(x=>x.type==='datasource'&&x.id==='yesoreyeram-infinity-datasource'))clone.__requires.push({type:'datasource',id:'yesoreyeram-infinity-datasource',name:'Infinity',version:''});
const byKey=new Map(ledger.metrics.map(m=>[m.stableKey,m]));
const queue=[];
for(const panel of clone.panels||[]){
 const original=(panel.targets||[]);
 const converted=[];
 for(let i=0;i<original.length;i++){
  const key=panel.id+':'+i,entry=byKey.get(key);
  const mapping=entry?.mapping;
  const valid=entry?.status==='VERIFIED'&&mapping&&['daily_records','garmin_records'].includes(mapping.source)&&typeof mapping.dataset==='string'&&typeof mapping.field_path==='string'&&['avg','min','max','sum'].includes(mapping.aggregation)&&typeof mapping.unit==='string';
  if(valid){
   converted.push({refId:original[i].refId||String.fromCharCode(65+i),datasource:ds,type:'json',source:'url',url:base+'/dashboard-metrics',parser:'backend',format:'table',root_selector:'points',columns:[{selector:'date',text:'Date',type:'time'},{selector:'value',text:mapping.label||'Value',type:'number'}],queryParams:{source:mapping.source,dataset:mapping.dataset,field_path:mapping.field_path,aggregation:mapping.aggregation,from:'',to:''}});
   queue.push({stableKey:key,panelId:panel.id,targetIndex:i,status:'VERIFIED',mapping});
  }else queue.push({stableKey:key,panelId:panel.id,targetIndex:i,status:entry?.status||'UNAVAILABLE',reason:'Target remains inert until a complete verified mapping exists.'});
 }
 if(original.length){panel.targets=converted;panel.datasource=ds;panel.description=(panel.description||'')+' Generated candidate: only verified mappings are active.';}
}
fs.writeFileSync(outPath,JSON.stringify(clone,null,2)+'\n');
fs.writeFileSync(queuePath,JSON.stringify({generatedAt:new Date().toISOString(),sourceDashboard:source.title,sourceUid:source.uid,panelCount:clone.panels.length,targetCount:queue.length,enabledTargets:queue.filter(x=>x.status==='VERIFIED').length,queue},null,2)+'\n');
console.log('Conversion candidate generated; enabled targets='+queue.filter(x=>x.status==='VERIFIED').length+'/'+queue.length+'.');
