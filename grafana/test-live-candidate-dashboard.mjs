#!/usr/bin/env node
import fs from 'node:fs';
const d=JSON.parse(fs.readFileSync('grafana/generated/garmin-live-candidate.json','utf8'));
if(!Array.isArray(d.panels)||!d.panels.length)throw Error('No panels generated');
const keys=new Set();
for(const p of d.panels){
 if(!p.targets?.[0]?.url?.includes('/dashboard-metrics?'))throw Error('Bad target URL');
 if(!p.description?.includes('AUTO-CANDIDATE'))throw Error('Missing candidate disclaimer');
 if(/\\[[0-9]+\\]|timezoneoffset|durationinmilliseconds|timestamp|offset|timezone/i.test(p.title))throw Error('Excluded array/metadata path present');
 const url=new URL(p.targets[0].url);const k=[url.searchParams.get('source'),url.searchParams.get('dataset'),url.searchParams.get('field_path')].join('|');
 if(keys.has(k))throw Error('Duplicate candidate target');keys.add(k);
 if(p.targets[0].columns.find(c=>c.selector==='date')?.type!=='time')throw Error('Date column must be typed as time');
}
console.log('PASS: '+d.panels.length+' deduplicated scalar candidate panels; excluded array-index/metadata fields; candidates remain review-gated.');
