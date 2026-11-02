# Bento Motion and Palette

The bento site (BENTO_SITE.md) gets a palette with range and a motion
system that makes each section a scene: drawn illustrations, scroll-driven
reveals, components that answer the hand. This document is the contract for
both. Every section is storyboarded before it is built (`/lab/bento/wireframes`,
"Motion storyboards").

## Problem class

A product site whose product is a drawing. The population is every section
on the home page, every public tool stage and every signed-in component that
draws a map, a tie or a number. They share three kinds of motion:

| Kind | Example | Trigger |
|---|---|---|
| First paint | The atlas draws itself as the page appears | Page load, before any script |
| Scene | The atlas comes apart into its four layers as the page scrolls | Scroll position |
| Illustration | A ring draws itself, a tie line runs from one seal to another | Entering view, or new data |
| Response | A tile lifts when pressed, a number rolls to its new value | Input |

Each kind has one engine. A new section picks its kind and reuses that
engine's wrapper. It never adds another engine or a second owner for the
same element.

## Sources

Apple's Human Interface Guidelines, read from `dickwu/apple-design-skill`
(123 HIG pages pulled from developer.apple.com, the most adopted HIG agent
reference: ★2,175, updated October 2026): `motion.md`, `color.md`,
`dark-mode.md`, `materials.md`, `typography.md`, `charting-data.md`,
`design-principles.md`. The rules taken from them:

| HIG page | Rule applied here |
|---|---|
| motion.md › Best practices | Motion is purposeful and optional; nothing is said only through motion |
| motion.md › Providing feedback | Feedback is brief and precise; frequent interactions get no extra motion; motion never blocks input |
| color.md › Best practices | One color, one meaning across the site; every color works in light, dark and increased contrast |
| color.md › Color management | Wide color (Display P3) where the display supports it, sRGB otherwise |
| materials.md › Liquid Glass | Glass belongs to controls over rich backgrounds, never to the content layer; used sparingly |
| typography.md › Ensuring legibility | No light weights; hierarchy through weight, size and color; few typefaces |
| charting-data.md › Best practices | A chart stays simple and accessible; detail on demand |
| design-principles.md | Delight is not decoration: an animation that carries no information is cut |

Two short design references set the spark and the press:

| Reference | Rule applied here |
|---|---|
| Niki Aroca, colour reel (Instagram, 2026) | Two colours set the mood; a third, off the mood's hues, is the accent and is used sparingly, on the call to action |
| metic.studio, button reel (Instagram, 2026) | A primary button is at least 44 px, a full pill in a real typeface, almost black, with one signal colour; its arrow turns on hover, a light follows the pointer, it leans toward the pointer and it scales a little when pressed |

Library versions were read from the npm registry on 2026-10-28 and are
pinned exactly:

- `gsap` 3.15.0, published 2026-04-13. All plugins are free since 3.13.
- `animejs` 4.5.0, published 2026-06-22.
- `framer-motion` 12, already a dependency. It is the same project as
  `motion`.

`@gsap/react` is not used. `useGSAP` needs a static `gsap` import, while
`useScene` loads GSAP with `import()` and gets the same scoped revert from
`gsap.context`.

## Palette

Colors are data, authored as hue and chroma and never as hex.
`src/lib/design/bento-palette.ts` holds each palette as OKLCH tints. A
theme recipe sets the lightness of every surface. Text and color roles are
then solved (`solveLightness` in `src/lib/design/color.ts`): each starts at
a preferred lightness and moves only as far as WCAG 2 contrast needs
against every surface it sits on. sRGB and Display P3 values are both
gamut-mapped from the one OKLCH source, using the CSS Color 4 algorithm.

LabRoot writes a generated stylesheet: one rule per palette × theme on
`[data-lab]` and `[data-swatch]`, keyed by `data-palette` and `data-theme`.
P3 overrides for the wide roles sit behind `@media (color-gamut: p3)` and
`@supports (color: color(display-p3 0 0 0))`. Values are not inline, so the
P3 rules can win. Every variable has an sRGB twin (`--x-srgb`) for canvas
renderers that interpolate channels. Components read roles, never hex. The
light half (ids, default, labels, `srgbVar`) lives in `palette-ids.ts`, so
client modules never load the solver.

| Role | Variables | Meaning |
|---|---|---|
| `ground`, `surface1`, `surface2`, `chip`, `line`, `art` | `--lab-page`, `--lab-surface`, `--surface-2`, `--lab-chip`, `--lab-line`, `--lab-art` | Page, raised surface, inset surface, chips, hairline, drawing ground |
| `ink`, `ink2`, `ink3` | `--lab-ink`, `--lab-text-2`, `--lab-text-3` | Text tiers: ink2 ≥ 7:1, ink3 ≥ 4.5:1 on every text surface |
| `accent`, `accentSoft`, `onAccent` | `--brand`, `--lab-bright`, `--brand-soft`, `--on-accent` | The palette's mood color: links, focus, selection, and the text on it |
| `spark`, `onSpark` | `--spark`, `--on-spark` | The contrasting signal: the disc on the primary action (BENTO_SITE.md "Primary action") and nothing else, and the icon on it |
| `sky`, `kin`, `body`, `number` | `--layer-*`; `--sys-*` read them through `SYSTEM_LAYER` | The four map layers and the systems they read, one color each everywhere |
| `danger`, `shadow` | `--danger`, `--lab-shadow` | Errors (always with their message), tinted shadow |

The spark sits on the ink-filled primary action, not on a page surface, so
it is solved against ink. Its floor is 3:1, WCAG 2.2's floor for a graphic
that identifies a control (1.4.11), and `onSpark` meets the same floor on
it. Each palette's spark hue sits off its mood and its layers at chroma 0.2:
magenta h 340 in Groundwater, violet h 290 in Brass and h 305 in Aurora.

The accent, the spark and the four layers are a categorical set. A test
holds every pair at ΔE OK ≥ 0.1 in every palette and theme, so a color
names one thing. The spark is also held apart from `danger`, so a call to
action never reads as an error.
Color is never the only carrier: every layer also has its glyph and its pin
number (`LAYER_META.pin`).

| Palette | Neutral | Accent | Sky | Kin | Body | Number |
|---|---|---|---|---|---|---|
| Groundwater (default) | Blue-black, h 245 | Sonar teal, h 192 | Amber, h 84 | Coral, h 30 | Periwinkle, h 278 | Lime, h 132 |
| Brass | Warm black, h 70 | Ivory (light in dark, deep bronze in light) | Gold, h 85 | Vermilion, h 35 | Jade, h 165 | Ice blue, h 238 |
| Aurora | Violet-black, h 290 | Chartreuse, h 118 | Orange, h 62 | Rose, h 350 | Blue, h 260 | Aqua, h 190 |

The lab ships all three behind a palette switch in the nav (`PaletteSwitch`;
remembered per viewer and applied before first paint by the boot script).
The default is the one the site promotes with.

## Texture

Texture is the survey-map idea made visible. It comes in two fixed, inert
layers, both colored by the palette:

- **Contours.** `public/textures/contours.svg` is a seamless topographic tile
  generated by `scripts/textures/contours.mjs`. It uses periodic fractal value
  noise and marching squares, with every fourth level drawn as an index
  contour. The output is deterministic per seed. The tile is used as a mask
  over `--lab-ink` behind all content (`.lab::before`), and more strongly
  behind a surface with `kit.contours`, tinted by `--contour`. A scene may
  drift the field for parallax by scrubbing a unitless `--drift` that the
  surface turns into `--contour-y`.
- **Grain.** Fractal noise used as an alpha mask over `--lab-ink` on a fixed
  `::after`, at `--grain` opacity. No blend mode: a fixed layer that blends
  would make the compositor re-blend the whole viewport on every scroll
  frame. It never scrolls and never takes input.

## Motion engines

| Engine | Owns | Wrapper | Never |
|---|---|---|---|
| CSS keyframes | First paint: entrances that must start before any script (the atlas draws itself) | classes in the component's module, keyed off `[data-lab]:not([data-motion='paused'])` inside `prefers-reduced-motion: no-preference` | Waits on JavaScript |
| GSAP + ScrollTrigger | Scenes: scroll-scrubbed timelines on a CSS track | `useScene` | Animates a component's own state, or layout |
| anime.js v4 | Illustrations after hydration: rings turning to new data, strokes, staggers, pins following the drawing | `useIllustration`, `useTurn`, `useGlide`, `drawStroke` | Touches HTML layout or scroll |
| Motion (`framer-motion`, LazyMotion) | Responses: values rolling, presence, press and hover | `MotionRoot`, `Rolling`, `m.*` | Runs a scroll timeline |

One element, one engine, and CSS transitions count as an engine. A scene
may move the container a drawing sits in. The drawing's strokes belong to
anime.js or CSS, and a tile inside belongs to Motion. Two engines never
write the same property of the same element.

Lifecycle rules for every wrapper:

- Engines load with `import()` inside the hook, after the first paint.
  An import that resolves after unmount does nothing.
- Work runs in a scope that is reverted on cleanup: `gsap.context`, or
  anime's `createScope` or `animation.revert`. So StrictMode's double
  effect, a route change or new data leave no trigger or inline style
  behind. Scenes never kill global triggers. A hook that sets an inline
  style before paint (`useTurn`, `useGlide`) releases every property it
  set when its animation lands and again on cleanup (`release`,
  `motion/inline-style.ts`).
- Scenes live in route content, not layouts. `ScrollTrigger.refresh()`
  runs after fonts are ready.
- Layout belongs to CSS. A scene's track height and sticky frame are
  reserved in the stylesheet when motion is on, so GSAP only scrubs what is
  already in place. It never pins with spacers, so motion causes no layout
  shift. Scenes scrub unitless progress variables (0 to 1) that the
  stylesheet turns into `transform`, `opacity` and mask positions, so the
  geometry for each breakpoint lives in CSS alone; nothing scrubbed feeds
  `left`, `bottom`, `width` or any other layout property.
- First-paint entrances match only while the lab root carries
  `data-entrance` (`useEntrance`). It comes off once the page's finite CSS
  animations finish, or when motion is paused, and goes back on before
  paint for a client navigation's new content. Resuming never replays one.
- Interruption: new data supersedes a running illustration. An entrance
  never replays on input.
- Entrances below the fold wait for view with `useReveal` (`rest`,
  `armed`, `shown`): armed only while out of sight as motion turns on, so
  nothing a reader can see is ever hidden, and played once. A value whose
  source moved in an order the value cannot show (a day stepping back)
  passes `direction` to `Rolling`.

### Tokens

`src/lib/design/motion-tokens.ts` holds the values once as data:
milliseconds and Bézier tuples. Each wrapper converts them where it
imports its engine: seconds for GSAP and Motion, `cubicBezier(...)` for
anime.js. LabRoot also writes them as CSS variables (`--dur-*`, `--ease-*`,
`--stagger`, `--press-scale`).

| Token | Value | Use |
|---|---|---|
| `none` | 0 | Reduced motion, instant state |
| `press` | 120 ms | Press feedback |
| `quick` | 220 ms | Hover, toggles, exits, values rolling |
| `turn` | 350 ms | An icon turning in place: the primary action's arrow |
| `settle` | 480 ms | A component arriving; rings turning |
| `draw` | 1200 ms | A ring or line drawing itself |
| `standard` | cubic-bezier(0.2, 0, 0, 1) | Most movement |
| `emphasized` | cubic-bezier(0.05, 0.7, 0.1, 1) | Arrivals that land with weight |
| `SPRING` | stiffness 260, damping 30, mass 1 | Motion only |
| `STAGGER` | 40 ms step, whole set within 600 ms (`staggerStep`) | Siblings in a set |
| `PRESS_SCALE` | 0.97 (`--press-scale`) | Anything pressable while pressed; never below 0.95 |
| `MAGNET` | `pull` 0.18 of the pointer's offset from centre, at most `reach` 6 px | A pointer-following control leaning toward the mouse |

Scroll scenes scrub linearly. Their distance is the CSS track, not a
duration.

A stroke that draws itself is one shape everywhere (`motion/draw-in.ts`):
every drawn line has `pathLength` 1; `undrawnStroke()` sets it to one dash
with a gap twice as long, pushed just past the start, so no round cap
shows; `drawStroke(ease)` draws it over `draw` on `emphasized`; and
`landsAt(at)` is when its far end, label or the next beat lands (three
quarters through the draw). Scenes compose these, never their own
constants.

### Policy

- There is one motion switch, `useMotionAllowed()`. It is a
  `useSyncExternalStore` over the lab root that reads the OS
  reduced-motion setting and the lab pause (`lab-state.ts`). The server
  snapshot is `false`, so server markup is the final frame. When the
  switch is off, scenes keep their CSS layout, illustrations show the drawn
  state, `MotionConfig` is set to `reducedMotion="always"`, and `Rolling`
  renders plain text.
- Motion never gates content or input. Server markup is complete and
  readable, and no content waits invisible for a script.
- Animated duplicates are hidden from assistive tech, and the final value
  stays readable (`Rolling` keeps an `srOnly` copy).
- Illustrations run once per new data, not on a loop. The only loops are
  status pulses and the ground artwork.
- Engines never enter a page's first bundle. `client-bundle.test.ts`
  forbids static imports of the ephemeris packages, `gsap` and `animejs`
  from client modules. The wrappers only `import()` them. Motion enters
  through LazyMotion, with `strict` rejecting full `motion.*` components.

## Storyboards

Each section gets a storyboard before it is built: three to five frames
(the scroll or time position, what is on screen, which engine moves what),
greyscale, at `/lab/bento/wireframes` under "Motion storyboards". A section
is built only against its storyboard.

Each storyboard also states its layout. No home section uses a left/right
split or alternating rows. Compositions are centered: a full-width figure
with its facts in one row under it.

| # | Section | Kind | Storyboard in one line |
|---|---|---|---|
| H | Hero (fits one viewport) | CSS first paint + illustration + response | The rings draw, signs and seals stagger, the bodygraph fills, and the pins drop, all in CSS before script. A new date turns the rings the short way (anime.js), and the digest values roll (Motion) |
| 2 | Layers | Scene | The map pins face-on, tilts and parts into four plates in depth. Each scroll step lifts one plate with its digest tile lit, the contour field drifts underneath, and the map closes back into one |
| 3 | Two people | Scene + illustration | Two maps slide together across the full width. Tie lines draw rarest first, and the tie rows settle under the pair with bits rolling |
| 4 | Circles | Illustration | People settle into the ring heaviest first, the strongest ties draw, and the hub sends one sonar ring |
| 5 | Every day | Response + illustration | The day's values roll in like an odometer, then the kin ring turns to the day's seal, the Moon fills to its phase and the hexagram builds from the bottom. Next or previous day rolls the values in that direction and plays the drawings again |
| 6 | Method | Scene | Measured base rates rise as bars, the sample ties drop onto the scale, and the line-or-no-line threshold sweeps in. Pinned on home it scrubs with scroll; inside an article it plays once by time, so it never rests half-swept |
| 7 | Pricing | Response | Plans lift on hover and the ledger reveals row by row |
| 8 | FAQ | Response | Answers open with height and fade together, with no bounce |
| 9 | Close | Scene | The portal artwork pushes in as the page ends, with one action |

## Acceptance

- Every section above has a storyboard before its code lands, and the
  storyboard states its layout.
- With reduced motion on, every section shows its final frame and loses no
  information.
- No layout shift from motion (CLS 0 from animations); 60 fps on scenes on
  a 2020 laptop; first-load JS for pages without scenes does not grow.
- Light and dark, every palette: text tiers at 4.5:1 or better.
- One element, one engine: no component imports two engines for the same
  node.

## Second opinion

| Reviewer | Scope | Date | Status |
|---|---|---|---|
| Codex CLI (gpt-6-astra) | Engine split, lifecycle, pin geometry, tokens, reduced-motion switch, palette emission, bundle boundary, accessibility | 2026-10-28 | Incorporated |
