#!/usr/bin/env python3
"""Regression: verified draft targets must contain Worker endpoint parameters."""
import json,tempfile,subprocess,sys,unittest
from pathlib import Path
from urllib.parse import urlparse,parse_qs
SCRIPT=Path(__file__).with_name("draft-infinity-dashboard.py")
class VerifiedTargetUrlTests(unittest.TestCase):
 def test_url_contains_exact_mapping_parameters(self):
  src={"panels":[{"id":9,"targets":[{"ref":"A","original":"kept"}]}]}
  mapping={"mappings":[{"panelId":9,"ref":"A","verified":True,"source":"daily_records","sourceDataset":"DailyStats","fieldPath":"$.steps","aggregation":"sum","unit":"steps"}]}
  with tempfile.TemporaryDirectory() as td:
   a,b,c=[Path(td)/x for x in ("src.json","map.json","out.json")]
   a.write_text(json.dumps(src)); b.write_text(json.dumps(mapping))
   run=subprocess.run([sys.executable,str(SCRIPT),str(a),str(b),str(c)],capture_output=True,text=True)
   self.assertEqual(run.returncode,0,run.stderr)
   target=json.loads(c.read_text())["panels"][0]["targets"][0]
   params=parse_qs(urlparse(target["url"]).query)
   self.assertEqual(params["source"],["daily_records"])
   self.assertEqual(params["dataset"],["DailyStats"])
   self.assertEqual(params["field_path"],["$.steps"])
   self.assertEqual(params["aggregation"],["sum"])
   self.assertEqual(params["limit"],["366"])\n   self.assertNotIn("from",params)\n   self.assertNotIn("to",params)
   self.assertEqual(target["draftMapping"]["unit"],"steps")
   self.assertEqual(target["original"],"kept")
\n def test_mapping_specific_limit_and_dates(self):\n  src={"panels":[{"id":10,"targets":[{"ref":"A"}]}]}\n  mapping={"mappings":[{"panelId":10,"ref":"A","verified":True,"source":"daily_records","sourceDataset":"DailyStats","fieldPath":"$.steps","aggregation":"sum","limit":90,"from":"2026-01-01","to":"2026-03-31"}]}\n  with tempfile.TemporaryDirectory() as td:\n   a,b,c=[Path(td)/x for x in ("src.json","map.json","out.json")]\n   a.write_text(json.dumps(src));b.write_text(json.dumps(mapping))\n   run=subprocess.run([sys.executable,str(SCRIPT),str(a),str(b),str(c)],capture_output=True,text=True)\n   self.assertEqual(run.returncode,0,run.stderr)\n   target=json.loads(c.read_text())["panels"][0]["targets"][0]\n   params=parse_qs(urlparse(target["url"]).query)\n   self.assertEqual(params["limit"],["90"])\n   self.assertEqual(params["from"],["2026-01-01"])\n   self.assertEqual(params["to"],["2026-03-31"])\n\n def test_incomplete_verified_mapping_remains_inert(self):
  src={"panels":[{"id":1,"targets":[{"ref":"A"}]}]}
  mapping={"mappings":[{"panelId":1,"ref":"A","verified":True,"source":"daily_records","sourceDataset":"x","aggregation":"avg"}]}
  with tempfile.TemporaryDirectory() as td:
   a,b,c=[Path(td)/x for x in ("src.json","map.json","out.json")]
   a.write_text(json.dumps(src));b.write_text(json.dumps(mapping))
   run=subprocess.run([sys.executable,str(SCRIPT),str(a),str(b),str(c)],capture_output=True,text=True)
   self.assertEqual(run.returncode,0,run.stderr)
   target=json.loads(c.read_text())["panels"][0]["targets"][0]
   self.assertIn("UNVERIFIED",target["draftStatus"])
if __name__=="__main__":unittest.main()
