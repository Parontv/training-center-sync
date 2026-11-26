import fs from 'node:fs';
const normalized=JSON.parse(fs.readFileSync('grafana/SOURCE_QUERY_NORMALIZATION.json','utf8'));
const families={};
for(const t of normalized.targets){
 const m=t.measurement||'',field=t.fieldCandidate||'',raw=t.rawQuery;
 let family='UNCLASSIFIED';
 if(raw) family='RAW_INFLUXQL_REQUIRES_MANUAL_TRANSLATION';
 else if(/GPS|Track|Position|Geo/i.test(m)||/GPS|latitude|longitude/i.test(field)) family='GPS_GEO_ACTIVITY';
 else if(/Intraday|Hourly|Minute|SleepMovement/i.test(m)) family='INTRADAY_TIME_SERIES';
 else if(/Daily|Summary|Stats/i.test(m)) family='DAILY_SUMMARY';
 else if(/Activity|Workout|Lap|Zone/i.test(m)) family='ACTIVITY_DETAIL';
 else if(/Sleep/i.test(m)) family='SLEEP';
 else if(/BodyBattery|Stress|HeartRate|HRV|Pulse|SpO2|Respiration/i.test(m+field)) family='HEALTH_INTRADAY_OR_SPECIAL';
 else family='OTHER_SOURCE_QUERY';
 (families[family]??=[]).push(t.stableKey);
}
const priorities=['DAILY_SUMMARY','ACTIVITY_DETAIL','SLEEP','HEALTH_INTRADAY_OR_SPECIAL','INTRADAY_TIME_SERIES','GPS_GEO_ACTIVITY','RAW_INFLUXQL_REQUIRES_MANUAL_TRANSLATION','OTHER_SOURCE_QUERY','UNCLASSIFIED'];
const summary=priorities.map(f=>({family:f,count:(families[f]||[]).length,stableKeys:families[f]||[],conversionPolicy:f==='DAILY_SUMMARY'?'Attempt dataset/field match only with semantic evidence':f==='ACTIVITY_DETAIL'?'Activity table/detail endpoint candidate':f==='SLEEP'?'Sleep datasets; inspect nested JSON and aggregation':f==='HEALTH_INTRADAY_OR_SPECIAL'?'Check Garmin intraday records; time-series transformation required':f==='INTRADAY_TIME_SERIES'?'Requires time-resolved dataset and sampling semantics':f==='GPS_GEO_ACTIVITY'?'Separate GPS/location transformation; never substitute daily metrics':f==='RAW_INFLUXQL_REQUIRES_MANUAL_TRANSLATION'?'Parse/translate independently; keep inert if unsafe': 'Inspect source evidence and route to suitable conversion strategy'}));
const result={generatedAt:'2026-11-26',sourceDashboard:normalized.sourceDashboard,totalTargets:normalized.targetCount,policy:'Classification is a conversion planning aid, not verification or activation.',families:summary};
fs.writeFileSync('grafana/BLOCK6_QUERY_FAMILY_STRATEGY.json',JSON.stringify(result,null,2)+'\n');
assert.equal(summary.reduce((n,x)=>n+x.count,0),143);
assert.ok(summary.every(x=>x.family&&x.conversionPolicy));
console.log('PASS: classified '+summary.reduce((n,x)=>n+x.count,0)+' targets across '+summary.filter(x=>x.count).length+' non-empty query families.');
