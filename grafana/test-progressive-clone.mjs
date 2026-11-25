#!/usr/bin/env node
import fs from 'node:fs';
import assert from 'node:assert/strict';

const original = JSON.parse(fs.readFileSync('grafana/dashboards/garmin-original-clone.json', 'utf8'));
const progressive = JSON.parse(fs.readFileSync('grafana/dashboards/garmin-stats-d1-progressive.json', 'utf8'));
assert.equal(original.panels.length, 62, 'reference panel count');
assert.equal(progressive.panels.length, original.panels.length, 'panel count preserved');
assert.equal(progressive.uid, 'garmin-stats-d1-progressive');
assert.equal(progressive.title, 'Garmin Stats · D1 Progressive');
assert.equal(progressive.id, null);
assert.ok(!progressive.__inputs, 'Influx datasource import prompt removed');
assert.ok(!(progressive.__requires || []).some(x => x.type === 'datasource' && x.id === 'influxdb'), 'InfluxDB dependency removed');
assert.ok((progressive.__requires || []).some(x => x.type === 'datasource' && x.id === 'yesoreyeram-infinity-datasource'), 'Infinity dependency declared');

const ids = new Set(original.panels.map(p => p.id));
assert.equal(ids.size, 62, 'reference panel IDs are unique');
const sourceTargets = original.panels.reduce((n, p) => n + (p.targets || []).length, 0);
assert.equal(sourceTargets, 143, 'source target inventory retained in original clone');

const expected = {
  38: ['start_time_local','activity_type','activity_name','duration_s','distance_m','average_hr','max_hr','calories'],
  41: ['start_time_local','activity_type'],
  48: ['start_time_local','average_hr','max_hr'],
  53: ['start_time_local','distance_m'],
  54: ['start_time_local','duration_s']
};
const connected = [];
for (const p of progressive.panels) {
  if (Object.hasOwn(expected, p.id)) {
    connected.push(p.id);
    assert.equal(p.targets.length, 1, 'one query target for panel ' + p.id);
    const t = p.targets[0];
    assert.equal(t.datasource.uid, 'training-center-d1');
    assert.equal(t.datasource.type, 'yesoreyeram-infinity-datasource');
    assert.equal(t.source, 'url');
    assert.equal(t.parser, 'backend');
    assert.equal(t.root_selector, 'activities');
    assert.ok(t.url.endsWith('/dashboard-data'));
    assert.ok(!t.url.includes('token') && !t.url.includes('Bearer'));
    assert.deepEqual(t.columns.map(c => c.selector), expected[p.id]);
    for (const c of t.columns) assert.ok(['time','string','number'].includes(c.type));
  } else if ((original.panels.find(o => o.id === p.id)?.targets || []).length) {
    assert.deepEqual(p.targets, [], 'unsupported query targets are inert for panel ' + p.id);
    assert.equal(p.datasource.uid, 'training-center-d1');
    assert.ok(p.description.includes('PENDING D1 MAPPING'));
  }
}
assert.deepEqual(connected.sort((a,b)=>a-b), [38,41,48,53,54]);
assert.equal(progressive.panels.reduce((n,p)=>n+(p.targets||[]).length,0), 5, 'only the five verified-contract activity targets are active');
const panel48 = progressive.panels.find(p => p.id === 48);
assert.ok((panel48.transformations || []).some(t => t.id === 'calculateField'), 'HR difference calculation retained');
assert.equal(progressive.panels.find(p => p.id === 38).options.frameIndex, 0);
const serialized = JSON.stringify(progressive);
assert.ok(!serialized.includes('influxdb'), 'no InfluxDB references in progressive dashboard');
assert.ok(!serialized.includes('SYNC_BEARER_TOKEN') && !serialized.includes('Authorization: Bearer'), 'no secrets in dashboard JSON');
console.log('PASS: 62-panel reference layout preserved; 5 activity panels connected; 57 query mappings remain inert; no InfluxDB or secret references.');
