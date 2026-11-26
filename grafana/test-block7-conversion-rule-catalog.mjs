import fs from 'node:fs';
import assert from 'node:assert/strict';
const src=JSON.parse(fs.readFileSync('grafana/dashboards/garmin-original-clone.json','utf8'));
const rules=[
 {id:'daily-summary',family:'DAILY',sourceCandidates:['daily_records'],rule:'JSON field extraction by exact path, date filtering, bounded read-only query; validate aggregation'},
 {id:'sleep',family:'SLEEP',sourceCandidates:['daily_records','garmin_records'],rule:'Inspect sleep payloads and stages; preserve interval and timezone semantics'},
 {id:'activity-detail',family:'ACTIVITY',sourceCandidates:['activities','activity_details'],rule:'Activity-grain queries; map each source metric separately and preserve activity identity'},
 {id:'intraday',family:'INTRADAY',sourceCandidates:['garmin_records'],rule:'Timestamped records; confirm source dataset, field path, temporal grain and endpoint limits'},
 {id:'gps',family:'GPS_GEO',sourceCandidates:['activity_details'],rule:'Ordered coordinates/time samples; require GPS-specific field evidence'},
 {id:'raw-influxql',family:'RAW_QUERY',sourceCandidates:[],rule:'Parse and translate independently; keep inert unless validated'},
 {id:'other',family:'OTHER',sourceCandidates:[],rule:'Manual semantic inspection; do not auto-wire'}
];
const keys=new Set();let count=0;
for(const p of src.panels||[])for(let i=0;i<(p.targets||[]).length;i++){keys.add(p.id+':'+i);count++;}
assert.equal(count,143);assert.equal(keys.size,143);
const plan={generatedAt:'2026-11-26',sourceDashboard:src.title||'Garmin Stats',panelCount:src.panels.length,targetCount:count,conversionRuleCatalog:rules,guardrails:['No assumed field equivalence','No daily metrics substituted for intraday/GPS','Only VERIFIED mappings may be activated by generator','Keep unsupported targets in conversion queue'],status:'STRATEGY_ONLY'};
fs.writeFileSync('grafana/BLOCK7_CONVERSION_RULE_CATALOG.json',JSON.stringify(plan,null,2)+'\n');
console.log('PASS: Block 7 conversion rules catalog generated; 143 source targets accounted.');
