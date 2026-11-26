import fs from 'node:fs';import assert from 'node:assert/strict';
const ledger=JSON.parse(fs.readFileSync('grafana/PROGRESSIVE_CONVERSION_PHASES.json','utf8'));
const script=fs.readFileSync('grafana/suggest-live-field-matches.mjs','utf8');
assert.equal(ledger.targets.length,143);
assert.ok(script.includes('SUGGESTIONS_ONLY_NOT_VERIFIED'));
assert.ok(script.includes('never'));
console.log('Field suggestion guardrails passed.');
