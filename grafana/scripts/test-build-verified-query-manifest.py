#!/usr/bin/env python3
import importlib.util, json, tempfile, unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location("builder",Path(__file__).with_name("build-verified-query-manifest.py"))
builder=importlib.util.module_from_spec(spec); spec.loader.exec_module(builder)
class BuilderTests(unittest.TestCase):
 def test_unverified_skipped(self):
  m={"mappings":[{"panelId":1,"ref":"A","verified":False}]}
  self.assertEqual(builder.build(m)["count"],0)
 def test_verified_valid_included(self):
  m={"mappings":[{"panelId":1,"panel":"Steps","ref":"A","verified":True,"source":"daily_records","sourceDataset":"DailyStats","fieldPath":"$.totalSteps","aggregation":"sum","unit":"steps"}]}
  r=builder.build(m); self.assertEqual(r["count"],1); self.assertEqual(r["queries"][0]["fieldPath"],"$.totalSteps")
 def test_verified_missing_path_fails(self):
  m={"mappings":[{"panelId":1,"ref":"A","verified":True,"source":"daily_records","sourceDataset":"DailyStats","aggregation":"avg"}]}
  with self.assertRaises(ValueError): builder.build(m)
 def test_duplicate_key_fails(self):
  m={"mappings":[{"panelId":1,"ref":"A","verified":False},{"panelId":1,"ref":"A","verified":False}]}
  with self.assertRaises(ValueError): builder.build(m)
if __name__=="__main__": unittest.main()
