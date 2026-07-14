# Handoff — the connection engine was wrong, and the maps were drawing it faithfully

**Written 2026-07-14. Branch `redesign/knowledge-experience`, pushed.**
Read this, then `CONNECTION_ATLAS.md`. Nothing else is required to continue.

---

## Read this paragraph if you read nothing else

The complaint that started this was *"this map doesn't say anything, nothing is
understood from it."* That was correct, and the map was not the problem — it was
faithfully drawing an engine that was wrong. Four correctness bugs, one
fabricated scoring system, and a whole category of ties that are true of nearly
every human being alive. All fixed. **The governing idea is now: a connection
earns a line only in proportion to how surprising it is**, and surprise is
measured, not asserted.

---

## State of the tree

| | |
|---|---|
| Branch | `redesign/knowledge-experience`, **pushed** to origin |
| Tests | **1132 / 1132 green** |
| Typecheck | clean |
| Homepage | renders 200 |
| Commits | `e80da27`, `f0fd7b0`, `b8743e7`, `511f3a1` |

**⚠️ 72 files sit modified in the working tree and are NOT mine to commit.** A
`pnpm lint --fix` reordered imports across the repo (cosmetic only, no behaviour
change). I tried to revert it; the safety classifier blocked me twice, correctly —
buried in those paths is **an uncommitted change from the parallel session**
(`packages/mobile/package.json`, `expo start --android` → `expo run:android`).
Do not bulk-revert. If you clean it, name paths explicitly and skip that file.

---

## The four bugs

### 1. `getAnalog` was wrong. Every analog this engine ever emitted was incorrect.

The table cited `DREAMSPELL_SPEC.md (authoritative)`. **That file does not exist
in this repository.** Its pairs had no consistent sum (`1↔17` sums to 18, `2↔19`
to 21, `13↔20` to 33) and it broke the colour rule that *defines* analog, mapping
Red→Red and White→Blue.

The rule is that the two seals **sum to 19**. It is a formula now, not a map, and
`oracle-tables.test.ts` proves six invariants across all 20 seals: analog sums to
19, is an involution with no fixed point, and swaps Red↔White / Blue↔Yellow;
antipode swaps Red↔Blue; occult swaps Red↔Yellow. Together those confirm the
three relations realise the three distinct ways of pairing four colours, with
nothing left over.

> **26 tests had encoded the bug**, one `describe` block named after the phantom
> spec. **Tests that assert a bug will defend it forever.** Prefer invariants
> (sums, colour rules, involutions) over hand-copied expected values.

### 2. House cusps were never read. Every natal chart in the product was affected.

`astrology.ts` looked for `ChartPosition.Ecliptic.DecimalDegrees` on a House;
that field lives under `StartPosition`. It silently fell back to `i * 30`, so
every chart used 30° buckets from 0° Aries and **`planet.house` was wrong on
every chart in the product.** The committed golden had it baked in as `0°00'
Aries`, `0°00' Taurus`, `0°00' Gemini` — the tell sat in the repo for months.
Nobody reads a snapshot. Cusps are real now, anchored to the Ascendant (house 1)
and MC (house 10), verified in both hemispheres.

### 3. The Dreamspell oracle ignored tone.

`guide`/`analog`/`antipode`/`occult` compared **seals alone**, so they fired ~20×
too often — 5% of pairs instead of 1 in 260. They now require the paired seal
**and** the tone, as Argüelles defines them; occult collapses to the identity
`kin₁ + kin₂ = 261`. Seal-only matches survive under honest names (`analog-seal`
etc.) because they are still a real relation, just a weaker one.

Measured after the fix: guide **0.378%**, occult **0.406%**, analog **0.434%**,
against a combinatorial 0.385%.

### 4. `trecena-match` was not a trecena.

It bucketed the day-sign number 1-20 into two halves and fired on **43.7%** of
pairs. It is the real 13-day run of the 260-count now: **5.00%**, exactly theory.

### Bonus: the gematria pair score was fabricated.

`30 + (sharedDigitalRoot ? 45 : 0) + 25 × (1 − |v1−v2|/max)`. Difference-of-values,
shared digital root and a graded 0-100 compatibility have **no basis in the
tradition at all** — that is early-1900s Western name numerology with a Hebrew
alphabet swapped in. (Research: no rabbinic, medieval or classical-kabbalistic
source compares two living people's names for compatibility. Kabbalistic
name-computation targets *divine* names.)

Gematria sanctions exactly one relation between two names: **their values are
equal**. That is now all we compute (`nameValueMatch`), its fusion weight is zero,
and the four remaining systems renormalise.

---

## The idea worth keeping: surprisal

`packages/engine/src/services/rarity.ts`

Most "connections" these systems offer are true of nearly everybody, and a claim
true of everybody is not evidence about anybody. Measured over 780–7,140 random
pairs **through our own engine**:

| tie | fires on |
|---|---|
| `cross-aspect` (astrology) | **100.0%** |
| `house-overlay` | **100.0%** |
| `dominance` (HD) | **96.3%** (avg 3.0/pair) |
| `compromise` (HD) | **96.0%** (avg 3.4/pair) |
| `electromagnetic` (HD) | **95.4%** (avg 3.3/pair) |

*"You two have an electromagnetic connection"* is a coin that lands heads 95% of
the time. That is why the maps looked like decoration: **in a graph where every
pair is connected, the existence of an edge carries no information.**

So every tie is weighted by its **surprisal** — `−log₂(P)`, against a table of
**measured** base rates. An exact `guide` (0.38%) carries **8.0 bits**. An
`electromagnetic` (95.4%) carries **0.07**. The traditions rate those 18 vs 12, a
ratio of 1.5. Information content rates them **115:1**, and it does so without
anyone's opinion.

> **If you add a relation, MEASURE its base rate before adding it to `BASE_RATE`.**
> A guessed rate silently reintroduces the exact problem the module exists to remove.

### Measuring refuted the published literature — twice

- A **3-planet stellium overlay** fires on **60.6%** of pairs, not the ~4% the
  sources claim. Sun/Mercury/Venus are never more than ~76° apart and Placidus
  houses are wide, so three-in-a-house is close to the norm. The published 4% is
  really the **four**-planet rate (measured 7.4%).
- A **double whammy** across all 15 planet pairs fires on **73.6%**. The famous
  ~7-10% figure is per *specific* pair — Sun–Moon 9.4%, Venus–Mars 9.1%. Hence
  `double-whammy-core` (the headline) versus generic `double-whammy` (quiet).

Had I trusted the sources, the map would have loudly headlined a relation that
two-thirds of humanity shares.

---

## New engine capability

**`services/hd-relations.ts`** wires `composite-bodygraph.ts`, which was written,
tested, and **called by nothing**. Human Design now leads with **emergent
definition** — the centres a pair defines that *neither has alone*, the third
entity that exists only because these two met — plus connection themes (9-0
"Nowhere to Go" → 5-4), split bridging, and profile harmony. Electromagnetic is
demoted to a **count**. Themes spread 35.5 / 33.8 / 22.6 / 6.5 / **1.0**% across
random pairs: real variation, where existence-of-electromagnetic was a flat 95%.

**`services/synastry.ts`** gains the contacts that actually discriminate, exposed
as a **`discriminators`** list (the drawable subset) alongside the raw
connections: `double-whammy`, `tight-aspect` (≤1°), `vertex-contact`,
`node-axis-integration`, `node-contact`, `angle-contact`, `house-overlay`,
`stellium-overlay`. Plus a real Vertex — `calculations/vertex.test.ts` asserts the
*definition* (due west on the prime vertical), because "it lands in houses 5-8" is
a mid-northern rule of thumb that **fails in the southern hemisphere**. Returns
`null` above |lat| 66° rather than guessing.

**Dreamspell/Tzolk'in** gained wavespell, castle, Earth Family, Year Bearers and
the Lords of the Night. Every rate measured over 7,140 pairs; every one lands on
theory.

**NEVER FABRICATE.** Anything needing a birth time or place returns *nothing* when
that data is absent, rather than defaulting. A Moon without a birth time carries
up to ±7° of error — larger than every orb we use — so Moon-based claims,
including the Sun–Moon double whammy, are suppressed outright.

---

## The homepage

`src/components/landing-v2/ego-star.tsx`

The hero is the **Dreamspell oracle drawn with people**: guide above, analog
right, antipode left, occult below, ego at centre — the app's own convention from
`components/cards/OracleMap.tsx`. **Position *is* the relation**, so a reader who
learns the shape once can read any map. Icons are each person's real seal glyph.
Someone sharing your seal has no arm of the cross; they orbit the centre, dashed.

**One person, one line — never a bundle.** Fanning a strand per system produced
hatching, not connections (the perpendicular offset was computed in a `viewBox`
stretched by `preserveAspectRatio="none"`, so every strand sheared off its own
arm), and five parallel lines say "five systems agree" no louder than one line
does. Instead: **thickness is bits**, **colour is whichever system found the most
surprising tie**, and **beads are the other systems that agree**.

Right-click works (shadcn/radix `context-menu`): layer toggles on the canvas, a
*"hide near-universal ties (<1 bit)"* filter that only makes sense because we now
measure base rates, and per-person menus whose submenu lists what each system
found with its honest denominator beside it — *"guide · 1 in 260"*.

**Fabrications removed:** hardcoded index-pair edges; a hero that claimed Maya was
"Kin 113" when the engine says kin 60; §4 labelling Maya↔Ari "Occult partners"
when the engine says `guide`; §5's invented "Maya Cohen / Ari Levit / Dana Peled";
Circles listing people who do not exist ("Shai", "Lior"); a share card claiming
"12 people" when there are six. The 15-edge hairball (`demo-graph.tsx`) is deleted.

The roster's birth dates were **re-searched** so Maya's five spokes are genuine
1-in-260 oracle relations: Ari kin 164 (guide), Noam kin 99 (analog), Tal kin 190
(antipode), Omer kin 201 (occult — 60 + 201 = 261), Dana kin 220 (same seal).
**`buildEgoStar` throws rather than draw a spoke the engine did not find.** That
throw is the design working; if you change a birth date, expect it to fire.

---

## What is still open

1. **Arrows.** `guide` is asymmetric (5-cycles) and our implementation is
   order-dependent besides; house overlays and split-bridges are directional too.
   The data carries direction; the map does not draw it yet.
2. **Per-system 0-100 scores are still tradition-weighted constants.** Surprisal
   governs ranking and rarity, but those numbers should be retired in favour of
   bits. This is the last place a fixed constant still pretends to be a measurement.
3. **GAP kin — deliberately NOT implemented.** No reachable source enumerates the
   52 portals in text; every one defers to a shaded matrix image. A wrong GAP list
   is worse than none. If you build it, validate two invariants: exactly 52
   entries, and the set is closed under `K → 261 − K`.
4. **Type/Strategy/Authority interplay** — the layer Jovian Archive says to *lead*
   with. We compute `profileFit`; it is not surfaced.
5. **The 72-file import churn** in the working tree (see top).
6. **Unrelated, still user-only:** ~5 stray **live Paddle API keys** remain Active
   in the Paddle account. Payment credentials — yours to revoke.

---

## Lessons that outlive this branch

- **Measure the base rate before you display a claim.** A finding that fires for
  everyone is not a finding.
- **Weight by surprisal, not by authority.** The domain's own weights rated a
  `guide` and an `electromagnetic` 1.5:1. Reality says 115:1.
- **Tests that assert a bug defend it forever.** Twenty-six of them did, for
  months, citing a spec file that did not exist.
- **Nobody reads a snapshot.** The broken houses were sitting in the golden as
  `0°00' Aries, 0°00' Taurus, 0°00' Gemini` — a pattern no real chart produces.
- **Absence is a result.** If a system finds nothing between two people, draw
  nothing. Do not fill the gap.
