import fs from 'node:fs';import assert from 'node:assert/strict';
const w=fs.readFileSync('.github/workflows/garmin-schema-discovery.yml','utf8');
assert.ok(w.includes('workflow_dispatch'));assert.ok(w.includes('schedule'));
assert.ok(w.includes('secrets.SYNC_BEARER_TOKEN'),'token must be sourced from Actions secret');
assert.ok(w.includes('fetch-live-schema.mjs'));assert.ok(w.includes('analyze-live-schema.mjs'));assert.ok(w.includes('sanitize-live-schema-audit.mjs'));assert.ok(w.includes('suggest-live-field-matches.mjs'),'live field suggestion engine should run from audit');
assert.ok(w.includes('schema-candidates-sanitized.json'),'only sanitized metadata should be uploaded');
assert.ok(w.includes('rm -f grafana/live-schema-audit.json'),'private raw audit should be deleted');
assert.ok(!w.includes('live-schema-audit.json\n          if-no-files-found'),'raw audit must not be artifact');
console.log('Automated schema discovery workflow safety check passed.');
