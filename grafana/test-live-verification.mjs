import fs from 'node:fs';
const report={startedAt:new Date().toISOString(),checks:[],overall:'PASS'};
function add(name,status,detail){report.checks.push({name,status,detail});if(status!=='PASS')report.overall='FAIL';}
const required=['GRAFANA_URL','GRAFANA_TOKEN','WORKER_URL','SYNC_TOKEN'];
for(const k of required)if(!process.env[k]){add('Credentials', 'FAIL', k+' missing');}
if(report.overall==='FAIL'){emit();process.exit(1)}
const g=process.env.GRAFANA_URL.replace(/\\/$/,'');
const w=process.env.WORKER_URL.replace(/\\/$/,'');
const gh={Authorization:'Bearer '+process.env.GRAFANA_TOKEN};
const wh={Authorization:'Bearer '+process.env.SYNC_TOKEN};
async function req(url,headers){const r=await fetch(url,{headers,cache:'no-store'});const txt=await r.text();let data;try{data=JSON.parse(txt)}catch{data=txt};return {status:r.status,data};}
try{
 const user=await req(g+'/api/user',gh);add('Grafana auth',user.status===200?'PASS':'FAIL','HTTP '+user.status);
 const ds=await req(g+'/api/datasources',gh);const dsa=ds.data;const dsItem=Array.isArray(dsa)?dsa.find(x=>x.name==='TrainingCenter-D1'):null;
 add('Infinity datasource',ds.status===200&&!!dsItem?'PASS':'FAIL',dsItem?('UID '+dsItem.uid+', type '+dsItem.type):'Datasource missing / API '+ds.status);
 const search=await req(g+'/api/search?type=dash-db',gh);const dash=Array.isArray(search.data)?search.data.find(x=>x.uid==='lirklwv'):null;
 add('Dashboard UID',search.status===200&&!!dash?'PASS':'FAIL',dash?dash.title:'UID lirklwv not found');
 if(dash){const detail=await req(g+'/api/dashboards/uid/lirklwv',gh);const panels=detail.data?.dashboard?.panels;add('Dashboard panel structure',detail.status===200&&Array.isArray(panels)?'PASS':'FAIL',Array.isArray(panels)?panels.length+' panels (current live dashboard; not source clone)':'HTTP '+detail.status);}
 const health=await req(w+'/health',{});add('Worker health',health.status===200&&health.data?.storage?'PASS':'FAIL','HTTP '+health.status+' '+JSON.stringify(health.data).slice(0,180));
 // The schema endpoint can be heavy; avoid full scan. Test compact field coverage on a deliberately small date range via API, without logging sample values.
 const caps=await req(w+'/analytics-capabilities',wh);add('D1 JSON capabilities',caps.status===200&&caps.data?.ok?'PASS':'FAIL','HTTP '+caps.status+'; SQLite JSON functions validated on sample only');
}catch(e){add('Live checks execution','FAIL',String(e).slice(0,300));}
emit();
function emit(){fs.mkdirSync('evidence',{recursive:true});fs.writeFileSync('evidence/live-verification-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));}
if(report.overall!=='PASS')process.exit(1);
