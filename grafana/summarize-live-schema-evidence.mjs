#!/usr/bin/env node
/**
 * Privacy-safe value-evidence summarizer for Garmin schema audit exports.
 * Reads a locally downloaded /dashboard-schema audit JSON and emits ONLY
 * aggregate field coverage/type/date summaries; never prints sample values.
 */
import fs from 'node:fs';
const input=process.argv[2];
if(!input){console.error('Usage: node grafana/summarize-live-schema-evidence.mjs <private-audit.json> [output.json]');process.exit(2);}
const root=JSON.parse(fs.readFileSync(input,'utf8'));
const schema=root.schema||root;
const datasets=['daily_records','garmin_records'];
const output={generatedAt:new Date().toISOString(),source:'local sanitized schema audit',privacy:'No raw record values included',datasets:{}};
function walk(v,path,out){
 if(v===null){out.push({path,type:'null'});return;}
 if(Array.isArray(v)){out.push({path,type:'array',length:v.length}); if(v.length&&typeof v[0]==='object')walk(v[0],path+'[0]',out);return;}
 if(typeof v==='object'){for(const [k,val] of Object.entries(v))walk(val,path+'.'+k,out);return;}
 out.push({path,type:typeof v});
}
for(const ds of datasets){
 const records=Array.isArray(schema[ds])?schema[ds]:[];
 const fields=new Map();
 for(const record of records){const payload=record.raw_json?(()=>{try{return JSON.parse(record.raw_json)}catch{return null}})():record; if(!payload||typeof payload!=='object')continue;
 const paths=[];walk(payload,'$',paths);
 for(const p of paths){const key=p.path;const entry=fields.get(key)||{types:new Set(),count:0};entry.types.add(p.type);entry.count++;fields.set(key,entry);}
 }
 output.datasets[ds]={records:records.length,fields:[...fields.entries()].map(([path,e])=>({path,types:[...e.types].sort(),recordsWithField:e.count,coverage:records.length?Number((e.count/records.length).toFixed(4)):0})).sort((a,b)=>a.path.localeCompare(b.path))};
}
const text=JSON.stringify(output,null,2)+'\n';
if(process.argv[3])fs.writeFileSync(process.argv[3],text);else console.log(text);
