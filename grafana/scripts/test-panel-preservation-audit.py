#!/usr/bin/env python3
"""Synthetic tests for panel inventory auditing."""
import importlib.util, unittest
from pathlib import Path
class AuditTests(unittest.TestCase):
 def test_counts_and_type_inventory(self):
  # Check key inventory invariants from the cloned dashboard catalog.
  p=Path(__file__).parents[1]/"dashboards"/"garmin-original-clone.json"
  import json
  d=json.loads(p.read_text(encoding="utf-8"))
  self.assertEqual(len(d.get("panels",[])),62)
  ids=[x.get("id") for x in d["panels"]]
  self.assertEqual(len(ids),len(set(ids)))
  self.assertGreater(sum(len(x.get("targets",[])) for x in d["panels"]),0)
if __name__=="__main__": unittest.main()
