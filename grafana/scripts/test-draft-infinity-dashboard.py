#!/usr/bin/env python3
import unittest
# Synthetic behavior checks by invoking the script in a temporary workspace.
import json,tempfile,subprocess,sys
from pathlib import Path
SCRIPT=Path(__file__).with_name("draft-infinity-dashboard.py")
class DraftTests(unittest.TestCase):
 def test_preserves_panels_and_marks_unverified(self):
  src={"title":"Test","panels":[{"id":7,"title":"x","type":"stat","targets":[{"ref":"A","query":"original"}]}]}
  mapping={"mappings":[{"panelId":7,"ref":"A","verified":False}]}
  with tempfile.TemporaryDirectory() as td:
   a,b,c=[Path(td)/x for x in ("src.json","map.json","out.json")]
   a.write_text(json.dumps(src));b.write_text(json.dumps(mapping))
   r=subprocess.run([sys.executable,str(SCRIPT),str(a),str(b),str(c)],capture_output=True,text=True)
   self.assertEqual(r.returncode,0,r.stderr)
   d=json.loads(c.read_text());p=d["panels"][0]
   self.assertEqual(p["id"],7);self.assertEqual(p["type"],"stat")
   self.assertTrue(p["targets"][0]["draftOnly"])
   self.assertEqual(p["targets"][0]["draftStatus"],"UNVERIFIED - query intentionally not configured")
 def test_verified_mapping_configured(self):
  src={"panels":[{"id":2,"targets":[{"ref":"B"}]}]}
  mapping={"mappings":[{"panelId":2,"ref":"B","verified":True,"source":"daily_records","sourceDataset":"DailyStats","fieldPath":"$.steps","aggregation":"sum"}]}
  with tempfile.TemporaryDirectory() as td:
   a,b,c=[Path(td)/x for x in ("src.json","map.json","out.json")]
   a.write_text(json.dumps(src));b.write_text(json.dumps(mapping))
   r=subprocess.run([sys.executable,str(SCRIPT),str(a),str(b),str(c)],capture_output=True,text=True)
   self.assertEqual(r.returncode,0,r.stderr)
   t=json.loads(c.read_text())["panels"][0]["targets"][0]
   self.assertEqual(t["draftMapping"]["fieldPath"],"$.steps")
if __name__=="__main__":unittest.main()
