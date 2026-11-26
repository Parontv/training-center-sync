import fs from 'node:fs';
import assert from 'node:assert/strict';

const worker=fs.readFileSync('src/index.js','utf8');
const route=worker.slice(worker.indexOf('if (url.pathname === "/dashboard-metrics"'),worker.indexOf('if (url.pathname === "/dashboard-record-dates"'));
assert.ok(route.includes('SYNC_BEARER_TOKEN'), 'metrics endpoint requires bearer token');
assert.ok(route.includes('["daily_records","garmin_records"].includes(source)'), 'source allowlist');
assert.ok(route.includes('dataset=?') && route.includes('jt.fullkey=?'), 'dataset and JSON field path parameterized');
assert.ok(route.includes('bind(...params)'), 'values bound, not interpolated');
assert.ok(route.includes('["avg","min","max","sum"].includes(aggregation)'), 'aggregation allowlist');
assert.ok(route.includes('isValidIsoDate(from)') && route.includes('isValidIsoDate(to)'), 'date input validation');
assert.ok(route.includes('Math.min') && route.includes('2000'), 'bounded result limit');
assert.ok(route.includes('GROUP BY r.record_date'), 'aggregated per-record date');
assert.ok(route.includes('readOnly:true'), 'endpoint reports read-only contract');
assert.ok(!route.includes('INSERT ') && !route.includes('UPDATE ') && !route.includes('DELETE '), 'metrics endpoint must not write');
console.log('PASS: dashboard-metrics static safety contract.');
