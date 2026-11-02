# Bento Colour

Every colour on the bento site comes from the mark. The Lantern
(BRAND_MARK.md) is a cyan frame around a lit gold window on a navy tile; the
palette is those three colours and what a named harmony derives from them.
Hues come from the mark by rule. Lightness comes from a solver held to
published gates. What stays authored is listed under "Authored data", each
value with what holds it.

## Problem class

The population is every coloured pixel on the bento pages: surfaces and
text, links, focus and selection, the primary action, the four map layers
wherever they are drawn (atlas, scenes, board, charts, digest), form errors,
the mark itself, and the background texture. They share one question: which
colour does this role take, in each theme and contrast mode, and why that
one. A new role answers it from this document's rules, not from a swatch.

## Sources

| Source | Rule applied here |
|---|---|
| Itten, *The Art of Color* (1961): contrast of hue, of warm and cool, of complements | The palette is a double-complementary set; warm hues carry signals, cool hues carry structure |
| The 60-30-10 rule of colour proportion | The neutral covers the page, the accent is the most frequent colour, the spark is rare |
| Niki Aroca, colour reel (Instagram, 2026) | Two colours set the mood; a third, off the mood, is used sparingly on the call to action |
| Data visualisation method (bundled `dataviz` skill and its `validate_palette.js`) | A categorical set lies in a lightness band, keeps chroma ≥ 0.10, separates every pair for normal and colour-deficient vision, and reaches 3:1 on its surface; text never wears a series colour |
| Machado, Oliveira and Fernandes (2009), severity 1.0 | The protan, deutan and tritan simulation the separation gates use |
| WCAG 2.2: 1.4.1, 1.4.3, 1.4.6, 1.4.11 | Colour is never the only cue; text 4.5:1; enhanced text 7:1; graphics that carry meaning 3:1 |
| Apple HIG, Color and Dark Mode; CSS Media Queries 5 | One colour, one meaning; every colour works in light, dark and increased contrast; forced colours hand the palette to the system |

## Anchors

The mark's colours as the owner picked them. They are stored as hex and
converted with `hexToOklch`, so the dark theme reproduces them exactly.

| Part | Hex | L | C | h | Anchors |
|---|---|---|---|---|---|
| Frame | `#42e5e0` | 0.840 | 0.130 | 192 | `accent` |
| Window | `#eeb318` | 0.800 | 0.160 | 84 | `spark` |
| Tile | `#0b161f` | 0.194 | 0.024 | 244 | the neutral ramp |

The palette lives in sRGB because the mark does. No role gets a Display P3
value: a wider gold or cyan would drift from the logo, and every gate below
is measured on exactly what is emitted.

## Harmony: the lantern rectangle

Frame and window sit 108° apart on the hue wheel, one cool, one warm. Their
complements are coral (frame + 180°, h 12) and indigo (window + 180°,
h 264). The four hues form a rectangle on the wheel: two complementary
pairs, each warm hue across from a cool one. This is the constraint the
palette is built on; the gates below, not the geometry, guarantee that the
colours can be told apart.

| Hue | Derivation | Warm or cool |
|---|---|---|
| 84, gold | the window | warm |
| 192, cyan | the frame | cool |
| 12, coral | frame + 180° | warm |
| 264, indigo | window + 180° | cool |

The neutral takes the tile's hue (244) in both themes: the dark ground is
the tile, the light ground is the pale base it hangs over. One hue, one
ramp. Red for `danger` is the one hue outside the rectangle, because red is
the convention for an error.

## Roles

| Role | Variables | Source | Tone |
|---|---|---|---|
| Surfaces | `--lab-page`, `--lab-surface`, `--surface-2`, `--lab-chip`, `--lab-line`, `--lab-art` | tile hue, recipe steps | recipe |
| Ink | `--lab-ink`, `--lab-text-2`, `--lab-text-3` | tile hue, low chroma | ink2 ≥ 7:1, ink3 ≥ 4.5:1 on every text surface |
| `onInk` | `--lab-on-ink` | the surface farthest from ink | derived |
| `accent`, `accentSoft`, `onAccent` | `--brand`, `--lab-bright`, `--brand-soft`, `--on-accent` | the frame | dark: the frame; light: solved for 4.5:1 from 0.45; `onAccent` is `onInk` where it reads at 4.5:1, else ink |
| `focus` | `--focus` | the accent | 3:1 against every surface, drawn with an offset |
| `spark` | none: it reaches the page through the action and the mark | the window | the window in both themes |
| `action`, `onAction`, `actionHover`, `actionGlow` | `--action`, `--on-action`, `--action-hover`, `--action-glow` | spark and night | "The primary action" |
| `sparkMark` | mark only | the window solved to 3:1 on the tile | dark: the window; light: deeper gold |
| Layers | `--layer-*`, `--sys-*`; `--on-layer-*` | the rectangle | "Layers" |
| `danger` | `--danger` | red, h 28 | solved for 4.5:1 |

**Warm signals, cool structure.** The accent, cool, carries structure:
links, selection, lit bars. The spark, warm, carries the one call to action.
Danger is the other warm signal.

**Shared hues are told apart by form, then by tone.** Three pairs share a
hue family: the sky layer and the spark (gold), the number layer and the
accent (cyan), the kin layer and danger (red). Tone alone does not carry
meaning, so each role also has a form the other never takes:

- A layer is always a mark with its glyph and its pin number (`LAYER_META.pin`); its words are ink.
- The spark is only ever the filled action.
- Selection and focus are an outline with an offset, never a layer-coloured fill.
- An error always carries its message and the field's `aria-invalid` state, never colour alone.

Tone then separates them as a second cue: see the role gate below.

**Proportion.** Neutrals cover the page. The accent is the most frequent
colour in the interface. The spark appears once per view plus the mark's
window.

## The primary action

The action is the lantern at button size, gold and night. Night is the dark
pole of the neutral ramp: the ground in the dark theme, ink in the light
one. The pill takes the spark when the spark reaches 3:1 against the page,
otherwise night; the label and the disc take the other, and the disc's icon
takes the pill's colour. This 3:1 boundary is this design's requirement,
stricter than WCAG, which accepts a labelled button without one.

| Theme | Pill (`action`) | Label and disc (`onAction`) | Icon |
|---|---|---|---|
| Dark | spark gold | night | gold |
| Light | night | spark gold | night |

On hover and focus the pill takes `actionHover`, the pill mixed in OKLab a
step toward its disc colour. The light that follows the pointer is
`actionGlow`: the brightest spark-hued light the label still reads on at
4.5:1, solved down from white, drawn at the palette's glow strength. On the
dark theme that is white over the gold pill; on the light theme a deep gold
over the night pill.

Gates, on the emitted colours: the label ≥ 4.5:1 on the pill, on the hover
fill and under the pointer light composited over either; the icon ≥ 3:1 on
the disc; the pill ≥ 3:1 on every surface it sits on.

## Layers

The four map layers take the four rectangle hues at chroma 0.13, one value
so no layer outweighs another. Lightness is solved per theme by
`solveCategorical` (`src/lib/design/categorical.ts`) and committed as a
generated table, `src/lib/design/palette-tones.gen.ts`, written by
`npm run palette:tones`. The resolver reads the table; a test reruns the
solver and fails when the committed table drifts. Nothing searches at
render. Every other role lives in `palette-spec.ts`, which never reads the
table, so the generator runs even with the table missing.

**Search.** Each slot takes lightness from the theme's band on a grid of
0.02 starting at the band's floor. Every combination is checked against the
gates on its emitted sRGB hex. Among passing sets the solver maximises

`score = min(normal ÷ 15, cvd ÷ 8) − (max L − min L)`

where `normal` is the smallest all-pairs ΔE OK × 100 under normal vision
and `cvd` the smallest under protan, deutan and tritan simulation.
Ties go to the set met first in the grid's order (slots in the order sky,
kin, body, number; lightness ascending), so the result is deterministic. If
no set passes, generation fails.

| Gate | Value | From |
|---|---|---|
| Lightness band | dark 0.48–0.67, light 0.43–0.77 | dataviz method |
| Chroma after gamut mapping | ≥ 0.10 | dataviz method |
| Contrast on every surface it sits on | ≥ 3:1 | WCAG 1.4.11 |
| A legible label on it (ground or ink, whichever is higher) | ≥ 4.5:1 | WCAG 1.4.3, for pin numbers |
| Every pair, normal vision | ΔE ≥ 15 | dataviz method |
| Every pair, protan, deutan and tritan | ΔE ≥ 8 | dataviz method, Machado 2009 |
| Each layer against `accent`, `spark`, `danger` | ΔE ≥ 12, full colour vision | this document |

The role gate sits below the normal-vision floor, and is not run under
simulated colour vision, because a layer and a brand role never share a
component and always differ in form ("Roles"): for colour-deficient vision,
form is the cue, as WCAG 1.4.1 asks.
`--on-layer-*` is the label colour the legibility gate found.

**Text never wears a layer colour.** A layer colours its mark, glyph, pin,
tile border and tint. Numbers and words beside it are ink.

## The mark

The dark theme reproduces the anchors exactly. In the light theme, on a
white tile, the frame takes the light accent and the window takes
`sparkMark`, so both reach 3:1 against the tile. The generator writes the
tones into `mark-tones.gen.ts` (BRAND_MARK.md "Colour").

## Contrast modes

- **Increased contrast** (`prefers-contrast: more`): the secondary and
  tertiary text tiers take ink, hairlines take ink3, and both textures are
  hidden.
- **Forced colours** (`forced-colors: active`): the system palette replaces
  every role. Both textures are hidden. Layers stay identifiable by glyph and
  pin number; the action keeps a border so its pill still shows; focus uses
  the system `Highlight`.

## Authored data

Everything the palette does not derive, in `src/lib/design/palette-spec.ts`,
with what holds each value:

| Value | Where | Held by |
|---|---|---|
| Anchors: frame, window, tile | `PaletteSpec.anchors` | the owner's pick of the mark |
| Surface lightness steps, ink lightness | `RECIPES[theme]` | the ink tiers' floors (7:1, 4.5:1) solved against them; the elevation tests |
| Preferred starts for ink2, ink3, accent (light), danger | `RECIPES[theme].preferred` | solving moves each only as far as its floor needs |
| Layer band | `RECIPES[theme].band` | the data-visualisation method |
| Shadow lightness and strength | `RECIPES[theme].shadow*` | the elevation tests (BENTO_POLISH.md) |
| Surface share of the tile's chroma | `RECIPES[theme].neutralChroma` | light surfaces read as tinted at a third of the chroma |
| Layer chroma, 0.13 | `PaletteSpec.layerChroma` | the categorical gates, which the solver must clear |
| Danger hue and chroma, h 28, C 0.19 | `PaletteSpec.danger` | the convention for red; the role gate against the kin layer |
| Ink tier chroma, 0.012, 0.024, 0.036 | `PaletteSpec.inkChroma` | the tile's hue stays visible in the quieter tiers |
| Soft accent share, 0.55 | `PaletteSpec.softShare` | its own 4.5:1 floor |
| Action hover step, 0.12, and glow strength, 0.45 | `PaletteSpec.action` | the action's label gates |
| Gate values | `CATEGORICAL_GATES`, `FLOORS` | the data-visualisation method and WCAG |

## One palette

The site has one palette, `lantern`. The module keeps its shape (a list of
specs resolved per theme), so a further palette can be added as data from
its own anchors and held to the same gates. The palette switch shows only
when there is more than one palette.

## Emission

LabRoot writes one rule per palette × theme on `[data-lab]` and
`[data-swatch]`, then the increased-contrast overrides inside
`@media (prefers-contrast: more)`. Every value is an sRGB hex: six digits
for an opaque role, eight for a translucent one (the shadow, the pointer
light). Canvas renderers read the variables directly. Contrast is measured on the colour
quantised to those 8 bits, so a solved floor holds for the emitted hex.
Client modules import only `palette-ids.ts`; the solver runs only in the
generator and the tests.

## Acceptance

- `bento-palette.test.ts`, per theme and on emitted hex: every layer gate;
  the role floors; the action gates; the dark accent and spark equal to the
  anchors; the committed tone table equal to a fresh solve.
- The mark's dark tones equal the anchors; the icon drift test passes.
- No bento component sets a colour outside the role variables.
- Screenshots of the home page, dark and light, at 1440 × 900 and
  390 × 844, before and after.

## Second opinion

| Reviewer | Scope | Date | Status |
|---|---|---|---|
| Codex CLI (gpt-6-astra) | Harmony and roles, solver architecture, action rule, contrast modes, P3, focus, chart text | 2026-11-02 | Incorporated |
