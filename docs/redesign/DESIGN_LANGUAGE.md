# Omnis Redesign — Design Language

Reference: railway.com homepage composition (verified via live screenshots,
2026-07-03). What we borrow, what we make ours.

## What Railway does (observed)

1. **Hero** — full-bleed, hand-illustrated night sky (painted clouds, star
   field), serif display headline over it, one-line sub, two CTAs, floating
   product-UI canvas sliding in below the fold.
2. **Long continuous background** — the page is one tall painted canvas, not
   stacked white sections. A **vertical rail line** runs down the left with
   node markers; each section = badge pill → large serif headline → prose →
   embedded live product UI.
3. **Animated set pieces** — e.g. split-flap airport board counting live
   stats. Mechanical, playful, memorable. One per page, not ten.

## Omnis translation

The night sky isn't a metaphor for us — it's the product. The scroll is a
**descent through the five wisdom systems**: you start in the cosmos
(astrology), pass through the galactic Maya (dreamspell), the stone codices
(tzolkin), the body blueprint (human design), and end at the letters of
creation (gematria/kabbalah). The Railway rail becomes a **thread of light**
connecting the systems — visually morphing per zone (constellation line →
kin thread → carved groove → channel/circuit → letter path).

### Homepage composition (long scroll, one canvas)

```
[Hero]        illustrated cosmic sky, serif headline "Know your blueprint" (TBD copy),
              CTA: Get your chart → /calculate | Explore the knowledge → /learn
              floating UI: live ReadingCard (today's kin, real data)
[Rail begins]
[Zone 1]      Astrology     — engraved star-atlas texture fades in
[Zone 2]      Dreamspell    — spectral galactic zone, seal glyphs orbit
[Zone 3]      Tzolkin       — codex/stone zone, carved glyph frieze
[Zone 4]      Human Design  — blueprint zone, bodygraph circuit draws itself
[Zone 5]      Gematria      — parchment/ink zone, Hebrew letters as stars
[Set piece]   "Today across the systems" — split-flap-style board flipping
              today's kin, moon, transits (live data; our Railway-board moment)
[Pricing]     three cards on quiet dark ground
[FAQ + CTA + Footer]
```

Each zone: badge pill (system name) → serif display headline → 2-line prose
→ embedded real product UI (person tab, wheel, bodygraph…) → "Learn the
system →" into its flavored docs.

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
