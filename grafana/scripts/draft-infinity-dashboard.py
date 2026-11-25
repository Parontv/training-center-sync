#!/usr/bin/env python3
"""Create a conservative Infinity dashboard draft while preserving source panel metadata.

Verified mapping entries are converted into placeholder Infinity JSON requests.
Unverified source targets are retained as disabled-looking placeholders and are never
presented as working queries. This draft still requires live Infinity datasource
configuration and API validation before import/use.
"""
import json,sys,copy
from pathlib import Path
def load(p): return json.loads(Path(p).read_text(encoding="utf-8"))
def main():
 if len(sys.argv)!=4:
  print("Usage: draft-infinity-dashboard.py <source-dashboard.json> <mapping.json> <output.json>");sys.exit(2)
 src,mapping,out=map(load,sys.argv[1:])
 entries={(m.get("panelId"),m.get("ref")):m for m in mapping.get("mappings",[])}
 draft=copy.deepcopy(src)
 draft["title"]=(src.get("title") or "Garmin Stats")+" - Infinity conversion DRAFT"
 draft["tags"]=list(src.get("tags",[]))+["infinity-draft","unverified"]
 draft["description"]="DRAFT generated from source panel metadata. Queries are placeholders; live field paths, datasource UID and query response format must be validated. Do not treat as operational."
 count_verified=0
 for panel in draft.get("panels",[]):
  targets=panel.get("targets",[])
  for target in targets:
   key=(panel.get("id"),target.get("ref"))
   m=entries.get(key)
   if m and m.get("verified") is True and m.get("fieldPath") and m.get("aggregation") in {"avg","min","max","sum"}:
    target["datasource"]={"type":"yesoreyeram-infinity-datasource","uid":"REPLACE_WITH_INFINITY_UID"}
    target["type"]="json"
    target["source"]="url"
    target["url"]="REPLACE_WITH_WORKER_ORIGIN/dashboard-metrics"
    target["method"]="GET"
    target["parser"]="backend"
    target["format"]="table"
    target["root_selector"]="points"
    target["columns"]=[{"selector":"date","text":"date","type":"timestamp"},{"selector":"value","text":m.get("panel") or "value","type":"number"}]
    target["draftMapping"]={"dataset":m.get("source"),"sourceDataset":m.get("sourceDataset"),"fieldPath":m.get("fieldPath"),"aggregation":m.get("aggregation"),"unit":m.get("unit")}
    target["draftOnly"]=True
    count_verified+=1
   else:
    target["datasource"]={"type":"yesoreyeram-infinity-datasource","uid":"REPLACE_WITH_INFINITY_UID"}
    target["draftOnly"]=True
    target["draftStatus"]="UNVERIFIED - query intentionally not configured"
    target["query"]="UNVERIFIED"
 panel_count=len(draft.get("panels",[]))
 draft["draftConversionSummary"]={"sourcePanelCount":panel_count,"verifiedMappingsConfigured":count_verified,"mappingCount":len(entries),"warning":"Draft scaffold only; no unverified query is configured. Verify live schema and Infinity format before import."}
 Path(out).write_text(json.dumps(draft,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
 print(f"PASS: draft generated preserving {panel_count} panels; {count_verified} verified mappings configured")
if __name__=="__main__":main()
