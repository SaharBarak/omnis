# The Connection Atlas

**Every relation two people can have in Pleiad — what it means, how often it fires, whether we compute it correctly, and whether it has earned the right to be drawn.**

Status: research complete, engine audited, base rates measured. Written 2026-07-13.
Companion to `HOMEPAGE_REDESIGN.md`. This document is the authority for what the maps may draw.

---

## 0. The one idea this document exists to enforce

A relation is worth drawing **only in proportion to how surprising it is.**

We measured every tie the engine can emit across **780 random pairs** (40 synthetic people, deterministic seed, full natal + bodygraph + kin + gematria). The result:

| Tie the engine emits | Fires on | Verdict |
|---|---|---|
| `cross-aspect` (astrology) | **100.0%** | Says nothing |
| `dominance` (HD) | **96.3%** (avg 3.0/pair) | Says nothing |
| `compromise` (HD) | **96.0%** (avg 3.4/pair) | Says nothing |
| `electromagnetic` (HD) | **95.4%** (avg 3.3/pair) | Says nothing |
| `element` (astrology) | 74.6% | Background, not a finding |
| `trecena-match` (tzolkin) | 43.7% | Coin flip — *and misnamed, see §4* |
| `companionship` (HD) | 31.7% | Weak signal |
| `same-color` (dreamspell) | 21.2% | Weak |
| `same-tone` (dreamspell) | 15.1% | Weak |
| `antipode` | 5.3% | **Selective** — but computed too loosely (§3) |
| `occult` | 5.1% | **Selective** — but computed too loosely (§3) |
| `same-sign` (tzolkin) | 5.0% | Selective |
| `analog` | 4.5% | **Selective** — but computed too loosely (§3) |
| `same-seal` | 4.4% | Selective |
| `guide` | 3.1% | **Selective** — but computed too loosely (§3) |
| gematria pair score | **100%** (floor of 30) | **Fabricated — see §5** |

Two independent confirmations that these numbers are sound: a Monte Carlo over 200k random pairs (run during the Human Design research) put electromagnetic at ~98% against our measured 95.4%; and the astrology combinatorics predict ~27 inter-aspects between any two charts, which is why `cross-aspect` never fails to fire.

**"You two have an electromagnetic connection" is a coin that lands heads 97% of the time.** So is every astrology aspect claim. A map whose lines are drawn from near-universal ties is a map where the *existence* of a line carries no information — which is precisely the hairball we started with.

**The principle, from the astrology research and applicable to every system: weight a hit by its surprisal (−log of its base rate), not by a tradition-assigned "importance" constant.** No scheme in the wild does this. It is the honest way to build a score that distinguishes pairs instead of flattering all of them.

---

## 1. Tiers — the only classification that matters

Every relation below is sorted into one of four tiers. The tier decides what the UI may do with it.

| Tier | Base rate | What the UI may do |
|---|---|---|
| **T0 — Structural** | ~100% | Never a line. May be *background* (a shape, a wash, a balance bar). Never a "finding." |
| **T1 — Common** | 20–75% | Never a headline. May appear in a detail panel, never as an edge on a map. |
| **T2 — Selective** | 3–20% | May be drawn as an edge. Must be named. |
| **T3 — Rare** | <3% | The headline. Draw it loud. This is what the product is for. |
| **T✗ — Fabricated** | — | Must not be computed, scored, or shown. Delete. |

---

## 2. Astrology

### What the tradition actually defines

Synastry compares two natal charts. The complete inventory: inter-aspects (a cross-matrix of every planet in A against every planet in B), house overlays (B's planets dropped into A's houses — asymmetric, so always computed twice), the derived single charts (composite = midpoints, conceptual, never existed in time; Davison = the average birth *moment* at the average *place*, a real chart that can legitimately be transited), contacts to the angles (ASC/DSC/MC/IC) and nodes and Vertex, and element/modality balance.

### The base-rate problem, stated exactly

With standard synastry orbs (conjunction/opposition 8°, trine/square 6°, sextile 4°), the aspect windows cover **96° of 360° = 26.7%**. Any given planet pair is therefore in aspect ~27% of the time. Across 100 ordered cross-pairs of 10 planets, you expect **~27 inter-aspects between any two people**. The probability two charts share *no* major aspect is effectively zero.

Restricting to the four personal planets still gives P(at least one contact) ≈ **99.3%**.

**Orb choice *is* the model.** At a 1° orb, coverage drops to 4.4% and expected hits fall to ~4-5.

### The relation table

| Relation | Definition | Base rate | Tier | Engine? |
|---|---|---|---|---|
| Any inter-aspect | Any of 5 major aspects between any two planets | ~100% | **T0** | ✅ `cross-aspect` |
| Any personal-planet contact | Sun/Moon/Venus/Mars cross-contacts | ~99% | **T0** | ✅ (subsumed) |
| Saturn hard aspect to a personal planet | Routinely sold as a "red flag" | **~81%** | **T0** | ✅ (subsumed) |
| Element/modality relation | Sun-sign element comparison | Always defined | **T0** | ✅ `element` |
| Any Sun–Moon aspect | Either direction | ~46% | **T1** | ✅ (subsumed) |
| 7th-house overlay (≥1 planet) | B's planet in A's 7th | ~58% | **T1** | ❌ no houses |
| Personal planet within 3° of an angle | | ~41% | **T1** | ❌ |
| Sun–Moon conjunction ≤8° | | ~9% | **T2** | ⚠️ emitted, not distinguished |
| Personal planet conj Node ≤3° | | ~24% | **T1** | ❌ nodes excluded |
| Any contact held to ≤1° orb | Tightness *is* the signal | ~15% | **T2** | ❌ orb computed, not thresholded |
| **Double whammy** (Arroyo) | Same two planets aspect *both* ways: A♀→B♂ **and** B♀→A♂ | **~7%** (lit. reports ~10%) | **T3** | ❌ |
| **Vertex conjunction ≤1°** | The "fated encounter" point | **~8.5%** | **T3** | ❌ |
| **Node axis conj partner's ASC/DSC axis** | "Structural integration" | **~7%** | **T3** | ❌ |
| **3+ planet stellium in one house** | Cluster overlay | **~4%** | **T3** | ❌ |
| "Their dominant element is my missing element" | | selective | **T2** | ❌ |
| Composite / Davison chart | A derived chart, not a test | Always produces one | **T0** | ❌ |

### What we do today, and what's wrong with it

`synastry.ts` iterates 6 key planets × 6 (36 ordered combos), first-match-wins on 5 aspects, and scores `base × pairWeight × (1 − orb/maxOrb)`. It is the **only** system producing genuinely varying per-pair scores. But:

- It excludes **outer planets, nodes, Lilith** (`KEY_PLANETS`, synastry.ts:62).
- It has **no house overlays** — lat/lng are passed but default to 0/0 and are effectively unused. This is the most common way consumer apps fabricate; we simply don't do it.
- 🔴 **HOUSE CUSPS WERE NEVER READ AT ALL.** `astrology.ts` looked for `ChartPosition.Ecliptic.DecimalDegrees` on a House — a field that does not exist on that object (the library nests it under `ChartPosition.StartPosition.Ecliptic`). It silently fell back to `i * 30`, so **every natal chart this engine has ever produced used 30° buckets from 0° Aries as its houses, and `planet.house` was wrong on every chart.** The golden snapshot had it baked in, recording cusps as exactly `0°00' Aries`, `0°00' Taurus`, … — the tell was sitting in the repo the whole time. Fixed; cusps are now real and anchored to the Ascendant (house 1) and MC (house 10), verified in both hemispheres.
- It declares a **private `ASPECT_DEFS`** and never imports `data/aspects.ts`, so the quincunx/semi-sextile in that file are dead.
- It never computes reciprocity, so **the double whammy — the single best discriminator available from date+time — is invisible to us.**

### Data requirements (non-negotiable)

- Sun/Mercury/Venus/Mars/Jupiter/Saturn/outers: **birth date suffices.**
- **Moon: requires birth time.** It moves 12-15°/day, so a noon default carries up to **±7° error — larger than every orb we use.** Any Moon claim without a birth time is unsupportable, and that includes the Sun–Moon double whammy.
- **Houses, angles, Vertex: require exact time AND place.** No time → do not render. The Vertex is additionally undefined near the poles (|lat| ≳ 66°) — guard it.

### ⚠️ Two published base rates that our measurement REFUTES

The literature figures in the table above were taken from the research. Measuring them against our own engine over 780 pairs contradicted two of them, and the measurement wins:

| Claim | Literature | **Measured** | Why the sources are wrong |
|---|---|---|---|
| 3-planet stellium overlay | ~4% | **60.6%** | Sun/Mercury/Venus are never more than ~76° apart and Placidus houses are wide, so three-in-a-house is close to the norm. The published "~4%" is really the **four**-planet rate — which we measure at **7.4%** (and 5+ at 0.1%). Tier the stellium by cluster SIZE, never by the word. |
| Double whammy | ~7% | **73.6%** | The famous figure is per SPECIFIC planet pair. Detected across all 15 pairs, reciprocity is the norm. The canonical ones do land where the sources say: **Sun–Moon 9.4%, Venus–Mars 9.1%** — so `double-whammy-core` is the headline and the generic `double-whammy` is quiet. They are scored as different relations because they are different relations. |

This is the whole method working: a rate asserted by tradition, checked against the engine, and corrected. Everything else corroborated — Vertex 5.8% (lit. 8.5%), node-axis 7.8% (7%), node-contact 28.1% (24%), angle-contact 49.7% (41%).

### Verdict

Astrology stops being an edge on the map. Its aspects are T0 and always will be. It re-enters as **T3 only**: double whammies, ≤1° contacts, Vertex hits, nodal-axis integration, stellium overlays. Those need a synastry rewrite (reciprocity + nodes + angles + houses). Until then, astrology is background, not a line.

---

## 3. Dreamspell

### The canonical oracle — and our bug

From the seal `S = ((K−1) mod 20)+1` and tone `T = ((K−1) mod 13)+1`. Because gcd(13,20)=1, seal and tone are **independent** and `K ↔ (S,T)` is a bijection.

| Position | Canonical rule | Closed form on kin | Symmetric? |
|---|---|---|---|
| **Guide** | `S_g ≡ S + 12(T−1) mod 20`, **same tone** | `K + 52·((T−1) mod 5)` | **No** — 5-cycles per color; self-guided at tones 1, 6, 11 |
| **Analog** | `S_a ≡ 19 − S mod 20`, **same tone** | (CRT) | Yes — perfect matching |
| **Antipode** | `S_p ≡ S + 10 mod 20`, **same tone** | `K + 130` | Yes |
| **Occult** | `S_o ≡ 21 − S mod 20`, **and tone `14 − T`** | **`261 − K`** | Yes |

Analog, antipode and occult realize the three distinct ways of pairing the four colors (R-W/B-Y, R-B/W-Y, R-Y/W-B). Nothing is left over. The guide is the only tone-dependent position and the only one that can equal the kin itself.

> ### 🔴 THE BUG
> **Our engine compares seals only and ignores tone.** `compatibility.ts:142-187` tests `p2.seal === getAnalog(p1.seal)` and never checks that the tones match. Occult tests `21 − seal` and never applies `14 − tone`.
>
> So what we ship as "analog" is **"shares your analog seal"** — a 1-in-20 event (measured: 4.5%). The canonical relation is **1 in 260 (0.385%)**.
>
> We are drawing a loose approximation and labelling it with the strict name. The intuition "analog = 1/20" is simply wrong: someone is your analog only if they *also* share your tone.

### The relation table

| Relation | Definition | Canonical rate | Our measured rate | Tier | Engine |
|---|---|---|---|---|---|
| **Same kin** ("galactic twin") | identical S and T | **1/260 = 0.385%** | — | **T3** | ❌ not emitted |
| **Guide** (exact) | same tone + guide seal | **0.385%** | 3.1% *(seal-only)* | **T3** | ⚠️ **loose** |
| **Analog** (exact) | same tone + analog seal | **0.385%** | 4.5% *(seal-only)* | **T3** | ⚠️ **loose** |
| **Antipode** (exact) | same tone + antipode seal | **0.385%** | 5.3% *(seal-only)* | **T3** | ⚠️ **loose** |
| **Occult** (exact) | `K + K′ = 261` | **0.385%** | 5.1% *(seal-only)* | **T3** | ⚠️ **loose** |
| Any oracle position at all | union of the four | **1.45%** | — | **T3** | — |
| Same seal (Solar Tribe) | S equal | 5.0% | 4.4% ✅ | **T2** | ✅ |
| Same wavespell | ⌈K/13⌉ equal | 5.0% | — | **T2** | ❌ table exists, unused |
| Same tone | T equal | 7.7% | 15.1% ⚠️ | **T2** | ✅ *(double-counted: dreamspell + tzolkin both emit `same-tone`)* |
| Same Earth Family | (S−1) mod 5 | 20% | — | **T1** | ❌ |
| Same castle | ⌈K/52⌉ equal | 20% | — | **T1** | ❌ table exists, unused |
| Same color / clan | (S−1) mod 4 | 25% | 21.2% ✅ | **T1** | ✅ `same-color` |
| Both GAP kin | both in the 52 portals | 4% | — | **T2** | ❌ (see caution below) |

### Canonical vs. folk — say this out loud

Argüelles defines the **oracle of a single kin**. He does **not** define a compatibility doctrine between two people. The leap from "analog is the supportive position in *my* oracle" to "a person whose kin is my analog is my ideal partner" is **community practice, not doctrine.** We may use it — the whole community does — but we label it honestly and never imply it is Argüelles', let alone Maya.

### Dreamspell is not the Mayan calendar

Non-negotiable product rule. Argüelles acknowledged Dreamspell as a syncretic modern creation. It **ignores February 29**, so it drifts one day further from the traditional count every four years. The seal names (Dragon, Wind, Night…) are his English coinages over the real day-signs (Imix, Ik', Ak'b'al…). The oracle, the Castles, the GAP kin, the 13-Moon year — none are Maya. **Never label Dreamspell output "Mayan."**

### GAP kin — do not ship from memory

The 52 Galactic Activation Portals are defined by the shaded cells of the Tzolkin matrix; no reachable source enumerates them in text. If we implement them, derive from an authoritative matrix and validate two invariants: exactly 52 entries, and the set is closed under `K → 261 − K`. A wrong GAP list is worse than no GAP list.

---

## 4. Tzolk'in (traditional)

### The relation table

| Relation | Definition | Base rate | Tier | Engine |
|---|---|---|---|---|
| Same day sign (nawal) | of 20 | 5.0% | **T2** | ✅ `same-sign` |
| Same trecena | Same 13-day period of the **260-count** | 5.0% | **T2** | 🔴 **not what we compute** |
| Same tone | of 13 | 7.7% | **T2** | ✅ (but see double-count above) |
| Year Bearer relation | Only 4 of 20 signs can open a year | — | **T2** | ❌ |
| Lords of the Night (9-cycle) | Attested throughout Classic inscriptions | 11% | **T1** | ❌ |

> ### 🔴 `trecena-match` IS NOT A TRECENA
> We compute `Math.floor((daySign − 1) / 13)` — bucketing the day-sign number 1-20 into two halves (signs 1-13 → bucket 0; signs 14-20 → bucket 1). That is not a trecena in any sense. It is why the tie fires on **43.7%** of pairs.
>
> A real trecena is the 13-day period beginning at each `1 <day sign>` — position in the 260-day cycle, of which there are 20. Sharing one is a **5%** event and a genuinely meaningful grouping (the highland tradition reads the trecena as a theme over its 13 days).
>
> Fix the computation or delete the tie. Do not ship a 43.7% coin flip under a traditional name.

### Honesty about the tradition

Attested: the birth day-sign as **nawal** (character/essence), the trecena theme, day auguries, and daykeepers (*aj q'ij*) being consulted to choose auspicious days. **Not attested:** any day-sign-to-day-sign compatibility matrix between two people. The "Mayan compatibility calculators" online are modern constructions, most of them silently importing Dreamspell's analog/antipode/occult logic onto Maya day names. We must not do the same thing and call it traditional.

---

## 5. Human Design

### The four channel connections (canonical, and near-universal)

For each of 36 channels, look at which of its two gates each person holds:

| Type | A holds | B holds | Meaning |
|---|---|---|---|
| **Electromagnetic** | one gate | the *other* gate | Channel exists **only in the pair**. Attraction/repulsion. |
| **Companionship** | both | both | Sameness. Ease, and identical blind spots. |
| **Dominance** | both | neither | A conditions B in that circuit. |
| **Compromise** | both | exactly one | B's gate is overwritten by A's whole channel. |

### The base rates kill three of the four

| Type | Our measurement (780 pairs) | Independent Monte Carlo (200k pairs) | Tier |
|---|---|---|---|
| Electromagnetic | **95.4%**, avg 3.3, max 9 | ~98%, avg 3.7 | **T0** |
| Dominance | **96.3%**, avg 3.0, max 8 | very high | **T0** |
| Compromise | **96.0%**, avg 3.4, max 12 | very high | **T0** |
| Companionship | **31.7%**, avg 1.3, max 6 | ~35%, avg 0.44 | **T1/T2** |

Two full bodygraphs almost always share one gate of *some* channel. **The existence of an electromagnetic is noise. Only its count and location are signal** — zero electromagnetics is the rare state (~2%); six or more is genuinely high.

### What actually carries signal (the lineage agrees)

| Relation | Why it matters | Tier | Engine |
|---|---|---|---|
| **Type/Strategy/Authority interplay** | Jovian Archive says lead with this. Structural, deterministic. | **Primary** | ⚠️ crude — a flat `TYPE_DYNAMICS` modifier, never surfaced as a relation |
| **Emergent centers** | Centers the pair defines that **neither has alone** — the "third entity" | **T3** | ✅ **built and unused** — `composite-bodygraph.ts` |
| **Emergent channels** | Same, at channel level | **T3** | ✅ **built and unused** |
| **Connection theme (9-0 … 5-4)** | # centers defined in composite. Low-variance, high-information scalar. | **T2** | ❌ derivable from the above |
| **Split bridging** | B holds the gate closing the gap between A's two islands of definition | **T3** | ⚠️ derivable, not exposed |
| **Companionship channels** | The rare channel-level signal | **T2** | ✅ |
| Electromagnetic *count* | Not existence — count and circuit | **T2** | ⚠️ emitted, not counted |
| Profile harmony (1↔4, 2↔5, 3↔6) | Canonical (Bunnell). Resonance = same line. | **T2** | ❌ profile computed, never compared |
| Incarnation cross compatibility | **Not lineage-standard.** Do not invent it. | **T✗** | ❌ (good) |

> ### 💡 THE BURIED TREASURE
> `services/composite-bodygraph.ts` already computes `buildCompositePair` → `emergentChannelIds` and `emergentCenters` (what the couple defines that neither has alone), and `buildPenta` for groups of 3-5 — the canonical Ra form for group analysis ("when three people gather, their auras morph into a Pentic aura"). It is tested. **Nothing calls it.**
>
> This is the highest-signal HD relation we have, it is already written, and it is the correct thing to draw instead of "electromagnetic."

### Data requirements

**Human Design requires birth time + lat + lng for BOTH people.** Without them the engine returns `available: false` and redistributes the weight. Never render an HD tie from a date alone.

---

## 6. Gematria

> ### 🔴 THE GEMATRIA PAIR SCORE IS FABRICATED. DELETE IT.

### What the tradition actually sanctions

Gematria has exactly **one** relational primitive: **two words with an equal value may be linked.** It is rule 29 of the 32 hermeneutic rules — an **aggadic** (homiletic) device, explicitly not halakhic. Encyclopaedia Judaica: little significance in halakhah; functions as a hint or mnemonic.

And even equality proves nothing on its own. The Chabad formulation, which ought to govern this whole domain: an equal value only shows two words draw on the same quantum of divine energy — **an inner link exists only where a conceptual relationship is already independently known.** Gematria *illuminates* a relation; it does not create one. The *kolel* rule (Cordovero, *Pardes Rimonim*, 1549) licenses ±1 on any value, which is exactly why matches are cheap and why the technique can be made to support opposing conclusions.

### What has no traditional basis whatsoever

| Operation | Status |
|---|---|
| Equal value between two names | **Traditional** (and narrow) |
| Shared root / wordplay on a name (*notarikon*, *midrash shem*) | **Traditional — and involves zero arithmetic** |
| **Difference between two names' values** | **Fabricated** |
| **Ratio between two values** | **Fabricated** |
| Shared factors / GCD / divisibility | **Fabricated** |
| Shared-letter counts implying affinity | **Fabricated** |
| **Graded 0–100 compatibility score** | **Fabricated wholesale** |

There is no rabbinic, medieval, or classical-kabbalistic source comparing two living people's names for compatibility. That machinery is early-1900s Western name numerology — the word "numerology" was coined ~1907 — with the Hebrew alphabet swapped in. Kabbalistic name-computation targets **divine** names (amulets, *milui*, permutations), not couples. The Talmudic statement on matches (*bat ploni li-ploni*) is a heavenly announcement, **not arithmetic**.

### What our engine does

```
gematriaCompatibilityScore = 30
                           + (sharedDigitalRoot ? 45 : 0)
                           + round(25 × (1 − min(|v1−v2|, max) / max))
```
A floor of 30. A shared-digital-root bonus. A term decaying with the **difference** between values. **Every one of those three operations is on the fabricated list**, the floor guarantees it fires on 100% of pairs with two names, and it is weighted at **10% of every compatibility score in the product.**

### Verdict

- **Delete** `gematriaCompatibilityScore` and the `name-resonance` tie. Renormalize the fusion over the four remaining systems.
- **Keep** gematria as a **per-person reading**: the name's value, its letters, and its notable-number correspondences — 18 *chai*, 26 YHVH, 13 *ahava*/*echad*, 86 *Elohim* = *ha-teva*. All genuinely traditional and genuinely interesting.
- **The only pair relation we may ever draw** is the one the tradition sanctions: an **exact value match** between two names. It is rare, it is honest, and it is worth drawing *because* it almost never appears.

---

## 7. What the maps draw, after all of this

### The hero map — the Oracle of People (already built)

The Dreamspell oracle cross, with people in place of seals: **guide above, analog right, antipode left, occult below**, ego at center; `same-seal` orbits on the diagonal, dashed. This is the app's own convention (`components/cards/OracleMap.tsx`), and position *is* the relation.

**Required fix:** the oracle relations must become **exact (seal + tone)**, per §3. The demo roster's birth dates must then be re-searched so the five spokes still hold — at 1-in-260 each, they will not survive by luck, and `buildEgoStar` already throws rather than draw a spoke the engine didn't find. That throw is the design working.

### The layer selector (already built)

One strand per selected system, per pair. But the layers must be re-sourced:

| Layer | Draws today | Must draw instead |
|---|---|---|
| **Dreamspell** | seal-level oracle (~5%) | **exact oracle** (0.385%) |
| **Tzolkin** | fake `trecena-match` (43.7%) | **real trecena** (5%), same day-sign (5%) |
| **Human Design** | `electromagnetic` (95.4% — noise) | **emergent centers/channels** (the third entity), companionship, EM *count* |
| **Astrology** | `cross-aspect` (100% — noise) | **double whammy** (7%), ≤1° contacts, Vertex (8.5%), nodal-axis (7%) |
| **Gematria** | fabricated score (100%) | **exact value match only** — or no layer at all |

### The rendering rules that follow

1. **No line without a name.** Every edge states the relation the engine found.
2. **No line for a T0/T1 relation.** If it fires on most pairs, it is background or a detail-panel row — never an edge.
3. **A number may only be shown if it varies per pair.** Today, dreamspell/tzolkin/HD scores are sums of fixed constants (`guide` is *always* 18 for everyone) — so the tie score must never be rendered as if it measured *these two people*. Only astrology's orb-weighted score and a rarity-weighted fusion qualify.
4. **Absence is a result.** If a system found nothing between two people, its layer shows no strand. Never fill the gap.
5. **Direction matters.** `guide` is asymmetric (5-cycles, and it depends on p1's tone) — and our implementation is order-dependent, so `f(a,b) ≠ f(b,a)`. House overlays are asymmetric too. A relationship map must draw arrows where the relation is directed.
6. **Score by surprisal.** Weight a hit by −log(base rate), not by a tradition-assigned constant.
7. **Never call Dreamspell "Mayan."**

---

## 8. Work queue, in dependency order

1. ✅ **DONE — Deleted the gematria pair score.** `gematriaCompatibilityScore` is gone; `nameValueMatch` replaces it (exact value equality only). Gematria's fusion weight is 0 and it never appears in `availableSystems`. The four remaining weights renormalize. *(§6)*
2. ✅ **DONE — The Dreamspell oracle is now exact (seal + tone).** `same-kin` added. The seal-only echoes survive as `analog-seal` / `antipode-seal` / `occult-seal` / `guide-seal`. Measured after the fix: guide **0.13%**, occult **0.26%**, antipode **1.15%** (theory 0.385% each) — down from ~5%. *(§3)*
3. ✅ **DONE — `trecena-match` is a real trecena.** Computed from the opening day-sign of the 13-day run. Measured: **43.7% → 5.00%**, exactly the theoretical rate. *(§4)*
4. ⚠️ **NOT A BUG — `same-tone` is emitted by both Dreamspell and Tzolkin, and they are different counts** (different correlations), so both are legitimately true. The 15.1% figure is their *union*; each fires at ~7.7% as theory predicts. The UI must label them by system rather than collapsing them.
5. ✅ **DONE — Human Design now leads with emergent definition.** `services/hd-relations.ts` wires `composite-bodygraph.ts`: emergent centres/channels (the third entity), the connection themes 9-0 → 5-4, split bridging, profile harmony (1↔4/2↔5/3↔6), and electromagnetic as a COUNT. Measured over 780 pairs: emergent centre 56.2%, split bridge 36.3%, and the themes spread 35.5 / 33.8 / 22.6 / 6.5 / **1.0**% — a real distribution, where existence-of-electromagnetic was a flat 95%. *(§5)*
6. ✅ **DONE — Synastry rewritten.** Eight new contact types, exposed as a `discriminators` list (T2/T3 only) alongside the raw `connections`: `double-whammy`, `tight-aspect` (≤1°), `vertex-contact`, `node-axis-integration`, `node-contact`, `angle-contact`, `house-overlay`, `stellium-overlay`. Anything needing a birth time or place returns nothing when that data is absent — never a default. *(§2)*
   - **Two bugs found while doing it.** (a) House cusps were a stub: pinned to 0° of each sign regardless of birth, ignoring the Ascendant entirely. Now real, anchored to Asc (house 1) and MC (house 10), verified in both hemispheres. (b) The Vertex needed a genuine invariant test — "it lands in houses 5-8" is a mid-northern rule of thumb that fails in the southern hemisphere. `calculations/vertex.test.ts` now asserts the definition (due west on the prime vertical) and that it returns `null` above 66° rather than guessing.
7. ✅ **DONE — Demo roster re-searched.** Maya (kin 60) now has a genuine exact oracle: Ari = guide (kin 164), Noam = analog (kin 73), Tal = antipode (kin 190), Omer = occult (kin 201, since 60+201=261), Dana = same-seal (kin 220).
8. ✅ **DONE — Surprisal scoring.** `services/rarity.ts` holds the MEASURED base rate of every tie and scores by `−log₂(P)`. A `guide` (0.38%) carries 8.0 bits; an `electromagnetic` (95.4%) carries 0.07. The tradition's constants rated them 18 vs 12 — a ratio of 1.5. The information content rates them **115:1**, and it does so without anyone's opinion. Ranking, the map's headline callouts, and the pair "rarity" score all derive from this. The hand-written `TIE_INTEREST` table is gone.

9. ✅ **DONE — the maps are rebuilt on all of it.** The 15-edge hairball (`demo-graph.tsx`) is deleted. Circles are computed by `buildPenta` (they previously listed invented members — "Shai", "Lior" — with invented insights). Headline callouts now select themselves by surprisal instead of a hardcoded list that had gone stale.

## 9. What is still open

- **Directed edges.** `guide` is asymmetric (5-cycles), and our implementation is order-dependent besides; house overlays and split-bridges are directional too. The data now carries direction; the map does not yet draw arrows.
- **GAP kin** — deliberately NOT implemented. No reachable source enumerates the 52 portals in text, and a wrong GAP list is worse than none. See §3.
- **Type/Strategy/Authority interplay** — the layer Jovian says to lead with. We compute `profileFit` and a crude `TYPE_DYNAMICS` modifier; neither is surfaced as a relation.
- **The four scored systems still sum fixed constants** for their per-system score. Surprisal governs ranking and rarity, but the 0-100 per-system numbers are still tradition-weighted. They should be retired in favour of bits.

---

## Sources

Research reports (four parallel agents, 2026-07-13) covering: Western synastry technique and base rates; Human Design partnership analysis (Jovian Archive / Ra Uru Hu lineage); Dreamspell oracle derivation and its divergence from the traditional Tzolk'in; and Hebrew gematria's traditional scope. Key primary references: Law of Time (*The Fifth Force Oracle*), Jovian Archive (*Understanding Partnership Analysis*, Bunnell on *Profile Compatibility*, Ra Uru Hu on *The Penta*), Robert Hand (*Planets in Composite*, 1975), Ronald Davison (*Synastry*, 1983), Stephen Arroyo (double whammy), Encyclopaedia Judaica and Chabad on gematria, Barbara Tedlock (*Time and the Highland Maya*), and Wikipedia's *Tzolk'in* on Dreamspell as an acknowledged syncretic creation.

Base rates in this document are of two kinds and are labelled as such: **measured** (780 random pairs through our own engine, deterministic seed) and **derived** (combinatorics from the rules). Where both exist they agree.
