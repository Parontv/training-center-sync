import fs from 'node:fs';
import assert from 'node:assert/strict';
const worker=fs.readFileSync('src/index.js','utf8');
function route(path,next){const start=worker.indexOf('url.pathname === "'+path+'"');assert.ok(start>=0,'route '+path+' exists');const end=next?worker.indexOf('url.pathname === "'+next+'"',start+1):worker.length;return worker.slice(start,end<0?worker.length:end);}
const schema=route('/dashboard-schema','/dashboard-field-values');
const values=route('/dashboard-field-values','/dashboard-field-coverage');
const coverage=route('/dashboard-field-coverage','/dashboard-metrics');
const metrics=route('/dashboard-metrics','/dashboard-record-dates');
const dates=route('/dashboard-record-dates','/dashboard-records');
const records=route('/dashboard-records','/dashboard-activity');
for(const [name,s] of Object.entries({schema,values,coverage,metrics,dates,records})){assert.ok(s.includes('SYNC_BEARER_TOKEN'),name+' authentication');assert.ok(s.includes('readOnly')||name==='schema'||name==='dates'||name==='records',name+' read-only contract review');assert.ok(!/\\b(INSERT|UPDATE|DELETE)\\s+/i.test(s),name+' no mutation SQL');}
assert.ok(schema.includes('json_tree')&&schema.includes('GROUP BY'),'schema extraction');
assert.ok(values.includes('jt.fullkey=?')&&values.includes('bind(...params)'),'field values bound');
assert.ok(values.includes('Math.min')&&values.includes('5000'),'field values capped');
assert.ok(coverage.includes('COUNT(DISTINCT r.record_date)'),'coverage counts dates explicitly');
assert.ok(metrics.includes('aggregation')&&metrics.includes('Math.min')&&metrics.includes('2000'),'metrics aggregation and result bound');
assert.ok(metrics.includes('jt.fullkey=?')&&metrics.includes('bind(...params)'),'metrics field path bound');
assert.ok(dates.includes('GROUP BY record_date')&&dates.includes('LIMIT 1000'),'record date list bounded');
assert.ok(records.includes('LIMIT ?')&&records.includes('bind'),'raw record query bounded and parameterized');
console.log('PASS: Block 3 read-only API contract and safety regression checks.');
