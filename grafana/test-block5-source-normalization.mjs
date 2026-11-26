import fs from 'node:fs';
import assert from 'node:assert/strict';
const src=JSON.parse(fs.readFileSync('grafana/dashboards/garmin-original-clone.json','utf8'));
const targets=[];
for(const p of src.panels||[])for(let i=0;i<(p.targets||[]).length;i++){
 const t=p.targets[i],sels=(t.select||[]).flat(),field=sels.find(x=>x.type==='field')?.params?.[0]||null, funcs=sels.filter(x=>['mean','last','min','max','sum','count','median'].includes(x.type)).map(x=>x.type);
 targets.push({stableKey:p.id+':'+i,panelId:p.id,panelTitle:p.title,targetIndex:i,refId:t.refId||null,measurement:t.measurement||null,fieldCandidate:field,functions:funcs,rawQuery:!!t.rawQuery,queryText:t.query||null,tags:t.tags||[],groupBy:t.groupBy||[],alias:t.alias||null});
}
assert.equal(targets.length,143);
assert.equal(new Set(targets.map(x=>x.stableKey)).size,143);
const out={generatedAt:'2026-11-26',sourceDashboard:src.title||'Garmin Stats',panelCount:src.panels.length,targetCount:targets.length,policy:'Source query descriptors are extracted faithfully. Influx measurement names/fields are not equated with D1 datasets without separate evidence.',targets};
fs.writeFileSync('grafana/SOURCE_QUERY_NORMALIZATION.json',JSON.stringify(out,null,2)+'\n');
const counts={simpleField:targets.filter(t=>t.fieldCandidate&&!t.rawQuery).length,rawQuery:targets.filter(t=>t.rawQuery).length,measurementMissing:targets.filter(t=>!t.measurement).length,fieldMissing:targets.filter(t=>!t.fieldCandidate).length};
fs.writeFileSync('grafana/SOURCE_QUERY_NORMALIZATION_SUMMARY.json',JSON.stringify(counts,null,2)+'\n');
console.log('PASS: extracted '+targets.length+' source target descriptors; '+JSON.stringify(counts));
