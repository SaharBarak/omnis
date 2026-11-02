# Bento Hero Lab

Two experimental hero compositions for pleiad.io, built as noindex routes so
they can be judged in a real browser next to the live homepage. Neither
replaces `src/app/page.tsx`; a winner gets promoted through HOMEPAGE_SPEC.md.

## Problem class

"Bento hero": a single viewport where one dominant media card carries the
brand, and a ring of small cards each carry one proof (a number, a choice, a
live value). The population is every marketing surface that has to sell a
product in one screen without scrolling: home, /pricing hero, app-store
landing, campaign pages.

The class fails in a known way: the small cards fill with invented numbers
("48k investors", "+2TB"). Pleiad already has real, measured numbers, so every
card here is bound to engine data or to a plan constant. **A card with no data
source is not drawn.**

## References

| Source | What we take | What we do not take |
|---|---|---|
| PillarCap wireframe (3-column bento: copy · tall media · plans) | Grid proportions, notch tab over the media, hotspot pins, glass cards on the media, plan list, small chart, orbit of labels | Their code, copy, imagery, palette |
| Bento-hero reel, five wireframes (`bento-lab/wireframes/`) | Concave "notch" cut-outs that let type and nav sit *inside* the media card's silhouette | Their designs, copy, imagery |

The reel's five coloured wireframes (red = text, blue = media, yellow = card)
were extracted frame by frame and re-rendered in greyscale; see
`bento-lab/wireframes/README.md` for the method and the files.

## Composition A — `/lab/bento` (three columns)

| # | Slot | Pleiad content | Data source |
|---|---|---|---|
| 1 | Top bar | Six-System Seal + wordmark, menu pill | `BrandMark` |
| 2 | Headline | "Map the people who shape your life", one highlighted word, two seal glyphs inline | HOMEPAGE_SPEC hero line |
| 3 | CTAs | Start free (`/calculate`), Explore (`/learn`) | routes |
| 4 | Promo | Tzolkin pixel grid: 13 × 20 cells, today's kin lit | engine `today.kin` |
| 5 | Hero media | `portal-loop` video, pixel-assembles in on load | `public/videos/redesign` |
| 6 | Notch tab | Media switcher: portal · sky | both loops |
| 7 | Hotspots | Three pins naming the oracle seats: guide, analog, occult | Dreamspell oracle |
| 8 | Proof card | Odds of a guide tie, as % and bits, against the commonest tie | `BASE_RATE`, `surprisal()` |
| 9 | Systems card | "Read N ways" + three system links | `SYSTEM_CATALOG` readings, `SYSTEM_FLAVORS` |
| 10 | Utility row | Search pill, theme toggle, sign-in | routes |
| 11 | Plans | Free / Explorer / Complete, first expanded with an ASCII wavespell | `PLANS` |
| 12 | Chart | "What a tie is worth": bits for five tie types | `surprisal()` |
| 13 | Orbit | ASCII sky sphere, three live labels | `getTodayAcrossSystems()` |

## Composition B — `/lab/bento-v2` (notched media)

| # | Slot | Pleiad content | Data source |
|---|---|---|---|
| 1 | Main media | `portal-loop`, full bleed inside a rounded card | video |
| 2 | Top-right notch | Nav pills: Learn · Today · Pricing · Sign in, motion pause, theme | routes |
| 3 | Bottom-left notch | "N systems, one map" pill + two-line display headline | `SYSTEM_CATALOG` readings |
| 4 | Stat card | Guide-tie odds as the big number, the commonest tie as counterweight, today's oracle seals | `BASE_RATE`, `calculateOracle()` |
| 5 | Stat notch | Round arrow button to `/compatibility` | route |
| 6 | Second media | `hero-sky-loop` | video |
| 7 | Caption inset | One-paragraph product line + today's kin | `getTodayAcrossSystems()` |

The notch is one primitive (`Notch`): a block painted in the page colour,
with two inverse-radius corners drawn by radial gradients. Every notch in
composition B is that primitive at a different corner.

## Rules

1. Colours are CSS custom properties on the lab root, dark first (ground
   `#0B0D16`, brand `#7D5BC9`, from `landing-tokens.ts`), light via
   `data-theme="light"`. No raw hex inside components. A remembered light
   theme is applied by an inline boot script before first paint.
2. Display face is Space Grotesk (`--font-display`). No mono for body copy;
   the ASCII canvases are art, not text.
3. Canvas art reads its colours from the same custom properties through
   cached colour ramps (no per-frame allocation). It pauses off-screen, draws
   at a device pixel ratio capped at 2 and re-sizes when that ratio changes.
4. Video is decorative: `muted`, `playsInline`, `aria-hidden`, poster from the
   mural still, `preload="auto"` only on the focal video. It plays only while
   on screen. Pixel-assemble replays on every scene switch by design, then the
   canvas hides itself.
5. One motion pause per page (`data-motion` on the lab root) stops videos,
   canvases and CSS animation together (WCAG 2.2.2). The OS reduced-motion
   setting is honoured live: posters held, canvases still, no load-in.
6. Copy counts from data: the number of reading systems comes from the engine
   catalog, never from a "six" in the copy.
7. Layout collapses at 1100px and 720px (A) and 960px and 720px (B). No
   horizontal scroll at 390px.
8. Routes carry `robots: { index: false, follow: false }` and are absent from
   the sitemap. They are not disallowed in robots.txt, which would hide the
   noindex from crawlers.

## Acceptance

- Both routes render at 1440, 1100, 390 widths with no overflow.
- Every number on screen traces to a row in the data-source column above.
- Theme toggle flips surfaces, canvases and type together; media cards stay
  as painted, with type on them set by the on-media tokens.
- Text tiers hold 4.5:1 on their surfaces in both themes.
- `npm run typecheck` and lint pass; no new runtime dependency.

## Files

| Layer | Path |
|---|---|
| Data (pure, tested) | `src/lib/data/bento-lab.ts`, `src/lib/data/lab-media.ts` |
| Glyph path rule | `src/lib/design/glyph-paths.ts` |
| Kit (shared primitives) | `src/components/bento-lab/` — `LabRoot`, `ArtCanvas`, `PixelVideo`, `Notch`, `ThemeToggle`, `MotionToggle`, `lab-state`, `useCanvasLoop`, renderers |
| Composition A | `src/app/lab/bento/` |
| Composition B | `src/app/lab/bento-v2/` |
| Lab shell | `src/app/lab/layout.tsx` (noindex, route strip) |
| Wireframe pipeline | `scripts/wireframe-extract/`, output in `docs/redesign/bento-lab/wireframes/` |

The kit shares primitives, data and the canvas loop; each composition owns
its own grid stylesheet, so the two directions stay independent until one is
promoted into `landing-v2`.

`src/lib/data/homepage-demo.ts` still carries a private copy of the glyph
filename rule; it should import `glyphSlug` from `glyph-paths.ts` once that
file's in-flight changes land.

## Promotion path

1. Pick A or B in a real browser at the three widths.
2. Move the chosen composition into `src/components/landing-v2`, reusing the
   kit unchanged, and replace the hero in `src/app/page.tsx` under
   HOMEPAGE_SPEC.md.
3. Delete `src/app/lab/`.

## Second opinion

| Reviewer | Scope | Date | Status |
|---|---|---|---|
| Codex CLI (gpt-5.5) | Route placement, CSS modules vs Tailwind, notch primitive, canvas lifecycle | 2026-10-10 | Incorporated |
| Code review agent | All lab files: lifecycle, accessibility, performance, spec | 2026-10-11 | Incorporated |
