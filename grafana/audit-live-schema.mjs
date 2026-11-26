#!/usr/bin/env node
/**
 * Read-only live D1 schema/coverage audit for Grafana.
 * Usage: WORKER_BASE_URL=https://... SYNC_BEARER_TOKEN=... node grafana/audit-live-schema.mjs
 * No writes, deployments, or secret logging. Output contains schema metadata only.
 */
import fs from 'node:fs';
const base=process.env.WORKER_BASE_URL?.trim();
const token=process.env.SYNC_BEARER_TOKEN?.trim();
if(!base||!token){console.error('Set WORKER_BASE_URL and SYNC_BEARER_TOKEN in environment.');process.exit(2);}
if(!/^https:\/\//i.test(base)){console.error('WORKER_BASE_URL must use HTTPS.');process.exit(2);}
const url=new URL('/dashboard-schema',base);
const res=await fetch(url,{headers:{Authorization:'Bearer '+token,Accept:'application/json'},signal:AbortSignal.timeout(30000)});
if(!res.ok){console.error('Schema endpoint returned HTTP '+res.status+'. Token and URL may need verification.');process.exit(1);}
const data=await res.json();
if(!data.ok){console.error('Endpoint returned an unsuccessful schema response.');process.exit(1);}
const groups=[['garmin_records',data.garmin_records||[]],['daily_records',data.daily_records||[]]];
const report={generatedAt:data.generatedAt||new Date().toISOString(),totals:data.totals||{},sources:[]};
for(const [source,rows] of groups){
 const datasets=new Map();
 for(const r of rows){
  const ds=r.dataset||'unknown';
  if(!datasets.has(ds))datasets.set(ds,{dataset:ds,fields:[]});
  datasets.get(ds).fields.push({path:r.field_path||r.fullkey||r.full_key||null,type:r.value_type||r.type||null,occurrences:r.occurrences??r.count??null,recordsWithField:r.records_with_field??r.recordsWithField??null,sample:r.example??r.sample??null});
 }
 report.sources.push({source,datasets:[...datasets.values()].sort((a,b)=>a.dataset.localeCompare(b.dataset))});
}
const output=JSON.stringify(report,null,2);
const outPath=process.env.AUDIT_OUTPUT||'grafana/live-schema-audit.json';
fs.writeFileSync(outPath,output+'\n');
console.log('Read-only audit saved to '+outPath+'. Review for field coverage and dataset distribution.');
