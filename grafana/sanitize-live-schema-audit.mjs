#!/usr/bin/env node
// Convert private raw audit to a sanitized field snapshot. No samples/raw values are copied.
import fs from 'node:fs';
const input=process.argv[2]||'grafana/live-schema-audit.json';
const raw=JSON.parse(fs.readFileSync(input,'utf8'));
const sanitize=rows=>(rows||[]).map(({dataset,field_path,value_type,occurrences,records_with_field})=>({dataset,field_path,value_type,occurrences,records_with_field}));
const out={generatedAt:raw.generatedAt||new Date().toISOString(),readOnly:true,totals:raw.totals||{},garmin_records:sanitize(raw.garmin_records),daily_records:sanitize(raw.daily_records)};
fs.writeFileSync('grafana/live-schema-snapshot.json',JSON.stringify(out,null,2)+'\n');
console.log('Sanitized field snapshot created.');
