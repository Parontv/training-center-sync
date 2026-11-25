#!/usr/bin/env node
/**
 * Analyze a private /dashboard-schema audit file into a candidate metric map.
 * Usage: node grafana/analyze-live-schema.mjs grafana/live-schema-audit.json
 * This is heuristic: it does not assert coverage, units, or metric semantics.
 */
import fs from 'node:fs';
const input=process.argv[2];
if(!input){console.error('Usage: node grafana/analyze-live-schema.mjs <audit-json>');process.exit(2);}
const audit=JSON.parse(fs.readFileSync(input,'utf8'));
const categories=[
 {key:'sleep',terms:['sleep','sleeping','deep','rem','light','awake']},
 {key:'hrv',terms:['hrv','heart_rate_variability']},
 {key:'weight',terms:['weight','body_mass']},
 {key:'resting_hr',terms:['resting','restingheart']},
 {key:'steps',terms:['step','steps']},
 {key:'stress',terms:['stress']},
 {key:'training_load',terms:['trainingload','training_load','readiness','recovery','load']},
 {key:'respiration',terms:['respiration','breath']},
 {key:'spo2',terms:['spo2','oxygen','pulseox']},
 {key:'body_composition',terms:['bodyfat','body_fat','bodycomposition','body_composition','muscle']},
 {key:'hydration',terms:['hydration','water']},
 {key:'activities',terms:['activity','distance','duration','pace','calorie','sport']},
];
const result={generatedAt:audit.generatedAt||null,warning:'Heuristic candidates only; validate semantics and units manually before implementing endpoints.',metrics:[]};
for(const source of audit.sources||[]){
 for(const d of source.datasets||[]){
  for(const f of d.fields||[]){
   const path=String(f.path||'').toLowerCase(), ds=String(d.dataset||'').toLowerCase();
   const matches=categories.filter(c=>c.terms.some(t=>path.includes(t)||ds.includes(t)));
   if(!matches.length)continue;
   result.metrics.push({source:source.source,dataset:d.dataset,field_path:f.path,type:f.type,occurrences:f.occurrences,records_with_field:f.recordsWithField,sample:f.sample,candidate_metrics:matches.map(c=>c.key)});
  }
 }
}
result.metrics.sort((a,b)=>a.source.localeCompare(b.source)||a.dataset.localeCompare(b.dataset)||String(a.field_path).localeCompare(String(b.field_path)));
const out=process.env.CANDIDATES_OUTPUT||'grafana/metric-candidates.json';
fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');
console.log('Candidate map generated at '+out+'; inspect it locally and do not commit personal samples.');
