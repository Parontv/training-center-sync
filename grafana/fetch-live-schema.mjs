#!/usr/bin/env node
/**
 * Authenticated, read-only live schema audit helper.
 * Usage: SYNC_BEARER_TOKEN=... node grafana/fetch-live-schema.mjs
 * Writes a private local audit file, excluded by grafana/.gitignore.
 */
import fs from 'node:fs';
const token=process.env.SYNC_BEARER_TOKEN;
if(!token){console.error('Missing SYNC_BEARER_TOKEN environment variable.');process.exit(2);}
const base=(process.env.WORKER_BASE||'https://training-center-sync.listaconcerti.workers.dev').replace(/\/$/,'');
let response, body;
for(let attempt=1;attempt<=3;attempt++){
 response=await fetch(base+'/dashboard-schema',{headers:{Authorization:'Bearer '+token},cache:'no-store'});
 if(response.ok){body=await response.json();break;}
 const errorBody=await response.json().catch(()=>null);
 const reason=String(errorBody?.error||errorBody?.message||'no structured error').slice(0,200);
 console.error('Schema endpoint HTTP '+response.status+' ('+reason+'), attempt '+attempt+'/3');
 if(attempt===3)process.exit(1);
 await new Promise(resolve=>setTimeout(resolve,attempt*15000));
}

if(!body||body.ok===false){console.error('Schema response was not successful.');process.exit(1);}
const out='grafana/live-schema-audit.json';
fs.writeFileSync(out,JSON.stringify(body,null,2));
console.log('Private live schema saved to '+out+'; do not commit this file.');
