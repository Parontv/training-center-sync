#!/usr/bin/env node
import fs from 'node:fs';
const d=JSON.parse(fs.readFileSync('grafana/generated/garmin-live-candidate.json','utf8'));
if(!Array.isArray(d.panels)||!d.panels.length)throw Error('No panels generated');
for(const p of d.panels){if(!p.targets?.[0]?.url?.includes('/dashboard-metrics?'))throw Error('Bad target URL');if(!p.description?.includes('AUTO-CANDIDATE'))throw Error('Missing candidate disclaimer');}
console.log('PASS: '+d.panels.length+' candidate panels; all targets use dashboard-metrics and are marked for review.');
