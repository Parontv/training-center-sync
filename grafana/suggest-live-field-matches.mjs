#!/usr/bin/env node
// Offline deterministic candidate matching. Heuristic only: never verifies mappings.
import fs from 'node:fs';
const inventory=JSON.parse(fs.readFileSync('grafana/PROGRESSIVE_CONVERSION_PHASES.json','utf8'));
const schemaPath='grafana/live-schema-snapshot.json';
const schema=fs.existsSync(schemaPath)?JSON.parse(fs.readFileSync(schemaPath,'utf8')):{garmin_records:[],daily_records:[]};
const rows=[...(schema.garmin_records||[]).map(x=>({...x,source:'garmin_records'})),...(schema.daily_records||[]).map(x=>({...x,source:'daily_records'}))];
const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const words=s=>String(s||'').toLowerCase().match(/[a-z0-9]+/g)||[];
function queryTokens(q){
 const text=[q.measurement,q.field,q.alias,q.query].filter(Boolean).join(' ');
 const extracted=(text.match(/["']([A-Za-z0-9_]+)["']/g)||[]).map(x=>x.replace(/["']/g,''));
 return [...new Set([...words(text),...extracted].map(norm).filter(x=>x.length>=3))];
}
const result=[];
for(const t of inventory.targets||[]){
 const q=t.sourceQueryReference||{},tokens=queryTokens(q);
 const titleTokens=words(t.panelTitle).map(norm).filter(x=>x.length>=3);
 const ranked=rows.map(r=>{
  const path=norm(r.field_path),dataset=norm(r.dataset),hay=path+' '+dataset;
  let score=0,matched=[];
  for(const token of tokens){if(!token)continue;
   if(path===token){score+=90;matched.push(token+' exact-path');}
   else if(path.includes(token)){score+=25;matched.push(token+' path');}
   else if(dataset===token){score+=40;matched.push(token+' exact-dataset');}
   else if(dataset.includes(token)){score+=10;matched.push(token+' dataset');}
  }
  for(const token of titleTokens){if(hay.includes(token)){score+=6;matched.push(token+' title');}}
  return {r,score,matched};
 }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||String(a.r.field_path).localeCompare(String(b.r.field_path))).slice(0,5);
 result.push({stableKey:t.stableKey,panelId:t.panelId,panelTitle:t.panelTitle,targetIndex:t.targetIndex,classification:t.classification,sourceReference:{measurement:q.measurement||null,field:q.field||null,alias:q.alias||null},status:'SUGGESTIONS_ONLY_NOT_VERIFIED',suggestions:ranked.map(({r,score,matched})=>({source:r.source,dataset:r.dataset,field_path:r.field_path,value_type:r.value_type,occurrences:r.occurrences,records_with_field:r.records_with_field,score,matchedSignals:matched}))});
}
const out={generatedAt:new Date().toISOString(),snapshotGeneratedAt:schema.generatedAt||null,targets:result,totalTargets:result.length,targetsWithSuggestions:result.filter(x=>x.suggestions.length).length,policy:'Heuristic ranking only. Never mark mappings verified or write to the validation ledger.'};
fs.writeFileSync('grafana/FIELD_MATCH_SUGGESTIONS.json',JSON.stringify(out,null,2)+'\n');
console.log('Heuristic field suggestions generated: '+out.targetsWithSuggestions+'/'+out.totalTargets+'.');
