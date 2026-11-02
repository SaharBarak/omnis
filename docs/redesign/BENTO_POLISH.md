# Bento Polish

The surface pass on the bento tree (`/lab/bento/**`) and its kit
(`src/components/bento-lab`): elevation, radii, image edges, wrapping,
numerals, hit areas and the transitions that answer the hand. It applies
the make-interfaces-feel-better principles (jakubkrehel, MIT) through the
token layers the tree already has, the same way BENTO_TYPE.md does for
type and BENTO_MOTION.md does for motion. Those two documents stay law;
nothing here moves a motion engine or a type role.

## Problem class

Every raised thing on a page sits on one scale of height, so a card, a
tile, a menu and a figure's frame relate to each other the way the type
roles do. The population is every `box-shadow`, every `border-radius` and
every bordered container in the lab's CSS modules: about 45 shadows, 130
radii and 40 bordered surfaces across 15 modules. Without a scale each
shadow is a literal picked for its own box (`0 48px 96px -56px`,
`0 22px 40px -30px`, `0 20px 36px -30px`, `0 18px 40px -22px`), radii run
through fifteen values from 6 to 34 px, and depth is carried by solid
1 px borders in the opaque hairline colour. A solid line reads as a drawn
stroke on the contour field and the portal art; in light it reads as a
wireframe, and in dark the drops under it barely show. A new surface
should take a level and a radius role, never a shadow or a size.

## Principles applied

| Principle (skill) | Rule in this tree |
|---|---|
| Shadows for elevation, borders for structure | Depth comes from `--elevation-N`. A container's edge is its 1 px border painted in `--elevation-edge`, a translucent ink, with the background clipped to the padding box, so the edge lies over the page and adapts to any ground the way a shadow ring does. Dividers, table rules, dashed empty states, dense grid cells, segmented-control tracks and form fields keep the opaque hairline. |
| Concentric border radius | Radii are roles (`--radius-*`). A surface that holds another at 24 px or less takes `inner + padding + edge`; above that the two are separate surfaces. |
| Image outlines | Media wells (the atlas stage, banners, library tiles, the sign-in art, the closing call) carry `--image-outline`: pure black at 10% in light, pure white at 10% in dark, inset by its own width. Never a tinted neutral. |
| Text wrapping | Card headings (`.h3`) balance; leads, `.body` and FAQ answers are `pretty`. |
| Tabular numbers | Every table cell sets tabular figures, so a rolling tie weight never shifts its column. |
| Minimum hit area | The bar's icon buttons reach `--hit-min` (40 px) with a pseudo-element; 44 px would overlap their 8 px gaps. |
| Scale on press | Pills, icon buttons and the figure's one action press to `var(--press-scale)` over `--dur-press`, only while motion is allowed. |
| Interruptible, specific transitions | Every CSS transition names its properties and reads `--dur-*` and `--ease-*`. A hover lift is a transition, never a keyframe. |
| Motion restraint | A hover lift is one level at `--dur-quick`. Movement that comes with it (a nudge, a zoom) sits behind `prefers-reduced-motion: no-preference` and the lab pause; the static cue (edge colour, level) stays. |
| States that survive forced colours | A selection is a border colour or an outline, never a box-shadow ring, so it still paints with forced colours on and a hover transition between levels stays whole. |

## Elevation

`src/lib/design/elevation.ts` holds the scale as data and emits it per
theme beside the palette stylesheet (LabRoot), keyed by `data-theme` on the
lab root. Colours come from the palette: drops read `--lab-shadow` (the
palette's tinted shadow role, which already carries each theme's strength)
and the edge and highlight read `--lab-ink`. No component reads
`--lab-shadow` directly. The tokens resolve on the lab root, which is the
only element that changes theme.

### Height

Level `n` stands `2 · 3^(n − 1)` px above the page. Each level is the level
below plus one rise at its own height, so the levels stack like a smooth
shadow and a one-level lift is one layer.

| Level | Height | Role | Used by |
|---|---|---|---|
| 0 | 0 | Edge only | A container set into a card: notes, quoted lines, inset readout tiles |
| 1 | 2 px | Rest | Cards, list tiles, digest tiles, FAQ items, oracle seats, a selected segment |
| 2 | 6 px | Raised | Board tiles, figure facts, plans, hero columns, the sign-in card, the figure's one action; a resting card under the pointer |
| 3 | 18 px | Over | The glass bar, menus, the compare bar, pin cards and badges over a drawing, the skip link; a raised card under the pointer |
| 4 | 54 px | Frame | A full-width figure's frame: the figure shell, the layers stage, the day board, the method chart |

### Layers

Painted top first.

| Layer | Geometry | Colour | Levels |
|---|---|---|---|
| Highlight | `inset 0 1px 0` | `--lab-ink` at the theme's highlight share | 1 to 4, dark theme only |
| Contact | `0 1px 2px 0` | `--lab-shadow` at half | 1 to 4 |
| Rise `k` | `0 h 2h −h/2`, for each height `h` up to the level's | `--lab-shadow` at `0.6 / √k` | 1 to 4, one per level |

A rise is spread in by half its offset, so it falls under the box (the
light is above the page) and still shows under a box a little taller than
its height: a 32 px badge keeps its level-3 rise. Its share falls with the
square root of its level, so a tall stack's darkest point stays at the
contact instead of building up under the box.

| Theme | Edge | Highlight | Why |
|---|---|---|---|
| Dark | ink at 10% | ink at 7% | Drops barely read on a dark ground; the edge and a top highlight carry the depth. |
| Light | ink at 8% | none | Drops carry the depth; a dark top line would read as a recess. |

### Custom properties

| Property | Value |
|---|---|
| `--elevation-edge` | The edge colour a surface's border takes |
| `--elevation-0` … `--elevation-4` | The full stack for a level (`none` at 0) |
| `--elevation-rise-1` … `--elevation-rise-4` | The one layer a level adds over the level below |
| `--image-outline` | The neutral outline colour for media |

A surface takes an edge and a level:

```css
.card {
  border: var(--edge-w) solid var(--elevation-edge);
  background: var(--lab-surface);
  background-clip: padding-box;
  box-shadow: var(--elevation-1);
}
```

A hover owned by CSS moves one level with
`transition: box-shadow var(--dur-quick) var(--ease-standard)`. The plans
(storyboard 7) keep Motion's lift and edge tint (`--lift`, `y`); their
shadow rises on a pseudo-element of its own: `::after` holds
`--elevation-rise-3` over the card's border box and fades its opacity on
hover with a CSS transition, so the card lands on exactly level 3, the
stack is never repainted, and no element has two engines. With motion off,
the card is static and the hover still tints its edge and raises it, at
once. The featured plan stands on the same levels; its brand border, inset
brand ring and tint mark it.

## Radius

`src/lib/design/radius.ts` holds the roles; LabRoot emits them as
`--radius-<role>`, with `--edge-w` (every surface's 1 px edge) and
`--frame-rim`.

| Role | px | Used for |
|---|---|---|
| `cell` | 8 | A day in a calendar grid, a strip cell, a small toggle |
| `control` | 12 | Inputs, selects, menu rows, rail links, notices, pin cards, skeletons |
| `inset` | 16 | A panel set inside a card: readout tiles, quoted lines, notes, oracle seats |
| `card` | 22 | Cards, tiles, plans, FAQ items, empty states |
| `stage` | 28 | A figure's art well, a page's large panel, a banner |
| `frame` | 35 | A full-width figure's frame: `stage + rim + edge` |

Concentric pairs derive, never pick:

| Outer | Inner | Rule |
|---|---|---|
| Figure shell | Its stage | `frame = stage + rim (6) + edge (1)` |
| Day board | Its tiles | Padding `frame − card − edge` (12 px) |
| Bar menus, account menu | Menu rows | `calc(var(--radius-control) + var(--menu-pad) + var(--edge-w))` |
| FAQ item | Its summary | `inherit` (no padding between) |

`50%` (a disc), `999px` (a pill) and `inherit` are shapes, not sizes. A
mark inside a drawing (a chart bar's cap, a hexagram segment, a glyph
stroke) is drawing geometry and carries `/* drawing */`.

## Findings

Mode `full`. Scope: `src/app/lab/bento/**` and `src/components/bento-lab/**`,
Next.js 16, CSS Modules with tokens from `src/lib/design/*` emitted by
LabRoot. Out of scope: the brand lockup (`site/top-bar.tsx`,
`site/site-footer.tsx`, `.brand`), the button rules (`.btn*`, `.primary*`,
`.ghost`), the palette modules and `src/lib/brand/**`.

### Scope and coverage

| Category | Evidence inspected | Result |
|---|---|---|
| Typography | Every lab CSS module's type rules; table and rolling values; root font smoothing (`antialiased` on `body` in `src/app/layout.tsx`) | 2 findings |
| Surfaces | Every `box-shadow`, `border-radius` and bordered container in the 15 modules and inline styles; every public route at 1440 and 390 in both themes | 6 findings |
| Animations | Every CSS `transition` and press rule; `plan-motion.tsx` | 4 findings |
| Icons | Icon buttons in the bar; lucide icons in figures and cards (one set, `currentColor`) | 1 finding |
| Performance | Transition property lists, the plan's per-frame shadow, `will-change` | Covered by the animation findings |

### Shadows for elevation, borders for structure

| Severity | Location | Before | After | Why |
|---|---|---|---|---|
| MEDIUM | `blocks/blocks.module.css` board, tile, chart, plan, FAQ; `scenes/figure.module.css` shell, surface, action; `scenes/layers.module.css` plate; `kit.module.css` glass, skip; `atlas/atlas.module.css` segment | Each surface writes its own drop (`0 48px 96px -56px`, `0 22px 40px -30px`, `0 20px 36px -30px`, `0 18px 40px -22px`, `0 1px 2px`) over a local `--highlight` | `box-shadow: var(--elevation-N)` from one scale | One height per role; a new surface takes a level, not a literal |
| MEDIUM | `site/site.module.css` card; `tools/tools.module.css` card, save bar; `people/people.module.css` tile, panel; `atlas/digest.module.css` tile; `docs/docs.module.css` lines, system layer and shelf; `systems/systems.module.css` note, tile, system tile; `_home/hero.module.css` columns; `login/login.module.css` card; `scenes/layers.module.css` stage; `scenes/circle.module.css` seal; `blocks/blocks.module.css` seat | `border: 1px solid var(--lab-line)` as the only depth | Edge in `--elevation-edge` over the page, plus a level | An opaque line reads as a stroke on the contour field and as a wireframe in light; a translucent edge and a drop adapt to any ground |
| MEDIUM | `blocks/blocks.module.css` `--highlight`; `scenes/figure.module.css`; `site/site.module.css` card; `scenes/circle.module.css` seal | Top highlight `inset 0 1px 0` of `--lab-ink` in both themes | Highlight in dark only, inside the level | In light, ink is dark: the highlight drew a dark line under the top edge, which reads as a recess |
| LOW | `systems/systems.module.css` segment; `atlas/atlas.module.css` layer switch; `login/login.module.css` tabs | Selected segment marked by a 1 px line or an ad-hoc `0 1px 2px` | `var(--elevation-1)` | The three segmented controls lift their selection the same way |
| LOW | `people/people.module.css` tile; `systems/systems.module.css` system tile, article card; `docs/docs.module.css` neighbours | Hover changes the border colour only | Hover also rises one level | The card answers the pointer with height, as the plans do |
| LOW | `people/people.module.css` selected tile; `systems/systems.module.css` active tile | Selection drawn as an inset box-shadow ring | Border colour plus an inset outline | A shadow ring vanishes with forced colours on and breaks the hover transition between levels |

### Concentric border radius

| Severity | Location | Before | After | Why |
|---|---|---|---|---|
| MEDIUM | `blocks/blocks.module.css` board and tiles | Board `30px` around `22px` tiles at `10px` padding and a 1 px border (22 + 11 = 33) | Board `var(--radius-frame)`, padding `frame − card − edge` | The tiles' corners bulged toward the frame's |
| LOW | `site/site.module.css` menu panels and rows | Panel `18px`, rows `10px`, padding `8px` as three literals | `calc(var(--radius-control) + var(--menu-pad) + var(--edge-w))` | The pair holds by derivation, not by coincidence |
| LOW | Every lab module; `people/page-skeleton.tsx`, `atlas/place-field.tsx` inline styles | Fifteen radius literals (6 to 34 px) | Six roles; a test rejects raw radii in CSS, clip paths, radius variables and inline styles | Sizes belong to a table, as type sizes do |

### Image outlines

| Severity | Location | Before | After | Why |
|---|---|---|---|---|
| LOW | `atlas/atlas.module.css` stage; `docs/docs.module.css` library tile; `systems/systems.module.css` banner; `login/login.module.css` art; `tools/tools.module.css` relation stage; `blocks/blocks.module.css` close | The art's own edge, which disappears into a light page | `outline: var(--edge-w) solid var(--image-outline)`, inset by its width | A neutral inset edge separates art from the page in both themes without a tinted line |

### Text wrapping

| Severity | Location | Before | After | Why |
|---|---|---|---|---|
| LOW | `site/site.module.css` `.h3`, `.lead`, `.body`; `blocks/blocks.module.css` FAQ answers | `.h3` wraps greedily; `.body` and answers can orphan a word; `.lead` is pretty only inside a section head | `.h3` balances; `.lead`, `.body` and answers are `pretty` everywhere | Card titles and short paragraphs end on full lines |

### Tabular numbers

| Severity | Location | Before | After | Why |
|---|---|---|---|---|
| MEDIUM | `site/site.module.css` `.table` | Proportional figures while tie weights roll in its cells (`pair-scene.tsx` `RowBits`) | `font-variant-numeric: tabular-nums` | Proportional digits shift the column on every frame of a roll |

### Minimum hit area

| Severity | Location | Before | After | Why |
|---|---|---|---|---|
| MEDIUM | `kit.module.css` `.iconButton` | A 32 × 32 target (theme, palette, motion, menu) | A centred `::after` at `--hit-min` (40 px) | The bar's most used controls were under the 40 px floor; 40 is the most an 8 px gap allows without two targets meeting |

### Scale on press and transitions

| Severity | Location | Before | After | Why |
|---|---|---|---|---|
| LOW | `kit.module.css` pill, icon button; `scenes/figure.module.css` action | No press feedback on pills and icon buttons; the action sinks by `translateY(1px) scale(0.99)` even with reduced motion | `scale: var(--press-scale)` over `--dur-press`, behind reduced motion and the lab pause | A press answers immediately and the same way on every control |
| LOW | `kit.module.css`; `site/site.module.css` input; `people/people.module.css`; `tools/tools.module.css`; `docs/docs.module.css`; `atlas/atlas.module.css`; `systems/systems.module.css` | Literal `0.2s ease`, `0.3s`, `0.35s`, `0.4s`, `0.45s cubic-bezier(0.16, 1, 0.3, 1)`, `0.6s`; transitions on properties that never change (`transform` on a person tile, `translate` on an article card) | `--dur-quick`, `--dur-settle`, `--ease-standard`, `--ease-emphasized`; dead properties removed | Durations are tokens (BENTO_MOTION.md "Tokens"); a transition lists only what changes |
| LOW | `blocks/blocks.module.css` plan | The shadow was recomputed from `--lift` on every frame of the hover | Resting `--elevation-2`; `--elevation-rise-3` on `::after`, faded by its own transition | The lift lands on exactly level 3 and the stack is never repainted |
| LOW | `docs/docs.module.css` library art; `systems/systems.module.css` system tile; `scenes/figure.module.css` action arrow | Zoom, nudge and arrow slide applied with reduced motion on (only their transition removed) | The movement sits behind `prefers-reduced-motion: no-preference` and the lab pause | Reduced motion keeps the static cue and drops the movement |

### Considered but rejected

| Location | Candidate | Rejected because |
|---|---|---|
| `blocks/blocks.module.css` close | An outer shadow on the closing call | It clips itself with `clip-path: inset(0 round …)`, which clips any outer shadow; it keeps the media outline |
| `docs/docs.module.css` article banner | The media outline | The title sits in a page-coloured notch over its corner, and an outline would cut across the notch |
| `_home/hero.module.css` columns | Concentric with their 22 px tiles (44 px, or 12 px padding) | The padding sits at the 24 px threshold where the layers are separate surfaces, and the rail's padding is under BENTO_TYPE's fit acceptance |
| `people/people.module.css` filters; segmented controls | Extend 30 px segments and filters to 40 px | They sit 2 to 6 px apart; any extension overlaps a neighbour's target |
| `kit.module.css` glass | Keep the glass's own rim beside the elevation edge | Two edges a pixel apart; the edge and highlight are the rim |
| Every module | `will-change` on lifting cards | No first-frame stutter observed; each extra layer costs memory |

## Acceptance

- No lab CSS module reads `--lab-shadow`, and every outer blurred shadow
  in one is an elevation token (`elevation.test.ts`).
- Every radius in the lab's CSS modules, clip paths, radius variables and
  inline styles is a role, a derivation from tokens, a shape or marked
  drawing geometry (`radius.test.ts`).
- The levels rise monotonically; each level is the one below plus its
  rise; level 0 is the edge alone; only the dark theme carries a
  highlight; media outlines are pure black or white.
- Every public route renders at 1440 × 900 and 390 × 844, dark and light,
  with no horizontal scroll; shadows read as quiet lift in light and as
  edge and highlight in dark, and nothing is cut off.
- Typecheck, lint and tests pass.

## Second opinion

| Reviewer | Scope | Date | Status |
|---|---|---|---|
| Independent Claude agent (read-only) | Elevation model, custom-property resolution, theme recipe, rise cross-fade, edge as border, forced colours, radius roles, enforcement | 2026-11-02 | Incorporated |
