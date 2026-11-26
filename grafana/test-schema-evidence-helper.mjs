import fs from 'node:fs';
import assert from 'node:assert/strict';
const source=fs.readFileSync('grafana/summarize-live-schema-evidence.mjs','utf8');
assert.ok(source.includes('recordsWithField'));
assert.ok(source.includes('coverage'));
assert.ok(source.includes('No raw record values included'));
assert.ok(!source.includes('console.log(record'));
console.log('PASS: privacy-safe evidence summarizer static guard.');
