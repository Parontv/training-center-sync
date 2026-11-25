#!/usr/bin/env node
/**
 * Dashboard-as-code generator (scaffold).
 * Usage: node grafana/build-dashboards.mjs
 * Generates stable dashboard JSON locally from declarative manifests.
 * Does not contact Grafana, D1, or deploy anything.
 */
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const manifest=JSON.parse(fs.readFileSync(path.join(root,'grafana','datasets.json'),'utf8'));
const dashboardsDir=path.join(root,'grafana','dashboards');
fs.mkdirSync(dashboardsDir,{recursive:true});
const datasource={type:'yesoreyeram-infinity-datasource',uid:'TrainingCenter-D1'};
const mkPanel=(id,title,description,gridPos)=>({id,title,description,type:'table',datasource,gridPos,
  targets:[{refId:'A',type:'json',source:'url',url:'$WORKER_BASE/dashboard-data',url_options:{method:'GET'},parser:'backend',format:'table',root_selector:'datasets',columns:[{selector:'dataset',text:'Dataset',type:'string'},{selector:'records',text:'Records',type:'number'},{selector:'first_date',text:'First date',type:'string'},{selector:'last_date',text:'Last date',type:'string'}]}]});
const panelCatalog=manifest.datasets.map((d,i)=>({id:i+1,title:d.label+' · '+d.status,description:(d.metrics||[]).join(', '),type:'text',options:{mode:'markdown',content:'**Status:** '+d.status+'\\n\\n**Dashboard:** '+d.dashboard+'\\n\\n'+(d.notes||'')},gridPos:{x:(i%2)*12,y:Math.floor(i/2)*5,w:12,h:5}}));
const dashboard={id:null,uid:'tc-d1-catalog',title:'Training Center · D1 Data Catalog',tags:['training-center','garmin','d1','generated'],timezone:'browser',schemaVersion:39,version:1,refresh:'15m',panels:panelCatalog};
fs.writeFileSync(path.join(dashboardsDir,'training-center-d1-catalog.json'),JSON.stringify(dashboard,null,2));
console.log('Generated dashboard catalogue. This scaffold intentionally avoids inventing metric queries until the actual D1 schema/coverage is validated.');
