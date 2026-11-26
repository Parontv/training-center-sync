#!/usr/bin/env node
// Prioritize the 143 targets for manual semantic validation and guarded conversion.
import fs from 'node:fs';
const inventory=JSON.parse(fs.readFileSync('grafana/PROGRESSIVE_CONVERSION_PHASES.json','utf8'));
const matches=fs.existsSync('grafana/FIELD_MATCH_SUGGESTIONS.json')?JSON.parse(fs.readFileSync('grafana/FIELD_MATCH_SUGGESTIONS.json','utf8')):{targets:[]};
const byKey=new Map((matches.targets||[]).map(x=>[x.stableKey,x]));
const simple=t=>{const q=t.sourceQueryReference||{};return !q.rawQuery&&Array.isArray(q.select)&&q.select.length===1&&!q.groupBy?.some(x=>x.type==='tag')};
const plan=(inventory.targets||[]).map(t=>{
 const q=t.sourceQueryReference||{},m=byKey.get(t.stableKey);
 const top=m?.suggestions?.[0]||null;
 const tier=t.classification==='A'?'CORE':t.classification==='B'?'SECONDARY':'EXPERIMENTAL';
 const complexity=q.rawQuery?'RAW_QUERY_REVIEW':simple(t)?'SIMPLE_FIELD_AGGREGATION':'COMPLEX_QUERY_REVIEW';
 const priorityBucket=(tier==='CORE'?0:tier==='SECONDARY'?10:20)+(q.rawQuery?5:complexity==='SIMPLE_FIELD_AGGREGATION'?0:2);
 const priorityLabel=tier+'_'+(q.rawQuery?'RAW':complexity==='SIMPLE_FIELD_AGGREGATION'?'SIMPLE':'COMPLEX');
 return {stableKey:t.stableKey,panelId:t.panelId,panelTitle:t.panelTitle,targetIndex:t.targetIndex,classification:t.classification,tier,priorityBucket,priorityLabel,complexity,sourceMeasurement:q.measurement||null,sourceField:q.field||null,alias:q.alias||null,suggestionCount:m?.suggestions?.length||0,bestSuggestion:top,validationStatus:'NOT_VERIFIED'};
}).sort((a,b)=>a.priorityBucket-b.priorityBucket||a.panelId-b.panelId||a.targetIndex-b.targetIndex);
const out={generatedAt:new Date().toISOString(),targetCount:plan.length,counts:{core:plan.filter(x=>x.tier==='CORE').length,secondary:plan.filter(x=>x.tier==='SECONDARY').length,experimental:plan.filter(x=>x.tier==='EXPERIMENTAL').length,rawQuery:plan.filter(x=>x.complexity==='RAW_QUERY_REVIEW').length,simple:plan.filter(x=>x.complexity==='SIMPLE_FIELD_AGGREGATION').length,complex:plan.filter(x=>x.complexity==='COMPLEX_QUERY_REVIEW').length},policy:'Priority is a work order, not verification. All targets remain unverified.',targets:plan};
fs.writeFileSync('grafana/CONVERSION_PRIORITY_PLAN.json',JSON.stringify(out,null,2)+'\n');
console.log('Priority plan generated for '+plan.length+' targets.');
