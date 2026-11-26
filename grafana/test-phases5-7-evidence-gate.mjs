import fs from 'node:fs';import assert from 'node:assert/strict';
const src=fs.readFileSync('src/index.js','utf8');
const ref=JSON.parse(fs.readFileSync('grafana/dashboards/garmin-original-clone.json','utf8'));
const queue=JSON.parse(fs.readFileSync('grafana/PROGRESSIVE_CONVERSION_PHASES.json','utf8'));
const ledger=JSON.parse(fs.readFileSync('grafana/FIELD_VALIDATION_LEDGER.json','utf8'));
const inventory=JSON.parse(fs.readFileSync('grafana/REFERENCE_MASTER_INVENTORY.json','utf8'));
assert.equal(ref.panels.length,62);assert.equal(inventory.targets.length,143);assert.equal(queue.targets.length,143);assert.equal(ledger.metrics.length,143);
// Phase 5 gate: daily-series panel targets must retain source identity and be evidence-gated.
const dailyTargets=queue.targets.filter(x=>['5A/5B','5C','5D'].includes(x.phase));
assert.ok(dailyTargets.length>0);
assert.ok(dailyTargets.every(x=>x.status==='PENDING_LIVE_FIELD_VERIFICATION'),'daily-series conversion remains explicitly unverified until real data evidence');
// Phase 6 gate: intraday targets must remain in the inventory; no guessed mapping.
const intraday=queue.targets.filter(x=>String(x.sourceQueryReference?.measurement||'').toLowerCase().includes('intraday')||x.phase==='5D');
assert.ok(intraday.length>0);assert.ok(intraday.every(x=>x.status==='PENDING_LIVE_FIELD_VERIFICATION'));
// Phase 7 gate: GPS/activity-stream mappings cannot be activated without actual stream endpoint evidence.
const route=src.slice(src.indexOf('url.pathname === "/dashboard-activity"'),src.indexOf('url.pathname === "/dashboard-record"'));
assert.ok(route.includes('activity_details'));assert.ok(route.includes('activity_workouts'));assert.ok(route.includes('activityId'));assert.ok(route.includes('request.method === "GET"'));
assert.ok(!/\b(INSERT|UPDATE|DELETE|ALTER|CREATE|DROP)\s+(TABLE|INDEX|INTO|SET|FROM)/i.test(route),'activity endpoint remains read-only');
assert.ok(ledger.metrics.every(x=>x.status!=='VERIFIED'||x.mapping),'no incomplete verified ledger mappings');
console.log('Phase 5–7 safety/evidence gate passed: inventory preserved; daily/intraday/GPS targets remain gated pending semantic evidence.');
