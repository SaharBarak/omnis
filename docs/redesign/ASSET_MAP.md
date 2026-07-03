# Omnis Redesign — Asset Map

Two inventories: what we HAVE (keep/reuse) and what we GENERATE (Higgsfield).
Generation prompts live here so the batch is reviewable before spending
credits.

## A. Existing assets — keep

| Set | Path | Count | Verdict |
|---|---|---|---|
| Dreamspell seals/tones SVG | `public/images/dreamspell/{seals,tones}` | 20+13 | keep — functional glyphs |
| Dreamspell decorative | `.../decorative/` | 3 | keep |
| Tzolkin signs + nawales SVG | `public/icons/tzolkin`, `public/images/tzolkin/nawales` | 20+20 | keep |
| Astrology signs/planets/elements SVG | `public/images/astrology` | 26 | keep |
| Human Design bodygraph/centers/types SVG | `public/images/human-design` | 24 | keep |
| Hebrew letters + Tree of Life SVG | `public/images/gematria` | 23 | keep |
| Legacy Dreamspell GIFs | `public/dreamspell/gifs` | ~150 | keep (calculator uses); exclude from new surfaces |
| PWA icons/favicons | `public/icons`, root | — | keep |

## B. Existing assets — replace

| Asset | Why |
|---|---|
| `images/landing/hero/hero-bg.webp` | replaced by long-canvas zones |
| `images/landing/systems/*.webp` (5) | replaced by flavored zone panels |
| `images/landing/features/*.webp` (3) | replaced by embedded real UI |
| `images/landing/steps/*.webp` (3) | replaced by onboarding-ritual art |
| root `dreamspell-page.png` | stray file — delete |

## C. Generate — Higgsfield batch

Model: GPT Image 2 (design/illustration strength). Style anchor for ALL
prompts: *"hand-illustrated, painterly, muted palette, fine grain, in the
spirit of illustrated night-sky editorial art; no text, no watermark,
no photorealism"*. Landscape 16:9 unless noted; tall panels 9:16 →
compose/stitch in CSS as layered bands.

### C1. Homepage long canvas (priority 1)

| ID | Asset | Prompt sketch | Size |
|---|---|---|---|
| HERO-SKY | Hero sky | painterly deep-night cosmic sky, hand-drawn swirling clouds edge-lit by moonlight, dense star field, subtle nebula teal-and-gold accents on near-black indigo, tranquil, vast | 2880×1800 |
| ZONE-ASTRO | Astrology band | renaissance star-atlas engraving over midnight blue, gold copperplate constellation figures and astrolabe ring fragments, ivory line work, antique celestial chart mood | 2880×1620 |
| ZONE-DSPELL | Dreamspell band | deep violet galactic field, radial 13-point sacred geometry faintly glowing, four color threads (red white blue yellow) orbiting, modern-mystic minimal | 2880×1620 |
| ZONE-TZOLKIN | Tzolkin band | amate bark-paper texture in warm cream, carved Maya stone-relief border bands, jade and cinnabar pigment accents, codex-page composition, aged, museum quality | 2880×1620 |
| ZONE-HD | Human Design band | deep indigo blueprint, fine white schematic grid, luminous thin circuit channels forming an abstract human silhouette, hexagram tick marks, precise, technical-mystic | 2880×1620 |
| ZONE-GEMATRIA | Gematria band | indigo-black night over aged parchment horizon, gilded Hebrew calligraphy strokes floating as constellations, Tree of Life geometry faint in background, illuminated-manuscript gold accents | 2880×1620 |
| RAIL-TEX | Thread-of-light | thin luminous thread of golden light on transparent/near-black, subtle particle glow, vertical | 512×2048 |
| TRAVELER | Traveler glyph (rides thread on scroll; Railway's train equivalent) | small luminous comet-star glyph, warm gold core with subtle four-color (red/white/blue/yellow) trailing sparks, on near-black | 512×512 |
| PORTAL-CTA | Portal doorway final CTA | tall arched temple doorway glowing with warm dawn light from within, dark surround, perspective stone floor receding toward viewer, inviting, painterly | 1600×2000 |
| GRID-PAPER | Testimonial card texture | very subtle blueprint grid-paper texture on near-black, barely visible | 1024×1024 tile |

Zone bands must blend at edges (top/bottom fade to shared near-black
`#0B0D16`) so the page reads as ONE continuous mural — Railway's key trick.

Zone order on homepage (per HOMEPAGE_SPEC.md capability mapping):
ZONE-ASTRO → ZONE-TZOLKIN → ZONE-DSPELL → ZONE-HD → ZONE-GEMATRIA.
The hero floating UI is the live relationship graph — built in code, not
generated art.

### C2. /learn doc heroes (priority 2)

Five banners, one per system — same prompts as ZONE-* but wide-short
(2880×960), quieter (must sit under headline text), plus:

| ID | Asset |
|---|---|
| DOC-INTEGRATION | five colored threads (gold, spectral, jade, electric white, gilded) braiding into one line across dark field |

### C3. Brand & social (priority 2)

| ID | Asset | Notes |
|---|---|---|
| OG-MAIN | og-image.png 1200×630 | hero-sky crop + logo lockup (composite in code, art from HERO-SKY) |
| OG-LEARN ×5 | per-system OG | crops of DOC banners |

### C4. Onboarding ritual backdrops (priority 3)

4 quiet vertical panels (1200×1600): name→parchment/ink, birthdate→dreamspell
spectral, time+place→star atlas, hebrew name→gilded letters. Derived from
zone art via crop/re-gen.

### C5. Dashboard ambient (priority 3)

| ID | Asset |
|---|---|
| DASH-GROUND | very dark, very subtle cosmic ground texture, near-imperceptible stars — must not distract from data |
| EMPTY-STATES ×3 | small illustrations: no-people, no-groups, no-boards (tiny observatory / gathering circle / blank codex) |

## C6. Generate — Higgsfield VIDEO loops (image-to-video)

See MOTION_SPEC.md for full contract. Seedance 2.0, `--start-image` = our
approved still, minimal-motion prompts, ping-pong playback:

| ID | From still | Purpose | Priority |
|---|---|---|---|
| V1 HERO-SKY-LOOP | HERO-SKY | living hero mural (cloud drift, twinkle) | P1 |
| V2 PORTAL-LOOP | PORTAL-CTA | dawn light breathing in doorway | P1 |
| V3 MAP-NEBULA-LOOP | ZONE-DSPELL | ambient shimmer behind map embed | P2 |

## C7. Generation log (2026-07-03, GPT Image 2, 2k, style anchor v1)

All 10 stills approved first-pass. Repo paths + Higgsfield job IDs:

| Asset | Repo path | Job ID |
|---|---|---|
| HERO-SKY | `public/images/redesign/mural/hero-sky.webp` | 03683844-27a9-450b-b2dd-0a8024cbcc76 |
| ZONE-ASTRO | `public/images/redesign/mural/zone-astrology.webp` | b4a2e907-fc98-4953-8291-215a00b8bb29 |
| ZONE-DSPELL | `public/images/redesign/mural/zone-dreamspell.webp` | 0570a0d6-f8eb-4a66-8968-b774e8d5366a |
| ZONE-TZOLKIN | `public/images/redesign/mural/zone-tzolkin.webp` | 978cea7c-c187-45a1-bc4e-6bb71a0af223 |
| ZONE-HD | `public/images/redesign/mural/zone-human-design.webp` | ae349ea9-c1b6-4984-b6ba-533338c54203 |
| ZONE-GEMATRIA | `public/images/redesign/mural/zone-gematria.webp` | 40557c66-73e0-4e4f-91bf-6d62190613bd |
| PORTAL-CTA | `public/images/redesign/mural/portal-cta.webp` | b9cc78c8-d70b-45a3-be4d-1840833b428e |
| RAIL-TEX | `public/images/redesign/motifs/thread-of-light.webp` | 237cbdb8-53cf-40e9-93e1-204dad6a4b67 |
| TRAVELER | `public/images/redesign/motifs/traveler-glyph.webp` | 61c12084-3bc2-4b1c-b666-7c5ca588d882 |
| GRID-PAPER | `public/images/redesign/motifs/grid-paper-tile.webp` | b7170d3d-9fb5-434c-9b6c-bcd39c8abed4 |

Video loops (C6): **Seedance 2.0 requires Higgsfield Pro/Ultimate plan** —
blocked on current plan. Kling 3.0 fallback attempted for V1. If fallback
also gated: ship static stills + CSS star-twinkle overlay until plan
upgrade decision.

## D. Built in code, not generated

- Split-flap "today across systems" board — CSS 3D component
- Bodygraph stroke-draw, seal orbit, rail draw-on-scroll — SVG + framer-motion
- All functional glyphs stay the existing SVG sets

## E. Pipeline

1. Generate priority 1 (7 images) → review → iterate style anchor
2. Batch priorities 2–3 with locked anchor
3. Post-process: webp/avif, responsive sizes, `asset-db.json` + ATTRIBUTION update
4. Wire zones → landing rebuild
