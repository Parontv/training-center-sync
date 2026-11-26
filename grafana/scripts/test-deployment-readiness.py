#!/usr/bin/env python3
"""Deployment readiness checks: prevent secret leakage and ensure datasource consistency."""
import json,sys
d=json.load(open(sys.argv[1]))
uid="training-center-d1"
for p in d.get("panels",[]):
 for t in p.get("targets",[]):
  u=t.get("url","")
  assert "Bearer " not in u and "SYNC_BEARER_TOKEN" not in u, "credential leaked into query"
  if t.get("datasource"): assert t["datasource"].get("uid")==uid or t["datasource"].get("uid")=="REPLACE_WITH_INFINITY_UID"
print("PASS: artifact has no inline bearer credential.")
