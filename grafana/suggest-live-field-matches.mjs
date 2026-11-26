#!/usr/bin/env node
// Offline, deterministic fuzzy field matching aid. It NEVER marks mappings VERIFIED.
import fs from 'node:fs';
const ledger=JSON.parse(fs.readFileSync('grafana/PROGRESSIVE_CONVERSION_PHASES.json','utf8'));
const schemaPath='grafana/live-schema-snapshot.json';
if(!fs.existsSync(schemaPath)){console.log('No live snapshot yet; producing an empty evidence-aware report.');}
const schema=fs.existsSync(schemaPath)?JSON.parse(fs.readFileSync(schemaPath,'utf8')):{garmin_records:[],daily_records:[]};
const rows=[...(schema.garmin_records||[]).map(x=>({...x,source:'garmin_records'})),...(schema.daily_records||[]).map(x=>({...x,source:'daily_records'}))];
const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const result=[];
for(const t of ledger.targets||[]){
 const q=t.sourceQueryReference||{};
 const wanted=[q.measurement,q.field,q.alias].filter(Boolean).map(norm);
 const ranked=rows.map(r=>{
  const path=norm(r.field_path),dataset=norm(r.dataset);
  let score=0;
  for(const w of wanted){if(!w)continue;if(path===w)score+=100;else if(path.includes(w)||w.includes(path))score+=35;else if(dataset.includes(w))score+=10;}
  if(q.field&&path===norm(q.field))score+=80;
  if(q.measurement&&dataset===norm(q.measurement))score+=60;
  return {r,score};
 }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,5);
 result.push({stableKey:t.stableKey,panelId:t.panelId,panelTitle:t.panelTitle,targetIndex:t.targetIndex,classification:t.classification,sourceReference:{measurement:q.measurement||null,field:q.field||null,alias:q.alias||null},status:'SUGGESTIONS_ONLY_NOT_VERIFIED',suggestions:ranked.map(({r,score})=>({source:r.source,dataset:r.dataset,field_path:r.field_path,value_type:r.value_type,occurrences:r.occurrences,records_with_field:r.records_with_field,score}))});
}
const out={generatedAt:new Date().toISOString(),snapshotGeneratedAt:schema.generatedAt||null,targets:result,totalTargets:result.length,targetsWithSuggestions:result.filter(x=>x.suggestions.length).length,policy:'Suggestions are heuristic only. No target or mapping is automatically verified.'};
fs.writeFileSync('grafana/FIELD_MATCH_SUGGESTIONS.json',JSON.stringify(out,null,2)+'\n');
console.log('Generated heuristic field suggestions: '+out.targetsWithSuggestions+'/'+out.totalTargets+'.');
