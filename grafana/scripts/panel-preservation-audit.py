#!/usr/bin/env python3
"""Produce a panel-preservation audit comparing source dashboard and mapping catalog."""
import json,sys
from pathlib import Path
def read(p): return json.loads(Path(p).read_text(encoding="utf-8"))
def main():
 if len(sys.argv)!=4:
  print("Usage: panel-preservation-audit.py <source-dashboard.json> <semantic-audit.json> <mapping-template.json>");sys.exit(2)
 dash,audit,mapping=map(read,sys.argv[1:])
 panels=dash.get("panels",[])
 targets=audit.get("targets",[])
 maps=mapping.get("mappings",[])
 byid={p.get("id"):p for p in panels}
 target_keys={(t.get("panelId"),t.get("ref")) for t in targets}
 mapping_keys={(m.get("panelId"),m.get("ref")) for m in maps}
 if len(panels)!=62: raise SystemExit(f"FAIL panel count {len(panels)}")
 if len(targets)!=143: raise SystemExit(f"FAIL audit target count {len(targets)}")
 if len(maps)!=143: raise SystemExit(f"FAIL mapping count {len(maps)}")
 if target_keys!=mapping_keys: raise SystemExit("FAIL mapping keys do not exactly cover audit target keys")
 rows=[]
 for p in panels:
  rows.append({"id":p.get("id"),"title":p.get("title"),"type":p.get("type"),
   "targets":len(p.get("targets",[])),"position":p.get("gridPos"),
   "datasource":p.get("datasource"),"transformations":len(p.get("transformations",[])),
   "fieldConfigPresent":bool(p.get("fieldConfig")),"optionsPresent":bool(p.get("options"))})
 report={"dashboardTitle":dash.get("title"),"panelCount":len(panels),"targetCount":len(targets),
  "targetCoverage":"PASS","panelInventory":rows,
  "panelTypes":{}}
 for p in panels: report["panelTypes"][p.get("type")]=report["panelTypes"].get(p.get("type"),0)+1
 print(json.dumps(report,indent=2,ensure_ascii=False))
if __name__=="__main__":main()
