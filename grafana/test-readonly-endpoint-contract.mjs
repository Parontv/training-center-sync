#!/usr/bin/env node
import fs from 'node:fs';
import assert from 'node:assert/strict';

const sourcePath=process.argv[2]||'src/index.js';
const source=fs.readFileSync(sourcePath,'utf8');
const routes=['/dashboard-schema','/dashboard-field-values','/dashboard-field-coverage','/dashboard-metrics','/dashboard-record-dates','/dashboard-data'];
for(const route of routes){
 assert.ok(source.includes('url.pathname === "'+route+'"'), 'Missing route '+route);
 const start=source.indexOf('url.pathname === "'+route+'"');
 const snippet=source.slice(start,start+1200);
 assert.ok(snippet.includes('SYNC_BEARER_TOKEN'), 'Route '+route+' lacks bearer-token gate near handler');
}
assert.ok(source.includes('isValidIsoDate'), 'Date validation helper should be referenced in source');
for(const file of ['grafana/dashboards/training-center-master.json','grafana/dashboards/training-center-overview.json']){
 if(!fs.existsSync(file))continue;
 const d=JSON.parse(fs.readFileSync(file,'utf8'));
 const serialized=JSON.stringify(d);
 assert.ok(!/Bearer\\s+[A-Za-z0-9._-]{20,}/i.test(serialized), 'Possible bearer credential embedded in '+file);
}
console.log('Read-only metrics endpoint presence/security-gate static check passed. (No live validation.)');
