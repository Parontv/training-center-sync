#!/usr/bin/env node
// Fetch authenticated D1 schema and publish a sanitized snapshot.
// Only field paths, types, occurrence/coverage counts are retained; raw examples are discarded.
const base=(process.env.WORKER_BASE_URL||'https://training-center-sync.listaconcerti.workers.dev').replace(/\/+$/,'');
const token=process.env.SYNC_BEARER_TOKEN;
if(!token)throw new Error('SYNC_BEARER_TOKEN secret is missing');
const res=await fetch(base+'/dashboard-schema',{headers:{Authorization:'Bearer '+token},cache:'no-store'});
if(!res.ok){const errorBody=await res.json().catch(()=>null);const reason=String(errorBody?.error||errorBody?.message||'no structured error').slice(0,200);throw new Error('Schema endpoint returned HTTP '+res.status+' ('+reason+')');}
const data=await res.json();
if(!data.ok)throw new Error('Schema endpoint response was not ok');
const sanitize=(rows)=>(rows||[]).map(({dataset,field_path,value_type,occurrences,records_with_field})=>({dataset,field_path,value_type,occurrences,records_with_field}));
const output={generatedAt:data.generatedAt||new Date().toISOString(),readOnly:true,privacy:"Field metadata only; value examples and raw record contents removed.",totals:data.totals||{},garmin_records:sanitize(data.garmin_records),daily_records:sanitize(data.daily_records)};
import fs from 'node:fs';
fs.writeFileSync('grafana/live-schema-snapshot.json',JSON.stringify(output,null,2)+'\n');
console.log('Sanitized live schema snapshot generated.');
