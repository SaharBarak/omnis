# Pleiad Homepage — Motion Spec

Definitive inventory of everything that moves. Two build lanes:

- **CODE** — CSS / SVG / framer-motion / component logic. No generated assets.
- **HF-STILL** — Higgsfield image (already in ASSET_MAP batch), animated by code.
- **HF-VIDEO** — Higgsfield video loop (image-to-video from our own still via
  Seedance 2.0). Only where ambient painterly motion is impossible in code.

Rule of thumb (Railway's): the *product embeds* animate with real logic; the
*mural* barely breathes; ONE mechanical set piece per page gets theatrical
motion. Nothing bounces.

---

## Global

| Element | Motion | Trigger | Lane |
|---|---|---|---|
| Star parallax | 2–3 star layers drift at different rates | scroll | CODE (static star textures, transform) |
| Thread of light | draws itself down the page | scroll-linked (SVG pathLength) | CODE styling from RAIL-TEX |
| Traveler glyph | rides the thread, slight lag/ease; faint spark trail | scroll-linked | CODE + HF-STILL (TRAVELER) |
| Zone transitions | crossfade through shared near-black; flavor accent color eases in | scroll | CODE |
| Nav | translucent → dense backdrop | scroll > 40px | CODE |
| Reduced motion | ALL decorative motion off; videos → poster stills; split-flap → static values; embeds keep functional motion only | `prefers-reduced-motion` | CODE |

## 1. Hero
| Element | Motion | Trigger | Lane |
|---|---|---|---|
| Sky mural | **living painting**: slow cloud drift, star twinkle, rare shooting star | ambient loop | **HF-VIDEO V1** (from HERO-SKY still) |
| H1 + sub | blur-in, 80ms stagger | load | CODE |
| Relationship graph embed | force physics settle; edges pulse softly; hover edge → score stack slides out; tap node → card springs open | load + interaction | CODE (real component) |

## 2. Sigil band
Sigils fade-up, 60ms stagger; thread acquires its first node marker. CODE.

## 3. Zone — YOU
Person view tabs auto-cycle every 4s (wheel → seal → glyph → bodygraph →
gematria), progress hairline under active tab. Pauses on hover. CODE.

## 4. Zone — YOU + ONE
Five-system score stack counts up from 0 on enter (once). CODE.

## 5. Zone — YOUR PEOPLE, KEPT
Scripted demo: search input types a name → card expands → "Add to map"
pulses once. Runs once on enter, replay button. CODE.

## 6. Zone — THE MAP (centerpiece)
| Element | Motion | Trigger | Lane |
|---|---|---|---|
| Thread braid | the single thread splits into 5 colored threads that curve INTO the graph | scroll-linked SVG | CODE |
| Force graph | same physics as hero but full-width; layer control clicks re-tint edges live | interaction | CODE |
| Ambient backdrop | very slow nebula shimmer behind the graph | ambient loop | **HF-VIDEO V3** (from ZONE-DSPELL still; P2, ship static first) |

## 7. Zone — THE FIVE LAYERS (signature set piece)
Scroll-pinned (`position: sticky` + framer-motion scroll progress).
Group of ~6 people stays fixed; each scroll step lays a translucent
acetate layer over them, in order:
1. Astrology — engraved synastry lines **stroke-draw** between people
2. Dreamspell — kin-color threads **weave** in (path draw, 4 colors)
3. Tzolkin — day-sign stamps **press** beside nodes (scale 1.15→1 + ink-spread)
4. Human Design — circuit channels **trace** node-to-node (pathLength)
5. Gematria — letter-values **ring** the names (rotate-in, gilded)
6. Fused — all layers compress: opacity/blend collapse into one resolved
   reading; a single chord of motion, then stillness.
Scrolling back up peels layers in reverse. ALL CODE (SVG overlays on the
real group component; textures from existing HF stills).

## 8. Zone — YOUR CIRCLES
Three group panels (`Family · Team · Friends`) slide in staggered; the
same person's node highlights across all three in sequence — the "same
person, different role" beat. CODE.

## 9. Zone — BEYOND YOU
Share dialog completes → link chip detaches and **glides** to the phone
mockup, share page loads in it. Runs once on enter. CODE.

## 10. Knowledge band
Search placeholder self-types rotating example queries (`Gate 34`,
`Kin 113`, `Venus synastry`…). CODE.

## 11. Today board — mechanical set piece
CSS 3D split-flap: each character cell flips with 15–25ms cascade jitter;
flips on load, then on real data change. Sound OFF. Mono numerals,
restrained. CODE. (Railway homage — this is the ONE theatrical moment.)

## 12. Pricing
Hover lift + shadow; recommended card idle gold glow-pulse (6s period). CODE.

## 13. Portal CTA
| Element | Motion | Trigger | Lane |
|---|---|---|---|
| Dawn light in doorway | light **breathes**, dust motes drift in the beam | ambient loop | **HF-VIDEO V2** (from PORTAL-CTA still) |
| Mini live map beyond door | tiny graph physics idling | ambient | CODE |
| Button | slow glow pulse | idle | CODE |

## 14. Footer
Live mono line: values flip in (small split-flap reuse) on load. CODE.

---

## Higgsfield video batch (image-to-video, Seedance 2.0)

Pipeline: generate the still (ASSET_MAP C1) → approve → feed still as
`--start-image` to Seedance 2.0 with a minimal-motion prompt → loop.

| ID | Source still | Motion prompt sketch | Len | Priority |
|---|---|---|---|---|
| V1 HERO-SKY-LOOP | HERO-SKY | "subtle ambient motion only: clouds drift very slowly, stars twinkle faintly, one brief shooting star; painterly style preserved; no camera movement, no new elements" | 10–12s | P1 |
| V2 PORTAL-LOOP | PORTAL-CTA | "light through the doorway breathes gently, faint dust motes float in the beam; everything else perfectly still; no camera movement" | 8s | P1 |
| V3 MAP-NEBULA-LOOP | ZONE-DSPELL | "nebula shimmer, extremely slow; four colored threads pulse faintly; no camera movement" | 10s | P2 |

## Video playback contract (perf + a11y)

- `muted loop playsinline`, poster = source still, lazy-loaded,
  `IntersectionObserver` pause when offscreen.
- Gen-video rarely loops seamlessly → default playback is **ping-pong**
  (reverse on end) unless the seam is invisible.
- Mobile / `prefers-reduced-motion` / Save-Data → static still only.
- Encode: AV1/WEBM + H.264 fallback, ≤2.5MB per loop, 1440p max.
- Total motion budget: mural videos ≤3; everything else is code.
