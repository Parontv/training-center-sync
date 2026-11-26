#!/usr/bin/env python3
"""Validate the source dashboard and conversion queue without changing either."""
import json
import sys
from pathlib import Path

def load(path):
    with Path(path).open("r", encoding="utf-8") as f:
        return json.load(f)

def fail(message):
    print("FAIL:", message)
    sys.exit(1)

def main():
    if len(sys.argv) != 4:
        print("Usage: audit-conversion-integrity.py <dashboard.json> <semantic-audit.json> <queue.json>")
        sys.exit(2)
    dashboard, audit, queue = map(load, sys.argv[1:])
    panels = dashboard.get("panels", [])
    panel_ids = [p.get("id") for p in panels]
    if len(panels) != 62:
        fail(f"expected 62 panels, found {len(panels)}")
    if len(set(panel_ids)) != len(panel_ids):
        fail("duplicate panel IDs in source dashboard")
    targets = audit.get("targets", [])
    q_targets = [t for p in queue.get("panels", []) for t in p.get("targets", [])]
    if len(targets) != 143 or len(q_targets) != 143:
        fail(f"target counts mismatch: audit={len(targets)}, queue={len(q_targets)}")
    source_target_keys = {(t.get("panelId"), t.get("ref")) for t in targets}
    queue_target_keys = {(p.get("panelId"), t.get("ref")) for p in queue.get("panels", []) for t in p.get("targets", [])}
    if source_target_keys != queue_target_keys:
        fail("queue target keys differ from source semantic audit")
    dashboard_ids = set(panel_ids)
    if any(panel_id not in dashboard_ids for panel_id, _ in queue_target_keys):
        fail("queue references panel IDs absent from dashboard")
    print("PASS: 62 unique source panel IDs")
    print("PASS: 143 source targets represented in conversion queue")
    print("PASS: queue target keys match semantic audit")
    print("PASS: queue panel IDs exist in source dashboard")
    print("NOTE: query semantics, live D1 paths, units, coverage, and Grafana rendering are not validated by this script.")

if __name__ == "__main__":
    main()
