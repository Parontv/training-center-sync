#!/usr/bin/env python3
"""Build a stable inventory of all original Garmin dashboard targets.

Target identity is panelId + targetIndex, never the legacy ref letter.
This preserves source identity even when refs are absent or duplicated.
"""
import json, sys
from pathlib import Path

def read(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))

def main():
    if len(sys.argv) != 4:
        raise SystemExit("Usage: inventory-original-targets.py <dashboard.json> <semantic-audit.json> <output.json>")
    dashboard, audit = map(read, sys.argv[1:3])
    panels = dashboard.get("panels", [])
    audit_targets = audit.get("targets", [])
    panel_by_id = {p.get("id"): p for p in panels}
    rows = []
    for p in panels:
        for idx, target in enumerate(p.get("targets", [])):
            legacy_ref = target.get("refId", target.get("ref"))
            semantic = next((a for a in audit_targets if a.get("panelId")==p.get("id") and (a.get("ref")==legacy_ref or a.get("targetIndex")==idx)), {})
            rows.append({
                "panelId": p.get("id"), "panelTitle": p.get("title"),
                "panelType": p.get("type"), "targetIndex": idx,
                "stableKey": f'{p.get("id")}:{idx}',
                "normalizedRef": chr(65+idx) if idx < 26 else f"T{idx+1}",
                "legacyRef": legacy_ref, "legacyTarget": target,
                "semanticAudit": semantic
            })
    if len(panels) != 62: raise SystemExit(f"Expected 62 panels, found {len(panels)}")
    if len(rows) != 143: raise SystemExit(f"Expected 143 targets, found {len(rows)}")
    keys=[r["stableKey"] for r in rows]
    if len(set(keys)) != len(keys): raise SystemExit("Duplicate stable target keys")
    result={"format":"garmin-original-target-inventory-v1","panelCount":len(panels),"targetCount":len(rows),"identityRule":"panelId:targetIndex","targets":rows}
    Path(sys.argv[3]).write_text(json.dumps(result,indent=2,ensure_ascii=False)+"\\n",encoding="utf-8")
    print(f"PASS: {len(panels)} panels, {len(rows)} targets, stable keys unique")
if __name__=="__main__": main()
