#!/usr/bin/env node
import fs from 'node:fs';
const input=process.argv[2] || 'grafana/metric-candidates.json';
const candidates=JSON.parse(fs.readFileSync(input,'utf8'));
const preview=process.env.PREVIEW_MODE==='true';
const numeric=(candidates.metrics||[]).filter(m=>m.numeric_series_candidate&&m.source&&m.dataset&&m.field_path);
const baseRaw=process.env.WORKER_BASE_URL||'https://training-center-sync.listaconcerti.workers.dev';
const base=baseRaw.endsWith('/')?baseRaw.slice(0,-1):baseRaw;
const panels=[];
let id=1;
for(const m of numeric.slice(0,48)){
 const title=m.dataset+' · '+m.field_path;
 const params=new URLSearchParams({source:m.source,dataset:m.dataset,field_path:m.field_path,aggregation:'avg',limit:'366'});
 panels.push({id:id++,type:'timeseries',title,description:'AUTO-CANDIDATE: field discovered in schema. Unit, semantics and aggregation require review.',gridPos:{h:8,w:12,x:((id-2)%2)*12,y:Math.floor((id-2)/2)*8},datasource:{type:'yesoreyeram-infinity-datasource',uid:'training-center-d1'},targets:[{refId:'A',type:'json',source:'url',url:base+'/dashboard-metrics?'+params.toString(),method:'GET',parser:'backend',format:'table',root_selector:'points',columns:[{selector:'date',text:'date',type:'string'},{selector:'value',text:'value',type:'number'},{selector:'samples',text:'samples',type:'number'}]}]});
}
const dash={id:null,uid:'garmin-live-candidate',title:preview?'Garmin · VISUAL PREVIEW (illustrative)':'Garmin · Live metric candidates',tags:['garmin','generated','candidate','review-required',...(preview?['preview-only']:[])],schemaVersion:39,version:1,refresh:'15m',timezone:'browser',time:{from:'now-90d',to:'now'},annotations:{list:[]},panels};
fs.mkdirSync('grafana/generated',{recursive:true});
fs.writeFileSync('grafana/generated/garmin-live-candidate.json',JSON.stringify(dash,null,2)+'\n');
console.log('Generated '+panels.length+' candidate panels; not semantically verified.');
