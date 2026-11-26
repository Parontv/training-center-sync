import fs from 'node:fs';import assert from 'node:assert/strict';
const src=fs.readFileSync('src/index.js','utf8');
for(const path of ['/dashboard-field-values','/dashboard-metrics'])assert.ok(src.includes(path),'missing endpoint '+path);
const start=src.indexOf('if (url.pathname === "/dashboard-metrics"');
const end=src.indexOf('if (url.pathname === "/dashboard-record-dates"',start);
assert.ok(start>=0&&end>start);
const e=src.slice(start,end);
assert.ok(e.includes('SYNC_BEARER_TOKEN'));assert.ok(e.includes('["daily_records","garmin_records"]'));
assert.ok(e.includes('json_tree'));assert.ok(e.includes('.bind(...params)'));assert.ok(e.includes('LIMIT ?'));
assert.ok(e.includes('Number.isFinite(requestedLimit)'),'metrics limit must handle invalid numeric input');
assert.ok(e.includes('GROUP BY r.record_date ORDER BY r.record_date ASC LIMIT ?'),'metrics SQL must have a valid bounded LIMIT clause');
assert.ok(!e.includes('ASC + "LIMIT'), 'malformed SQL concatenation must not regress');
assert.ok(e.includes("['avg','min','max','sum']")||e.includes('["avg","min","max","sum"]'));
assert.ok(!e.includes('INSERT INTO'));assert.ok(!e.includes('UPDATE '));assert.ok(!e.includes('DELETE FROM'));
const rawStart=src.indexOf('if (url.pathname === "/dashboard-field-values"');
const rawEnd=src.indexOf('if (url.pathname === "/dashboard-metrics"',rawStart);
assert.ok(rawStart>=0&&rawEnd>rawStart,'raw endpoint block exists');
const raw=src.slice(rawStart,rawEnd);
assert.ok(raw.includes('SYNC_BEARER_TOKEN'));
assert.ok(raw.includes('["daily_records","garmin_records"]'));
assert.ok(raw.includes('json_tree'));
assert.ok(raw.includes('.bind(...params)'));
assert.ok(raw.includes('LIMIT ?'));
assert.ok(raw.includes('Number.isFinite(requestedLimit)'),'raw-field limit must handle invalid numeric input');
assert.ok(!raw.includes('INSERT INTO'));assert.ok(!raw.includes('UPDATE '));assert.ok(!raw.includes('DELETE FROM'));

// Security/validation regression checks.
const validationLines=src.split('\n').filter(line=>line.includes('intervallo date non valido'));
assert.equal(validationLines.length,3,'all three analytics endpoints must contain date validation');
assert.ok(validationLines.every(line=>line.includes('isValidIsoDate(from)')&&line.includes('isValidIsoDate(to)')), 'all endpoints must use strict calendar-date validation');
assert.ok(src.includes('import { isValidIsoDate } from "./date-validation.js";'), 'Worker must use shared strict date validator');
assert.ok(src.includes('isValidIsoDate(from)')&&src.includes('isValidIsoDate(to)'), 'Worker must call strict validator');

assert.ok(e.includes('includes(source)'), 'source allowlist must remain');
assert.ok(e.includes('includes(aggregation)'), 'aggregation allowlist must remain');
assert.ok(e.includes('from > to'), 'date range order must be validated');
assert.ok(e.includes('Math.trunc(requestedLimit)')&&e.includes('2000'), 'metrics LIMIT must be integer and capped');
assert.ok(raw.includes('Math.trunc(requestedLimit)')&&raw.includes('5000'), 'raw LIMIT must be integer and capped');
assert.ok(e.includes('aggregation.toUpperCase()'), 'aggregate SQL must derive only from validated aggregation');
assert.ok(raw.includes('source + " r, json_tree'), 'raw SQL source must derive from allowlisted source');

console.log('Read-only endpoint static checks passed.');

// Coverage endpoint: read-only metadata, bounded sources and date validation.
const coverageStart=src.indexOf('if (url.pathname === "/dashboard-field-coverage"');
const coverageEnd=src.indexOf('if (url.pathname === "/dashboard-metrics"',coverageStart);
assert.ok(coverageStart>=0&&coverageEnd>coverageStart,'field coverage endpoint exists');
const coverage=src.slice(coverageStart,coverageEnd);
assert.ok(coverage.includes('SYNC_BEARER_TOKEN'));
assert.ok(coverage.includes('["daily_records","garmin_records"]'));
assert.ok(coverage.includes('json_tree')&&coverage.includes('COUNT(DISTINCT r.record_date)'));
assert.ok(coverage.includes('.bind(...baseParams)')&&coverage.includes('.bind(...fieldParams)'));
assert.ok(coverage.includes('isValidIsoDate(from)')&&coverage.includes('isValidIsoDate(to)'));
assert.ok(!coverage.includes('INSERT INTO')&&!coverage.includes('UPDATE ')&&!coverage.includes('DELETE FROM'));
console.log('Field coverage endpoint static safeguards passed.');
