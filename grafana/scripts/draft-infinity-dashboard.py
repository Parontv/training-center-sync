#!/usr/bin/env python3
"""Create a conservative Infinity dashboard draft preserving source panel metadata.

Verified mappings are wired to the read-only Worker metric endpoint. Unverified
mappings remain explicitly inert. This is a draft and requires live validation.
"""
import json,sys,copy
from pathlib import Path
from urllib.parse import urlencode

def load(p): return json.loads(Path(p).read_text(encoding="utf-8"))

def main():
 if len(sys.argv)!=4:
  print("Usage: draft-infinity-dashboard.py <source-dashboard.json> <mapping.json> <output.json>");sys.exit(2)
 source_path,mapping_path,out_path=sys.argv[1:]
 src=load(source_path); mapping=load(mapping_path)
 entries={(m.get("panelId"),m.get("ref")):m for m in mapping.get("mappings",[])}
 draft=copy.deepcopy(src)
 draft["title"]=(src.get("title") or "Garmin Stats")+" - Infinity conversion DRAFT"
 draft["tags"]=list(src.get("tags",[]))+["infinity-draft","unverified"]
 draft["description"]="DRAFT generated from source panel metadata. Live field paths, datasource UID, date semantics and rendering must be validated. Do not treat as operational."
 count_verified=0
 for panel in draft.get("panels",[]):
  for target in panel.get("targets",[]):
   key=(panel.get("id"),target.get("ref")); m=entries.get(key)
   if m and m.get("verified") is True and m.get("fieldPath") and m.get("sourceDataset") and m.get("source") in {"daily_records","garmin_records"} and m.get("aggregation") in {"avg","min","max","sum"}:
    limit=m.get("limit",366)\n    if not isinstance(limit,int) or isinstance(limit,bool) or limit<1 or limit>5000:\n     target["draftOnly"]=True; target["draftStatus"]="UNVERIFIED - invalid mapping limit"; target["query"]="UNVERIFIED"; continue\n    params={"source":m["source"],"dataset":m["sourceDataset"],"field_path":m["fieldPath"],"aggregation":m["aggregation"],"limit":limit}\n    if m.get("from"): params["from"]=m["from"]\n    if m.get("to"): params["to"]=m["to"]
    target["datasource"]={"type":"yesoreyeram-infinity-datasource","uid":"REPLACE_WITH_INFINITY_UID"}
    target["type"]="json"; target["source"]="url"
    target["url"]="REPLACE_WITH_WORKER_ORIGIN/dashboard-metrics?"+urlencode(params)
    target["method"]="GET"; target["parser"]="backend"; target["format"]="table"; target["root_selector"]="points"
    target["columns"]=[{"selector":"date","text":"date","type":"string"},{"selector":"value","text":m.get("panel") or "value","type":"number"},{"selector":"samples","text":"samples","type":"number"}]
    target["draftMapping"]={"dataset":m.get("sourceDataset"),"sourceDataset":m.get("sourceDataset"),"fieldPath":m.get("fieldPath"),"aggregation":m.get("aggregation"),"unit":m.get("unit")}
    target["draftOnly"]=True; target["draftStatus"]="DRAFT - mapping marked verified; live Infinity validation still required"
    count_verified+=1
   else:
    target["datasource"]={"type":"yesoreyeram-infinity-datasource","uid":"REPLACE_WITH_INFINITY_UID"}
    target["draftOnly"]=True; target["draftStatus"]="UNVERIFIED - query intentionally not configured"; target["query"]="UNVERIFIED"
 panel_count=len(draft.get("panels",[]))
 draft["draftConversionSummary"]={"sourcePanelCount":panel_count,"verifiedMappingsConfigured":count_verified,"mappingCount":len(entries),"warning":"Draft scaffold only; confirm endpoint, Infinity parser, units, dates and rendering before import."}
 Path(out_path).write_text(json.dumps(draft,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
 print(f"PASS: draft generated preserving {panel_count} panels; {count_verified} verified mappings configured")
if __name__=="__main__":main()
