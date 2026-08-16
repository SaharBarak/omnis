"""Independent HD oracle: pyswisseph (Moshier) + published wheel constants.
Shares NO code with the repo engine."""
import swisseph as swe, sys, json, datetime as dt

FLAGS = swe.FLG_MOSEPH | swe.FLG_SPEED
SEQ = [41,19,13,49,30,55,37,63,22,36,25,17,21,51,42,3,27,24,2,23,8,20,16,35,45,12,15,52,39,53,
       62,56,31,33,7,4,29,59,40,64,47,6,46,18,48,57,32,50,28,44,1,43,14,34,9,5,26,11,10,58,38,54,61,60]
OFFSET = 58.0   # dturkuler/humandesign_api: "HD starts at gate 41"; equivalently 302deg
GATE = 360/64
LINE = GATE/6

BODIES = [("sun",swe.SUN),("moon",swe.MOON),("mercury",swe.MERCURY),("venus",swe.VENUS),
          ("mars",swe.MARS),("jupiter",swe.JUPITER),("saturn",swe.SATURN),("uranus",swe.URANUS),
          ("neptune",swe.NEPTUNE),("pluto",swe.PLUTO)]

def gate_line(lon, offset=OFFSET):
    p = (lon + offset) % 360
    i = int(p // GATE)
    return SEQ[i], int((p % GATE) // LINE) + 1

def jd_of(iso):  # iso UTC 'YYYY-MM-DDTHH:MM:SS'
    d = dt.datetime.fromisoformat(iso.replace('Z',''))
    return swe.utc_to_jd(d.year,d.month,d.day,d.hour,d.minute,d.second+d.microsecond/1e6,swe.GREG_CAL)[1]

def positions(jd, node_flag):
    out = {}
    for name, code in BODIES:
        out[name] = swe.calc_ut(jd, code, FLAGS)[0][0]
    out["earth"] = (out["sun"] + 180) % 360
    nn = swe.calc_ut(jd, node_flag, FLAGS)[0][0]
    out["north-node"] = nn
    out["south-node"] = (nn + 180) % 360
    return out

def chart(iso_utc, node_flag):
    jd = jd_of(iso_utc)
    p = positions(jd, node_flag)
    target = swe.degnorm(p["sun"] - 88)
    jd_design = swe.solcross_ut(target, jd - 95, FLAGS)
    d = positions(jd_design, node_flag)
    y,m,day,h,mi,s = swe.jdut1_to_utc(jd_design, swe.GREG_CAL)
    return {
        "design_utc": f"{y:04d}-{m:02d}-{day:02d}T{h:02d}:{mi:02d}:{int(s):02d}Z",
        "personality": {k: {"lon": round(v,6), "gate": gate_line(v)[0], "line": gate_line(v)[1]} for k,v in p.items()},
        "design":      {k: {"lon": round(v,6), "gate": gate_line(v)[0], "line": gate_line(v)[1]} for k,v in d.items()},
    }

if __name__ == "__main__":
    node = swe.TRUE_NODE if (len(sys.argv) < 3 or sys.argv[2] == "true") else swe.MEAN_NODE
    print(json.dumps(chart(sys.argv[1], node), indent=1))
