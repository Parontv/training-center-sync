#!/usr/bin/env python3
"""Build a safe, explicit API-query manifest from the Garmin dashboard mapping.

This deliberately does not emit Grafana panel JSON: Infinity query configuration and
live field semantics must be validated in Grafana before an importable dashboard is built.
Only mappings marked verified=true with concrete field paths are accepted.
"""
import json, sys
from pathlib import Path

ALLOWED_AGG = {"avg", "min", "max", "sum"}
DATASETS = {"garmin_records", "daily_records"}

def load(p):
    return json.loads(Path(p).read_text(encoding="utf-8"))

def build(mapping):
    entries = mapping.get("mappings", [])
    errors, out = [], []
    seen = set()
    for i, m in enumerate(entries):
        key = (m.get("panelId"), m.get("ref"))
        if key in seen: errors.append(f"duplicate mapping {key}")
        seen.add(key)
        if m.get("verified") is not True: continue
        if m.get("source") not in DATASETS: errors.append(f"{key}: unsupported dataset")
        if not isinstance(m.get("fieldPath"), str) or not m["fieldPath"].strip(): errors.append(f"{key}: missing fieldPath")
        if m.get("aggregation") not in ALLOWED_AGG: errors.append(f"{key}: aggregation must be one of {sorted(ALLOWED_AGG)}")
        if not m.get("sourceDataset"): errors.append(f"{key}: missing sourceDataset")
        if not errors:
            out.append({"panelId":m["panelId"],"panel":m.get("panel"),"ref":m["ref"],
                        "dataset":m["source"],"sourceDataset":m["sourceDataset"],
                        "fieldPath":m["fieldPath"],"aggregation":m["aggregation"],
                        "unit":m.get("unit"),"verified":True})
    if errors: raise ValueError("\n".join(errors))
    return {"format":"garmin-infinity-query-manifest-v1","count":len(out),
            "note":"Only verified explicit mappings are included; no Grafana query or unit inference.",
            "queries":out}

def main():
    if len(sys.argv)!=3:
        print("Usage: build-verified-query-manifest.py <mapping.json> <output.json>")
        sys.exit(2)
    try:
        result=build(load(sys.argv[1]))
    except Exception as e:
        print("FAIL:",e); sys.exit(1)
    Path(sys.argv[2]).write_text(json.dumps(result,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print(f"PASS: manifest generated with {result['count']} verified mappings")

if __name__=="__main__": main()
