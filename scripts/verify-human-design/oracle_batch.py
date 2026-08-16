import sys, json, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from oracle import chart
import swisseph as swe
out = {}
for iso in json.load(sys.stdin):
    out[iso] = chart(iso, swe.TRUE_NODE)
print(json.dumps(out))
