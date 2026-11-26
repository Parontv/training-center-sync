#!/usr/bin/env python3
"""Build Infinity draft using stable panelId:targetIndex mapping keys."""
import json,sys,copy
from pathlib import Path
from urllib.parse import urlencode
if len(sys.argv)!=4: raise SystemExit("Usage: build-infinity-stable.py source.json stable-mapping.json output.json")
source,mapping,out=map(Path,sys.argv[1:])
src=json.loads(source.read_text()); data=json.loads(mapping.read_text())
entries={m.get("stableKey"):m for m in data.get("mappings",[])}
dash=copy.deepcopy(src); configured=0; inert=0
base=(data.get("workerBaseUrl") or "https://training-center-sync.listaconcerti.workers.dev").rstrip("/")
for panel in dash.get("panels",[]):
 for i,target in enumerate(panel.get("targets",[])):
  key=f'{panel.get("id")}:{i}'; m=entries.get(key)
  valid=m and m.get("verified") is True and m.get("fieldPath") and m.get("dataset") and m.get("source") in ("daily_records","garmin_records") and m.get("aggregation") in ("avg","min","max","sum")
  if valid:
   q=urlencode({"source":m["source"],"dataset":m["dataset"],"field_path":m["fieldPath"],"aggregation":m["aggregation"],"limit":int(m.get("limit",366))})
   target.update({"datasource":{"type":"yesoreyeram-infinity-datasource","uid":data.get("infinityDatasourceUid","REPLACE_WITH_INFINITY_UID")},"type":"json","source":"url","url":base+"/dashboard-metrics?"+q,"method":"GET","parser":"backend","format":"table","root_selector":"points","columns":[{"selector":"date","text":"date","type":"string"},{"selector":"value","text":m.get("valueLabel","value"),"type":"number"},{"selector":"samples","text":"samples","type":"number"}]})
   target["stableMappingKey"]=key; configured+=1
  else:
   target["draftOnly"]=True;target["stableMappingKey"]=key;target["draftStatus"]="UNVERIFIED mapping; query not wired"; inert+=1
dash["title"]=(src.get("title","Garmin")+" · Infinity draft").strip()
dash["description"]="Stable target mapping draft. Only explicitly verified mappings are configured; remaining targets are inert."
dash["tags"]=list(src.get("tags",[]))+["infinity-draft","stable-mapping"]
dash["stableConversionSummary"]={"targetsConfigured":configured,"targetsInert":inert,"mappingKeys":"panelId:targetIndex","sourcePanels":len(src.get("panels",[]))}
out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(dash,indent=2,ensure_ascii=False)+"\\n")
print(f"PASS: stable keys; configured={configured}, inert={inert}, panels={len(src.get('panels',[]))}")
