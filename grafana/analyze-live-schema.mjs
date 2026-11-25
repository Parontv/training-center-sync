#!/usr/bin/env node
/**
 * Heuristically map the flat /dashboard-schema response into metric candidates.
 * Usage: node grafana/analyze-live-schema.mjs audit.json
 */
import fs from 'node:fs';
const file=process.argv[2];if(!file){console.error('Usage: node grafana/analyze-live-schema.mjs <audit.json>');process.exit(2);}
const a=JSON.parse(fs.readFileSync(file,'utf8'));
const groups=[
['sleep',['sleep','deep','rem','light','awake']],['hrv',['hrv','heart_rate_variability']],['weight',['weight','body_mass']],['resting_hr',['restingheart','resting_heart_rate']],['steps',['step']],['stress',['stress']],['training_load',['trainingload','training_load','readiness','recovery','load']],['respiration',['respiration','breath']],['spo2',['spo2','oxygen','pulseox']],['body_composition',['bodyfat','body_fat','bodycomposition','body_composition','muscle']],['hydration',['hydration','water']],['activities',['activity','distance','duration','pace','calorie','sport']]
];
const rows=[];
for(const [source,list] of [['garmin_records',a.garmin_records||[]],['daily_records',a.daily_records||[]]])for(const f of list){
 const text=(String(f.dataset)+' '+String(f.field_path)).toLowerCase();
 const matches=groups.filter(([,terms])=>terms.some(t=>text.includes(t))).map(([key])=>key);
 if(matches.length)rows.push({...f,source,candidate_metrics:matches});
}
const out={generatedAt:a.generatedAt||null,warning:'Heuristic field candidates. Semantics, units, dates, and coverage require verification.',metrics:rows};
const dest=process.env.CANDIDATES_OUTPUT||'grafana/metric-candidates.json';fs.writeFileSync(dest,JSON.stringify(out,null,2)+'\n');
console.log('Candidate map saved to '+dest+' (keep private; may contain Garmin samples).');
