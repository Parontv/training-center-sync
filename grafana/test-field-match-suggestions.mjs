import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
const inventory=JSON.parse(fs.readFileSync('grafana/PROGRESSIVE_CONVERSION_PHASES.json','utf8'));
const suggestion=fs.readFileSync('grafana/suggest-live-field-matches.mjs','utf8');
const workflow=fs.readFileSync('.github/workflows/garmin-schema-discovery.yml','utf8');
const sanitizer=fs.readFileSync('grafana/sanitize-live-schema-audit.mjs','utf8');
assert.equal(inventory.targets.length,143);
assert.ok(suggestion.includes('SUGGESTIONS_ONLY_NOT_VERIFIED'));
assert.ok(suggestion.includes('FIELD_MATCH_SUGGESTIONS.json'));
assert.ok(!suggestion.includes("status:'VERIFIED'"),'heuristics must never mark target verified');
assert.ok(sanitizer.includes('field_path')&&!sanitizer.includes('examples'),'snapshot sanitizer should retain metadata only');
assert.ok(workflow.includes('suggest-live-field-matches.mjs'));
assert.ok(workflow.includes('SYNC_BEARER_TOKEN'));
assert.ok(workflow.includes('grafana/FIELD_MATCH_SUGGESTIONS.json'));
assert.ok(workflow.includes('pull_request'));
assert.ok(workflow.includes('push'));
// Synthetic integration test: exercise the matcher without any live or private data.
const snapshotPath='grafana/live-schema-snapshot.json',outputPath='grafana/FIELD_MATCH_SUGGESTIONS.json';
const snapshot={generatedAt:'fixture',garmin_records:[{dataset:'daily',field_path:'steps.total',value_type:'integer',occurrences:3,records_with_field:3},{dataset:'daily',field_path:'heart_rate.resting',value_type:'integer',occurrences:2,records_with_field:2}],daily_records:[]};
fs.writeFileSync(snapshotPath,JSON.stringify(snapshot));
try{
 execFileSync(process.execPath,['grafana/suggest-live-field-matches.mjs'],{stdio:'pipe'});
 const out=JSON.parse(fs.readFileSync(outputPath,'utf8'));
 assert.equal(out.totalTargets,143);
 assert.ok(out.targets.every(x=>x.status==='SUGGESTIONS_ONLY_NOT_VERIFIED'));
 assert.ok(out.targetsWithSuggestions>=0);
 assert.ok(out.policy.includes('Never mark mappings verified'));
 console.log('Synthetic matcher integration passed; suggestions remain unverified.');
}finally{fs.rmSync(snapshotPath,{force:true});fs.rmSync(outputPath,{force:true});}
console.log('Field suggestion guardrails passed.');
