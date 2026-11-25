#!/usr/bin/env node
import fs from 'node:fs';
const p=process.argv[2];if(!p)throw new Error('Usage: validate-live-schema.js schema.json');
const s=JSON.parse(fs.readFileSync(p,'utf8'));
const arrays=['garmin_records','daily_records'];
for(const k of arrays){if(!Array.isArray(s[k]))throw new Error('Schema missing array '+k);}
const fields=[...s.garmin_records.map(x=>({...x,source:'garmin_records'})),...s.daily_records.map(x=>({...x,source:'daily_records'}))];
if(!fields.length)throw new Error('Schema has zero fields');
const keys=new Set();
for(const f of fields){if(!f.dataset||!f.field_path)throw new Error('Field entry missing dataset or field_path');keys.add(f.source+'|'+f.dataset+'|'+f.field_path);}
const numeric=new Set(['integer','real','number','numeric']);
const counts={fields:fields.length,uniqueFields:keys.size, numeric:fields.filter(f=>numeric.has(String(f.value_type||f.type||'').toLowerCase())).length,nonNumeric:fields.filter(f=>!numeric.has(String(f.value_type||f.type||'').toLowerCase())).length,datasets:[...new Set(fields.map(f=>f.dataset))].length,sourceCounts:{garmin_records:s.garmin_records.length,daily_records:s.daily_records.length}};
if(!counts.numeric)throw new Error('No numeric field candidates: inspect schema type metadata');
console.log('LIVE SCHEMA SHAPE PASS '+JSON.stringify(counts));
