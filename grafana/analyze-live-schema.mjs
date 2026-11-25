#!/usr/bin/env node
/**
 * Heuristically map the flat /dashboard-schema response into metric candidates.
 * Usage: node grafana/analyze-live-schema.mjs audit.json
 * Output intentionally omits samples/raw values to reduce accidental exposure.
 */
import fs from 'node:fs';
const file=process.argv[2];
if(!file){console.error('Usage: node grafana/analyze-live-schema.mjs <audit.json>');process.exit(2);}
let a;
try { a=JSON.parse(fs.readFileSync(file,'utf8')); }
catch { console.error('Input must be valid JSON.'); process.exit(2); }
if(!a||typeof a!=='object'||Array.isArray(a)){console.error('Audit JSON must be an object.');process.exit(2);}
const groups=[
['sleep',['sleep','deep','rem','light','awake']],['hrv',['hrv','heart_rate_variability']],['weight',['weight','body_mass']],['resting_hr',['restingheart','resting_heart_rate']],['steps',['step']],['stress',['stress']],['training_load',['trainingload','training_load','readiness','recovery','load']],['respiration',['respiration','breath']],['spo2',['spo2','oxygen','pulseox']],['body_composition',['bodyfat','body_fat','bodycomposition','body_composition','muscle']],['hydration',['hydration','water']],['activities',['activity','distance','duration','pace','calorie','sport']]
];
const rows=[];
const numericTypes=new Set(['integer','real','number','numeric']);
for(const [source,list] of [['garmin_records',a.garmin_records||[]],['daily_records',a.daily_records||[]]]) {
 if(!Array.isArray(list)){console.error(source+' must be an array.');process.exit(2);}
 for(const f of list){
  if(!f||typeof f!=='object')continue;
  const text=(String(f.dataset)+' '+String(f.field_path)).toLowerCase();
  const matches=groups.filter(([,terms])=>terms.some(t=>text.includes(t))).map(([key])=>key);
  if(matches.length){
   // Whitelist metadata only; do not carry audit sample values into output.
   const valueType=String(f.value_type??f.type??'unknown').toLowerCase();
   const numeric=numericTypes.has(valueType);
   const occurrence=Number(f.occurrences??f.count??0);
   rows.push({dataset:f.dataset??null,field_path:f.field_path??null,value_type:valueType,occurrences:occurrence,records_with_field:f.records_with_field??f.recordsWithField??null,source,candidate_metrics:matches,review_priority:numeric?'NUMERIC_REVIEW':'SEMANTIC_REVIEW',numeric_series_candidate:numeric,verification_status:'UNVERIFIED',review_note:numeric?'Numeric field: inspect unit, date semantics and aggregation before charting.':'Non-numeric or unknown type: review semantics before charting.'});
  }
 }
}
const out={generatedAt:a.generatedAt||null,warning:'Heuristic field candidates. Semantics, units, dates, and coverage require verification. Raw sample values are omitted.', summary:{totalCandidates:rows.length,numericCandidates:rows.filter(x=>x.numeric_series_candidate).length,semanticReview:rows.filter(x=>!x.numeric_series_candidate).length},metrics:rows};
const dest=process.env.CANDIDATES_OUTPUT||'grafana/metric-candidates.json';fs.writeFileSync(dest,JSON.stringify(out,null,2)+'\\n');
console.log('Candidate map saved to '+dest+' (metadata only; keep private).');
