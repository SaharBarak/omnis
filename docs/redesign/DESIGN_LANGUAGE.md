# Omnis Redesign — Design Language

Reference: railway.com homepage composition (verified via live screenshots,
2026-07-03). What we borrow, what we make ours.

## What Railway does (observed — full homepage anatomy, 19 scroll frames)

1. **Continuous illustrated mural** — dusk sky → painted clouds → mountains →
   a shinkansen train crossing the frame. One painting; the whole page is
   dark; there are zero white sections. Section boundaries are soft
   rounded-corner containers and glow shifts, never background color flips.
2. **Hero** — serif display "Ship software peacefully" over the mural,
   one-line sub, two CTAs (filled + outline), floating **live product
   canvas** overlapping the mural below the fold.
3. **Logo wall** — two rows of translucent grid cells sitting on the mural's
   bottom edge.
4. **Rail sections ×5** — vertical rail line down the left; a **little train
   icon rides the rail as you scroll**. Repeating grammar: color-coded pill
   badge (Build and deploy / Network and connect / Scale and grow / Monitor
   and observe / Evolve and collaborate) → large serif headline → 2-line
   prose + "Learn more →" → giant embedded *real* product UI (not
   screenshots) → triad of icon+title+prose features → quiet "Alternative
   to" competitor-icon row. Each section tints its accents (green / orange /
   purple).
5. **Social proof** — centered serif "Trusted by the best in business",
   3 large testimonial cards on grid-paper texture, then "...and loved by
   developers" horizontal tweet marquee.
6. **Split-flap station board** — serif "105.6M+ deploys per month (and
   counting)" over a live mechanical flip board: USERS / SERVICES /
   DEPLOYMENTS / REQUESTS / LOGS with real-time digits.
7. **Final CTA as train door** — "A better future is now boarding", a
   doorway-shaped card glowing with warm sunset gradient (the view from a
   train door), "All Aboard" pill button, perspective station-platform floor
   grid receding behind.
8. **Footer** — featured-announcement cards + six link columns, compliance
   marks, mono-green "All systems operational".

**Core insight: total metaphor commitment.** Railway = an actual railway
journey at every layer — the train rides the rail while you scroll, the
stats are a station departures board, the CTA is a boarding door, the copy
says "All Aboard". The metaphor isn't decoration; it's the page's narrative
arc: promise → product proof → social proof → live-scale proof → boarding.

## Omnis translation — the cosmic pilgrimage

Railway commits totally to the railway journey; Omnis commits totally to a
**pilgrimage through the five wisdom systems**. The night sky isn't a
metaphor for us — it's the product. The scroll is a descent: cosmos
(astrology) → galactic Maya (dreamspell) → stone codices (tzolkin) → body
blueprint (human design) → letters of creation (gematria/kabbalah).

Metaphor mapping (element-for-element):

| Railway | Omnis |
|---|---|
| Train icon riding the rail on scroll | **Traveler glyph** (comet / kin star) riding the thread of light |
| Rail line, color-tinted per section | Thread of light morphing per zone: constellation line → kin thread → carved groove → circuit channel → letter path |
| Continuous train-country mural | Continuous cosmos-to-parchment mural (one painting, five zones) |
| Embedded live product canvas | Embedded live ReadingCard / natal wheel / bodygraph / oracle (real components, real data) |
| "Alternative to" competitor rows | "As known in tradition" — source-lineage row (codex, manuscript, atlas references) |
| Split-flap departures board | **"Today across the systems"** live board: kin · moon phase · sun sign transit · HD gate · Hebrew date |
| Train-door final CTA "All Aboard" | **Portal/temple-door CTA** "Your blueprint awaits" — doorway card glowing with dawn light |
| "All systems operational" footer | "The calendars are counting" live footer line (today's kin + Hebrew date, mono) |

### Homepage composition (long scroll, one canvas)

```
[Hero]        illustrated cosmic sky (mural top), serif headline "Know your
              blueprint" (TBD copy), sub, CTA: Get your chart → /calculate |
              Explore the knowledge → /learn
              floating UI: live ReadingCard (today's kin, real data),
              overlapping the mural like Railway's canvas
[Mural cont.] sky descends toward horizon — the five-zone descent begins
[Thread]      thread of light begins; traveler glyph attaches, rides on scroll
[Zone 1]      Astrology     — engraved star-atlas texture fades in
[Zone 2]      Dreamspell    — spectral galactic zone, seal glyphs orbit
[Zone 3]      Tzolkin       — codex/stone zone, carved glyph frieze
[Zone 4]      Human Design  — blueprint zone, bodygraph circuit draws itself
[Zone 5]      Gematria      — parchment/ink zone, Hebrew letters as stars
[Social]      centered serif head + testimonial cards on grid-paper texture
              (reuse Railway's card treatment), horizontal marquee of reader
              quotes
[Set piece]   "Today across the systems" — split-flap board flipping live
              kin · moon · transit · gate · Hebrew date
[Pricing]     three cards on quiet dark ground
[Portal CTA]  doorway card glowing with dawn light — "Your blueprint awaits"
[FAQ + Footer] footer ends with live mono line: today's kin + Hebrew date
```

Zone grammar (Railway's, reskinned): color-keyed pill badge (system name) →
serif display headline → 2-line prose + "Learn the system →" → embedded real
product UI (ReadingCard, natal wheel, bodygraph, oracle map…) → triad of
icon+title+prose (what you learn / what you get / how it connects) →
"As known in tradition" source-lineage row (replaces Railway's competitor
row — cites codices, manuscripts, atlases).

## Per-system folklore flavors

One shared layout grammar; five skins. Tokens go to
`src/lib/design/system-flavors.ts` (new) as CSS vars per zone/doc.

| System | Folklore root | Palette | Texture/motif | Type accent |
|---|---|---|---|---|
| **Astrology** | Renaissance star atlases, astrolabes | midnight blue `#0B1B3A`, engraved gold `#C9A227`, ivory | copperplate engraving lines, constellation joins, brass instrument diagrams | serif w/ old-style figures |
| **Dreamspell** | Argüelles galactic Maya, 13:20 | deep space violet, seal families red `#C0392B` / white `#ECF0F1` / blue `#2C3E90` / yellow `#F1C40F` | radial 13-tone geometry, orbiting seal glyphs, spectral gradients | geometric sans + mono numerals |
| **Tzolkin** | Classic Maya codices & stelae | amate-paper cream, jade `#2E6E5E`, cinnabar `#9C3B2A`, obsidian | bark-paper grain, carved stone relief, codex border bands, Dresden-codex framing | slab/carved display |
| **Human Design** | Modern synthesis (I Ching × chakras × Kabbalah × astro) | deep indigo `#161B33`, electric white lines, aura teal `#4A8B7F` (brand) | blueprint/schematic grid, thin circuit channels, hexagram tick-marks | technical grotesk + mono |
| **Gematria / Kabbalah** | Safed mysticism, illuminated Hebrew manuscripts | indigo-black, parchment `#F3E9D2`, ink sepia, gilded gold | Hebrew calligraphy strokes, Tree of Life sefirot geometry, scroll edges, micrography patterns | Hebrew display face + serif |

Rules:
- Flavor lives in **backgrounds, borders, motifs, accent color** — layout,
  spacing, nav, and component behavior stay identical across systems.
- Base theme stays the existing "Minimalist Mystical" tokens
  (`globals.css`); flavors are additive CSS-var layers per zone.
- Accessibility: all flavored text/background pairs pass WCAG AA; textures
  never sit under body text without a scrim.
- Respect cultures, avoid kitsch: motifs from primary sources (codices,
  manuscripts, atlases), no cartoon shamans, no sacred symbols as
  decoration-only where inappropriate.

## /learn docs = "source of knowledge"

- `/learn` hub: hero **knowledge search** (wire `knowledge-search.ts` to a
  public search UI) + five flavored portals.
- Each `/learn/[system]`: flavored hero band (generated art), flavored
  sidebar/rail, QuickAnswer styled as manuscript margin note / codex gloss.
- `/learn/integration`: all five flavor threads braid into one — the rail
  motif converges.

## Dashboard (/app)

- Keep shell (sidebar, ⌘K) — reskin: cosmic ground layer (subtle, GPU-cheap),
  person tabs pick up system flavor accents, stat cards get set-piece
  treatment (flip-board numerals for today's kin).
- Onboarding as ritual: each step backdrop = the system that step unlocks.

## Motion

- Scroll-driven (framer-motion `useScroll`, already in stack): rail draws
  itself, zone crossfades, parallax star layers.
- Set pieces: split-flap board (CSS 3D flips), bodygraph channels stroke-draw
  on enter, seal orbit slow-rotate.
- Reduced-motion: all decorative motion behind `prefers-reduced-motion`.
- Perf budget: backgrounds are static images (webp/avif) + tiny CSS/SVG
  animation layers. No fullscreen R3F on landing; keep three.js for the
  dashboard oracle only.

## Type & grid

- Display serif for headlines (Railway effect) — candidates: Fraunces or
  Source Serif 4 (variable, self-host). Keep Barlow for UI, IBM Plex Mono
  for numerals/data.
- Content max 1180px (existing token), zones full-bleed.
