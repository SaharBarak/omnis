# Human Design — external verification

The engine's own tests can only prove it is self-consistent. These scripts check
it against sources that share no code with this repo.

## The chain of trust

| Layer | Source | What it establishes |
|---|---|---|
| Astronomy | [NASA JPL Horizons](https://ssd.jpl.nasa.gov/horizons/) — `ObsEcLon`, apparent geocentric ecliptic-of-date longitude | Planetary longitudes are right |
| Wheel | Published Rave Mandala degree table (e.g. barneyandflow.com/gate-zodiac-degrees) | Gate 41.1 opens at 2°00′00″ Aquarius = 302.000°, and all 64 boundaries follow |
| HD rules | [`dturkuler/humandesign_api`](https://github.com/dturkuler/humandesign_api) — Python + Swiss Ephemeris, sourced to Ra Uru Hu's BlackBook | Same 302° anchor (`IGING_offset = 58`), design solved as an exact 88° solar crossing, true node |
| Node convention | Published HD transit data: the 2026 nodal shift into gates 30/29, dated 25 July 2026 08:20 UTC | True node matches to the hour; mean node is 22 days late |

`oracle.py` re-implements the chart from Swiss Ephemeris using those constants.
`compare.ts` runs both engines over hundreds of randomised births and diffs
every one of the 26 activations.

## Running it

```bash
python3 -m venv .venv && .venv/bin/pip install pyswisseph
HD_ORACLE_PYTHON=.venv/bin/python npx tsx scripts/verify-human-design/compare.ts 400
```

## Interpreting the result

Expect roughly 0.05% mismatches, and every one should be a body sitting within
about 20 arcseconds of an exact gate or line boundary — the point where two
independent ephemerides disagree by less than their own error bars. Anything
else, or a mismatch away from a boundary, is a real defect.

For scale: one minute of error in a recorded birth time moves the Moon 33
arcseconds, so this residual is already below the noise floor of the input.

A frozen subset of the oracle's output lives in
`packages/engine/src/calculations/human-design.test.ts` under "Golden charts",
so the offline test suite keeps guarding these values without needing Python.
