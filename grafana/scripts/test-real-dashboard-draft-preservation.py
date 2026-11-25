#!/usr/bin/env python3
"""Regression test: real source dashboard draft preserves panel identity and structure."""
import json, subprocess, sys, tempfile, unittest
from pathlib import Path
ROOT=Path(__file__).parents[1]
DASH=ROOT/"dashboards"/"garmin-original-clone.json"
MAPPING=ROOT/"dashboards"/"garmin-infinity-field-mapping-template.json"
SCRIPT=Path(__file__).with_name("draft-infinity-dashboard.py"
class RealDashboardDraftTests(unittest.TestCase):
 def test_draft_preserves_62_panel_identity_and_layout(self):
  src=json.loads(DASH.read_text(encoding="utf-8"))
  mapping=json.loads(MAPPING.read_text(encoding="utf-8"))
  with tempfile.TemporaryDirectory() as td:
   out=Path(td)/"draft.json"
   run=subprocess.run([sys.executable,str(SCRIPT),str(DASH),str(MAPPING),str(out)],capture_output=True,text=True)
   self.assertEqual(run.returncode,0,run.stderr+run.stdout)
   draft=json.loads(out.read_text(encoding="utf-8"))
  self.assertEqual(len(src["panels"]),62)
  self.assertEqual(len(draft["panels"]),62)
  self.assertEqual([p.get("id") for p in src["panels"]],[p.get("id") for p in draft["panels"]])
  for original,converted in zip(src["panels"],draft["panels"]):
   for key in ("id","title","type","gridPos","fieldConfig","options","transformations","links","description"):
    self.assertEqual(original.get(key),converted.get(key),f"panel {original.get('id')} changed {key}")
   self.assertEqual([t.get("ref") for t in original.get("targets",[])],[t.get("ref") for t in converted.get("targets",[])])
  self.assertEqual(len(mapping["mappings"]),143)
if __name__=="__main__":unittest.main()
