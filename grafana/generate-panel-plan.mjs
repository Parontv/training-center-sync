#!/usr/bin/env node
/**
 * Generate a safe, machine-readable implementation plan for Garmin dashboard panels.
 * This deliberately does not generate live metric queries: schema, units and coverage
 * must first be verified against private discovery evidence.
 */
import fs from 'node:fs';
const manifest=JSON.parse(fs.readFileSync('grafana/datasets.json','utf8'));
const source=fs.readFileSync('grafana/REFERENCE_PANEL_CATALOG.md','utf8');
const sections=[...source.matchAll(/^### ([A-E]) — (.+)$/gm)].map(m=>({code:m[1],name:m[2]}));
const plan={
  generated_from:'datasets.json + REFERENCE_PANEL_CATALOG.md',
  privacy:'metadata-only; no audit samples, values, tokens or user records',
  state:'SCHEMA_VERIFICATION_REQUIRED',
  dashboard_workstreams:[
    {id:'master',name:'Master / Archive',state:'EXISTING_ASSETS_PRESERVED',datasets:['activities','activity_details','daily_records','garmin_records']},
    {id:'activity',name:'Activity analysis',state:'CANDIDATE',datasets:['activities','activity_details']},
    {id:'recovery',name:'Sleep & recovery',state:'CANDIDATE',datasets:['sleep','hrv','resting_hr','stress','respiration','spo2']},
    {id:'body',name:'Body & weight',state:'CANDIDATE',datasets:['weight','body_composition','hydration']},
    {id:'training',name:'Training & readiness',state:'CANDIDATE',datasets:['training_load','activities']}
  ],
  reference_sections:sections,
  dataset_gate:manifest.datasets.map(d=>({key:d.key,label:d.label,status:d.status,metrics:d.metrics,verification:'UNVERIFIED',panel_policy:'Do not generate metric panels until field paths, units, date semantics and coverage are verified.'})),
  approval_boundary:'No dashboard publishing, Worker deployment, D1 mutation or sync schedule changes.'
};
const out=process.env.PANEL_PLAN_OUTPUT||'grafana/panel-implementation-plan.json';
fs.writeFileSync(out,JSON.stringify(plan,null,2)+'\n');
console.log('Generated safe panel implementation plan: '+out);
