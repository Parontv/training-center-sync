#!/usr/bin/env python3
"""Validate stable Infinity draft preserves source dashboard shape."""
import json,sys
src=json.load(open(sys.argv[1])); out=json.load(open(sys.argv[2]))
assert len(src.get("panels",[]))==len(out.get("panels",[])), "panel count changed"
a=sum(len(p.get("targets",[])) for p in src.get("panels",[])); b=sum(len(p.get("targets",[])) for p in out.get("panels",[]))
assert a==b, f"target count changed {a}->{b}"
for p in out.get("panels",[]):
 for i,t in enumerate(p.get("targets",[])):
  assert t.get("stableMappingKey")==f'{p.get("id")}:{i}',"stable key missing/mismatch"
summary=out.get("stableConversionSummary",{})
assert summary.get("targetsConfigured",0)+summary.get("targetsInert",0)==b
print(f"PASS: preserved {len(out['panels'])} panels and {b} target refs.")
