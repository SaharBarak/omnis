# Homepage Redesign — "Show the product, don't abstract it"

Status: **§2/§4/§5 BUILT & VERIFIED (2026-07-12)**, not yet deployed.
Shipped: `src/lib/data/homepage-demo.ts` (engine-computed demo dataset),
`src/components/landing-v2/people-atlas.tsx` (§2+§3),
`src/components/landing-v2/relationship-callouts.tsx` (§4), and
`zone-layers.tsx` rewired to real edges (§5).
Health: typecheck ✓ · 1080 tests ✓ · `next build` ✓ · screenshot-verified.
Still open: hero (§1) rework, trust band (§6), pricing teaser (§7), sticky
mobile CTA.

## The misread we are fixing

The current set-piece is `src/components/landing-v2/zone-layers.tsx`. It draws
six dots (Maya, Noam, Dana, Ari, Tal, Omer) with colored edges per system and
the caption *"Isolate any single layer · compare layers side by side · fuse all
five into one reading."*

It tests as **not understood**, and the code shows exactly why:

```ts
// zone-layers.tsx:30-36 — the edges are HARDCODED INDEX PAIRS.
const LAYER_LINKS = [
  [[0, 1], [1, 2], [3, 4]], // astrology — synastry lines
  [[0, 3], [2, 5], [1, 4]], // dreamspell — kin threads
  ...
]
```

**The lines mean nothing.** They are decoration. A visitor is asked to infer a
product from a diagram that encodes zero information. Meanwhile the app has a
real five-system relationship engine sitting right there, unused by the page.

**The fix, in one line:** every visual on the homepage must be *computed by the
real engine* and *named in the real vocabulary*.

## What the visitor must understand, in order

1. This is a map of **your people** — not one reading about you.
2. Every person carries **five charts** you can page through.
3. The systems produce **specific, nameable ties** between two people —
   "Maya is Ari's **Guide**", "Noam and Dana are **electromagnetic** (they
   complete a channel)". The map has semantics.
4. You can **start free**, and grow the collection over time.

---

## The real model (ground truth from the engine — use these names verbatim)

### Per-system accents (`src/lib/design/system-flavors.ts`)
| System | key | accent |
|---|---|---|
| Astrology | `astrology` | `#C9A227` |
| Dreamspell | `dreamspell` | `#A87BD1` |
| Tzolkin | `tzolkin` | `#2E6E5E` |
| Human Design | `humanDesign` | `#7FD4C1` |
| Kabbalah | `gematria` | `#D4AF37` |

Ground: `MURAL_GROUND = #0B0D16`. Brand accent: Railway violet (`COLORS.brand`).

### Relationship vocabulary (verbatim, with real weights)

**Dreamspell / Tzolkin** — `packages/engine/src/services/compatibility.ts`,
`CONNECTION_DESCRIPTIONS`:
| type | harmony | score | plain meaning |
|---|---|---|---|
| `same-seal` | supportive | 25 | Shared archetypal essence |
| `analog` | supportive | 20 | Supportive partnership energy |
| `guide` | supportive | 18 | **Destiny guidance connection** |
| `occult` | transformative | 15 | Hidden transformative power |
| `same-tone` | supportive | 15 | Resonant frequency match |
| `antipode` | challenging | 10 | Challenging growth opportunity |
| `same-color` | supportive | 8 | Aligned directional energy |

**Human Design** — `packages/engine/src/services/hd-compatibility.ts`,
`HDConnectionType`:
| type | score | mechanic |
|---|---|---|
| `electromagnetic` | 12 | Each holds **one gate of the same channel** → they *complete* each other. "The spark of attraction." |
| `companionship` | 8 | Both hold the **complete channel** → reinforcing, friendly |
| `dominance` | 3 | One holds the complete channel, the other a single gate |
| `compromise` | 2 | Both hold the **same single gate** |

**Astrology** — `packages/engine/src/services/synastry.ts`: cross-aspects
`conjunction` (orb 8, harmonious), `sextile` (4, harmonious), `square` (6,
challenging), `trine` (8, harmonious), `opposition`; plus element harmony.
`SynastryHarmony = 'harmonious' | 'challenging'`.

**Kabbalah** — `compareNames()` in `calculations/gematria`.

### The fused score — `calculateFiveSystemCompatibility()`
Returns `FiveSystemCompatibility { systems, overallScore, availableSystems,
dreamspellDetail, tzolkinDetail, synastryDetail, hdDetail, gematriaScore,
summary }`. Base weights: astrology `.25`, humanDesign `.25`, dreamspell `.22`,
tzolkin `.18`, gematria `.10` (normalized over available systems).

### Reusable REAL chart components (do not mock these)
- `src/components/astrology/NatalChartWheel.tsx` — `{ chart, className }`
- `src/components/human-design/BodygraphChart.tsx`
- `src/components/cards/OracleMap.tsx` — Dreamspell oracle
- `src/components/cards/TzolkinSection.tsx`
- `src/components/cards/GematriaDisplay.tsx`

---

## Page structure (top → bottom)

Design dials (per /taste-skill, tuned to the locked brand): **VARIANCE 7,
MOTION 6, DENSITY 5**. Keep the existing system — Railway violet brand, Space
Grotesk display, IBM Plex Mono for all numbers, mural bands fading to `#0B0D16`,
`lucide-react` icons, framer-motion. No centered heroes. No 3-equal-card rows.
No emoji.

### 1. HERO — product-forward split
Left: headline "Map the people who shape your life" + subhead + **CTA "Get your
free reading"** + secondary **"See a live map"**. Right: the people-map rendered
inside app chrome, with **avatars** (not bare dots) and **one real edge already
labelled** (e.g. `Guide · Tzolkin`) so the graph reads as a product, not a
concept. This is the only place the graph survives — and now its edges are real.

### 2. ONE PERSON, FIVE MAPS — the per-system map gallery  *(new; the core fix)*
A **person selector** (avatar chips: the six demo people) drives a **system
navbar** (Astrology · Dreamspell · Tzolkin · Human Design · Kabbalah). Selecting
person + system swaps in **that system's real chart for that person**, rendered
by the actual app components above. One concrete sentence per system — no
marketing filler. CTA per map: "Read [Name]'s full [System]".

### 3. THE PEOPLE DASHBOARD — collection, selection, connections *(new)*
The real dashboard surface: the visitor's people as a grid with mini-charts, an
`+ Add person` affordance (with a composed **empty state**), and a **per-person
navbar that includes a `Connections` tab**. Selecting a person → page their five
systems → open **Connections** → see that person's ties to every other person in
the collection, each tie **named in the real vocabulary**.

### 4. THE SYSTEMS TALK — named relationship callouts *(new; the payoff)*
Real computed ties between the demo people, each rendered as: two avatars + the
named tie + one plain-English line + the system accent. Examples (computed, not
written):
- **Tzolkin** — "Maya is Ari's **Guide**." *Destiny guidance connection.*
- **Human Design** — "Noam and Dana are **electromagnetic** — each holds one
  gate of the same channel. They complete each other."
- **Astrology** — "Tal's Moon **trines** Omer's Sun." *Harmonious cross-aspect.*
- **Dreamspell** — "Ari is Tal's **antipode**." *Challenging growth.*
- **Kabbalah** — shared letter-value resonance.

### 5. ISOLATE · COMPARE · FUSE — the layer control (repurposed, not the hero)
The old caption becomes a real, demonstrated feature: toggle a system layer,
compare two side by side, fuse all five into one score via the shipped Resonance
Matrix. **The edges are now engine-computed**, so isolating a layer actually
means something. Show the weight ledger (astrology .25 / HD .25 / dreamspell .22
/ tzolkin .18 / kabbalah .10).

### 6. TRUST LAYER — the knowledge docs
Band linking the six learn guides. "Every reading traces back to the math."
CTA: "See the method."

### 7. PRICING TEASER + FINAL CTA
Lead with the free reading. Founding Lifetime $79 band. (Reconcile: the live
teaser still shows 3 plans.)

---

## CTA map (user asked for MORE CTAs — placed deliberately)
| Where | CTA | Target |
|---|---|---|
| Hero primary | Get your free reading | `/onboarding` |
| Hero secondary | See a live map | scroll → §2 |
| §2 per map | Read [Name]'s full [System] | `/calculate` |
| §3 empty state | + Add your first person | `/onboarding` |
| §3 dashboard | Open the map | `/app/graph` |
| §4 relationships | Find your people's connections | sign-up |
| §5 fuse | Fuse your collection | `/app/graph` (matrix) |
| §6 trust | See the method | `/learn` |
| §7 + sticky mobile bar | Start free | `/onboarding` |

## Demo data contract
Pin the six people (Maya, Noam, Dana, Ari, Tal, Omer) to **fixed birth
data** so every chart and every relationship on the page is **deterministically
computed by the engine at build time** (server component → props). No mocked
lines, ever. If a tie doesn't exist between two people, do not invent it —
choose demo birth dates that *produce* the ties we want to showcase.

## Imagery
Real rendered charts only. Higgsfield reserved for an optional ambient starfield
band; never for maps or dashboards — those must be true app UI.
