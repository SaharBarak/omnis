# The wireframes in Figma

The Figma file "Pleiad · Bento wireframes" is a print of the wireframes page
(`/lab/bento/wireframes`): its variables come from the page's tokens, its
components from the wireframe kit, and the page is a frame of real layers
placed where the browser places them. Nothing in it is drawn by hand and
nothing in it is a picture of the page, so the next commit reprints the file
instead of drifting from it.

## 1. The problem

A capture (html-to-design) gives a picture of a page: raw frames with no
component or variable, held by absolute position. A file built by hand, call
by call, is right once and drifts on the next commit, and on the Starter plan
it cannot even be finished (§2).

The class of problem is keeping an editable design-tool mirror of a page that
is printed from code. The answer is a pipeline that prints the file from the
running page and the kit's source, runs unattended, and checks the file
against the page it prints.

| Population | Count |
| --- | --- |
| Routes | 1, `/lab/bento/wireframes` (`scripts/design/routes.mjs`) |
| Viewports | 1440 × 900 |
| Prints | 1, the greyscale wireframe |
| Template figures | 12 (T1–T12), each a sheet and a slot legend |
| Storyboards | 10 (H, A, 2–9), 39 frames, each an SVG drawing |
| Tokens | the `--wf-*` custom properties on the page root |
| Kit | the exports of `src/components/bento-lab/wireframe/` |
| Faces | Barlow, Space Grotesk, Rubik, all served by Figma |

**Prior art.** The pipeline is Taruu's print (`taruu-monorepo`,
`docs/FIGMA_PRINT.md` and `apps/web/scripts/design/figma-print/`), ported:
its layout derivation, its component census, its token binding, the plugin's
reconcile by key and self-check, and its acceptance lines are the same code.
What differs is the page it reads:

| Taruu | Here |
| --- | --- |
| 25 routes, signed in, read from a fixture build with its own backend and member session | One static route, read from the dev server at `CONFIG.base`; no backend, session or held clock |
| Two prints (design and wire) in twin collections, a print axis on every component | The prints are a table (`prints-table.mts`), one here: one collection, no twin aliases, no print axis, and a purity line with nothing to judge (§6) |
| Right to left | Left to right; direction is read per element, so a right-to-left island prints as Taruu's do (§4) |
| One kit module | Kit modules are a registry (§7) |
| Webpack class names | Turbopack and webpack class names, by a grammar table (§2) |

## 2. Constraints

| Constraint | Consequence |
| --- | --- |
| The team is on Figma Starter: 3 pages a file | The file has two printed pages (§8) and leaves the third to people |
| Starter allows 1 mode per variable collection | One collection per print, one mode each |
| Starter caps the MCP file tools at 20 calls a month, the REST API reads at a few a month, and REST cannot create nodes | The writer is a development plugin run in Figma desktop |
| Figma desktop has no remote debugging switch | The plugin is the only way into the editor; it carries its plan, so printing needs no network |
| Turbopack's dev server names CSS-module classes `file-module__hash__local`, its production build `hash_local` (no module), webpack `File_local__hash` | The measure reads the dev server, whose grammar keeps the module; the grammars are a table (`CONFIG.classGrammars`), a part is always `module.local`, and the plan refuses a tree none of whose classes a grammar spells |
| Auto layout has no margins, no subgrid and no alignment for a single child | Margins are padding or holding frames, subgrids fold into their grid, a self-aligned child gets a wrapper (§5) |
| Figma's SVG importer draws no markers, reads no stylesheet and keeps an element's `id` as its layer name | The walker writes each drawing self-contained (§3.1, "Drawings") |

## 3. Pipeline

`measure → plan → print → check`. The code is in
`scripts/design/figma-print/`. Its output is build output, under
`.figma-print/` (gitignored).

| Stage | Code | Reads | Writes |
| --- | --- | --- | --- |
| kit | `kit.mts`, a table | the kit's exports and CSS modules, which `checkKit` proves every row against | which measured elements are components, and the axes their variants differ on |
| measure | `measure.mjs`, `walker.mjs`, `protocol.mjs`, `structure.mjs`, `cascade.mjs`: Playwright and the DevTools protocol | the route at `CONFIG.base`, the dev server | one raw tree per route and viewport, every print, stamped |
| plan | `plan/index.mts`, pure | the raw trees and the kit table | one bundle: the library, the components and a frame per route, viewport and print |
| print | `plugin/`, run in Figma desktop | the bundle it carries | the file, reconciled by key; a report of every keyed box |
| check | `check.mts`, pure | the bundle and the plugin's report | the result of each line of §9 |

`plan/schema.mts` is the contract between the stages: `PlanBundle` is what the
plugin prints and `PrintReport` is what it sends back. `build.mjs` runs
measure, plan and the plugin bundle in one call. `receiver.mjs` listens on
loopback and files the plugin's reports and route PNGs where the check finds
them (`reports.mts`).

### 3.1 Measure

- **The page's contract.** The walker reads from the one element marked
  `data-print` (`CONFIG.root`), the wireframes page's root, whose value names
  its print. A route with no such element, or more than one, is not read:
  there is no fallback to the body, and nothing outside the root (the
  framework's overlays) is read.
- The script visits the route with `scripts/design/visit.mjs`, which blocks
  analytics hosts so nothing counts a visit. It reads only a base on this
  machine's loopback.
- Transitions, scroll snapping and smooth scrolling are off while reading.
- **Held still.** A page has settled once its height and element count hold
  for the quiet window and nothing is `aria-busy`; the raw tree keeps per
  print whether it did (`settled`). The route is static, so no data read is
  held.
- **Scrollers at rest.** Before each read every scroller but the document
  jumps to its start, the page runs two frames so a scroll handler can
  answer, and the measure counts the scrollers still off their start
  (`restless`).
- Every print is read in one load, back to back. Boxes come from the primary
  print's walk; a twin's walk is merged into that structure and the raw tree
  counts every box it moved (`geometry`). Paints and visibility are read per
  print.
- For each element it records its identity (tag, classes, `data-*`), its box,
  its computed layout, its paints with the token each was authored through
  (the DevTools matched styles give the `var()` behind each value), its text
  runs with the face Chrome used and their glyph rects, its drawings, and the
  `::before` and `::after` boxes that paint.
- **Pseudo-elements.** One paints when its own box paints or its content
  generates visible text or an image. The layout snapshot says which
  pseudo-elements render and gives the text their content laid out, which the
  plan prints; the computed `content` is never read. Their boxes move from
  the viewport into document space by the document's scroll offset.
- **DevTools reads** (`protocol.mjs`). Every element the walk named, and every
  shape of a drawing, is looked up in the document and every read is counted:
  one that finds no element is a miss, one that fails an error (`reads`).
- **Line boxes.** One hidden probe line per distinct face, size and line
  height measures where its line box starts above its glyphs; each text run
  carries that `lead`, and the planner places a text on its line box.
- **Authored tokens** (`cascade.mjs`). The matched styles give the declaration
  behind each bound value, ranked as the cascade ranks it: origin and
  importance, layers, specificity, order, the style attribute above every
  rule. An inherited property declared `inherit` takes the parent's
  declaration, one declared `revert` the user agent's or the parent's; a
  colour naming `currentcolor` reads the colour's chains.
- **Declared keywords.** The measure records the margin and inset sides whose
  winning declaration is `auto`, which the computed style resolves away.
- **Drawings.** An inline SVG is one layer, written so it imports with
  `createNodeFromSvg` without the page's CSS:
  - every computed paint, dash, dash offset, line cap and join is written onto
    each shape, and every computed text property (family, size, weight,
    letter spacing, anchor, baseline) onto each text; a container keeps its
    own opacity only, as its shapes carry the paints it would pass down;
  - a dash normalised by `pathLength` is rescaled to the shape's real length
    and the `pathLength` dropped;
  - a marker is expanded into its own shapes at the end it marks, turned by its
    orient to the line's direction and scaled by its units and viewBox, and
    the marker reference dropped;
  - each shape carries a layer id of its node, `fp-<id>`, which the importer
    keeps as the layer's name; a marker's shape drawn at several ends carries
    one id per end (`fp-<id>`, `fp-<id>.1`, …). The raw tree lists each shape
    with its paints, its authored chains and its layer ids, so the plan binds
    every imported vector's paints to the token its own shape names (§6).
- **Provenance.** Every raw tree carries the commit, the working tree's dirty
  source paths, Next's mode and version, the Chromium version that read it,
  the page's build id, the viewport, the time, and its inputs (`inputs.mjs`):
  content digests, as the working tree holds them, of the page's source (the
  route, the bento lab components, the root layout and global styles, the
  Next, PostCSS and TypeScript configs, the lockfile) and of the measure's own
  code. The digests are taken before a route's first read and after its last,
  and the page's clock origin before and after: a route whose inputs changed
  in between, or whose page loaded again (a fast refresh), is read once more,
  and stamped unsound if it changes again. `plan` recomputes the inputs and
  refuses a tree whose inputs differ or are missing, and a tree not read whole
  (a moved box, a print that did not settle, a scroller off its start, a
  DevTools read that missed or failed: `faultsOf`), unless `--allow-stale`
  says the caller knows. It refuses whatever the caller allows an unsound
  tree (`whyUnsound`), and trees from more than one build or browser
  (`mixesOf`).

### 3.2 Plan

`node scripts/design/figma-print/plan/index.mts [--routes=/lab/bento/wireframes] [--allow-stale] [--allow-drift]`

- **The library.** Tokens become variables (§6), the measured type becomes
  text styles and the shadow tokens effect styles, shared by every route so
  one token is one variable or style everywhere.
- **Route plans.** Every node carries a stable key built from the route, the
  viewport, the print, the kit part and its ordinal, never a DOM path. A key
  is a path: a node's key is its parent's and one segment more, so a unit's
  nodes are the keys under its root's; a painting pseudo-element is the
  segment `::before` or `::after` under its element. Layout is derived by §4
  and §5. Each node keeps its measured box, which the plugin checks against.
- **Components** (§7) come from the kit table and the census of every planned
  route.
- **The report** in the bundle lists the instances per variant, the
  occurrences kept as frames with the reason, the colours printed with no
  token behind them (counted on the finished plan, a drawing's shape by shape),
  what was approximated (a tiled pattern as its mean tint), the layouts by
  mode, and the drift and sizing conflicts the Figma layout model finds (§5).
  The command prints the same summary and exits non-zero when that model finds
  any drift or conflict (F9), unless `--allow-drift`.

### 3.3 Print

The plugin lives in `plugin/`. Its TypeScript is bundled by esbuild and typed
by `@figma/plugin-typings`. `build-plugin.mjs` embeds the bundle in the
plugin's UI, gzipped and base64-encoded; the UI decodes it with
`DecompressionStream` and posts it to the main thread, so printing never needs
the network. The manifest allows the receiver's loopback origin only.

1. **Order.** Preflight (the file key first, then fonts and pages), variables,
   text styles, components, then route frames. Each unit is time-sliced so the
   editor stays responsive, and is one undo step. A slice hands the editor its
   turn through the panel, a message round trip, not a timer, so a window
   nobody looks at is not throttled to a tick a minute.
2. **Reconcile.** Each node's key is in its shared plugin data (the `pleiad`
   namespace). A rebuild updates variables, styles and components in place, so
   instances keep their links. A unit root stores its plan's hash under the
   printer, a digest of the plugin's main thread and settings as built, so a
   unit is skipped while neither its plan nor the printer changed. Every node
   is built in its page's draft, a keyed frame out past the page's content,
   and leaves it for its parent once built; a print that stops leaves its
   half-built nodes only in the draft, which the next print removes. Keyed
   nodes no plan names are pruned when the plan is complete. A node without a
   key belongs to a person and is never touched; a copy a person makes of a
   keyed node is released to them, every entry cleared.
3. **Overrides** apply in list order by main-component key. A swap puts a
   nested instance on another variant and clears that layer's overrides; the
   overrides after it are relative to the variant it now shows.
4. **Self-check.** After a unit is printed, the plugin compares every keyed
   node's `absoluteBoundingBox` with its measured box. A node that misses by
   more than the tolerance (§9) is fixed in the order the plan allows: its own
   lengths first, deepest node first, then an auto layout parent whose
   children still miss becomes a frame with its children at their measured
   offsets. A main component keeps its sizing modes and layout; its misses are
   read against the layout model (§5) run on the sizes Figma gave its leaves,
   so a miss Figma's text metrics make is a fallback and a miss off the model
   is an error. Absolute layers get their constraints once their unit has
   settled. Each fallback is reported with its key.
5. **Report.** The report (the printer's stamp, keys, boxes, fallbacks,
   missing fonts, throws) shows in the plugin's panel and goes to the receiver
   with a PNG of each route frame when the receiver is reachable; each step
   goes there too as it starts (`progress.json`). A receiver that is not
   reachable never fails a print.

### 3.4 Check

`check.mts` reads the bundle and the newest report and writes the result of
each line of §9 with its evidence, next to the report it judged.

## 4. Direction in Figma

The page is left to right; the planner reads each element's computed
direction, so the same rules print a right-to-left island.

| CSS | Figma |
| --- | --- |
| A flex row | HORIZONTAL auto layout, its in-flow children in physical order; `itemReverseZIndex` on where that order reverses the DOM and two children's ink can meet, so the DOM-last child still paints on top |
| `justify-content` start · end · center · space-between, in a left-to-right box | `primaryAxisAlignItems` MIN · MAX · CENTER · SPACE_BETWEEN; mirrored in a right-to-left box |
| A flex column | VERTICAL auto layout; stretch makes the children FILL |
| A wrapping row | One HORIZONTAL frame per measured line, in a VERTICAL stack |
| A grid | GRID with manual placement, its tracks in physical order; a column line declared in a right-to-left grid counts from the right |
| `text-align: start` | `textAlignHorizontal` LEFT; in a right-to-left box RIGHT, with a right-to-left mark before a paragraph that opens with no right-to-left letter |
| An absolute child | `layoutPositioning` ABSOLUTE at its measured offset, constrained to each side its inset is declared on (§3.1) |

## 5. Layout derivation

The planner writes auto layout only where auto layout reproduces the measured
boxes. For each container it solves the Figma layout it would write against
the measured child boxes; when every child lands within the fit (0.75 px), the
container is written as that auto layout, and otherwise as a frame with its
children at their measured offsets, counted in the report by reason.

The finished plan is then laid out again by a model of Figma's layout
(`plan/figma-layout.mts`): auto layout, grids, hugging, filling and hidden
layers as Figma resolves them, for every route frame and main component. A
node the model puts more than the tolerance from its measured box is drift; a
sizing Figma cannot hold as written is a conflict. F9 requires none.

- **Margin boxes.** Items are solved on their margin boxes. A positive margin
  is padding in a frame the margin box wide; a negative one, or an offset, is
  a frame holding the item's place with the item at its own box inside it.
- **Flex lines.** Order, padding, gap and alignment are solved per line, and a
  wrapping row's lines are found from its items' margin boxes. Growing items
  fill only when they measured equal, as Figma shares free space equally. An
  item with an `auto` margin is a frame that fills its share and holds the
  item at the side away from the margin. An item whose own `align-self` puts
  it elsewhere sits in a wrapper as tall as the line. `align-items: baseline`
  on a row is BASELINE.
- **Grids.** Tracks come from the computed track list, moved by
  `justify-content` and `align-content`; the space they leave before and after
  them is padding. An `auto-fit` track left empty collapses with its gutter. A
  subgrid that paints, pads and moves nothing folds into its grid. A track is
  FLEX where its items stretch across a definite width, HUG where its largest
  item sizes it, and FIXED otherwise. Items that share cells are one stack, as
  Figma's grid puts no two children in a cell. An item at a place no cell
  alignment gives keeps it in a frame that fills its cell, and the report
  counts it.
- **Block stacks.** Evenly spaced in-flow children are a VERTICAL auto layout
  with that gap; unevenly spaced ones are spaced by their collapsed margins as
  padding. The margins of the first and last child become the stack's
  padding.
- **Inline content.** An element whose content is text and inline elements is
  one text layer with styled runs; an inline element that paints is a box
  behind the text. Contiguous text runs in a flex or grid container are one
  anonymous item, which takes its parent's text properties and none of its box
  properties. A run takes at least its block's line height, as CSS holds every
  line box that tall.
- **Text boxes.** A text sits on its line box (§3.1). A single line that its
  box shrinks to hugs its width; a wider box keeps its width and its alignment
  holds the edge; a wrapping text has its measured width and grows in height.
- **Strokes.** A border takes layout space, as CSS lays it out
  (`strokesIncludedInLayout`).
- **Sizing Figma can hold.** An axis an auto layout hugs needs a child that
  does not fill it; a child that would only fill a hugging axis keeps its
  measured size on it.
- **Leaf sizes.** A text, a drawing and an instance are leaves, whose size is
  given: before printing the measured box, after a main prints the box Figma
  gave it, which is where the self-check reads the main (§3.3).

## 6. Prints and tokens

The prints are a table (`prints-table.mts`). Each row names a print, the
collection it binds and its block on the site page; the first row is the
primary print. The table here holds one print, `wire`, bound to the collection
`Wireframe`; a second table, `twin` (a design print and its wire twin, as
Taruu prints them), is what the twin path's tests run against
(`FIGMA_PRINT_TABLE=twin`). With one print there are no twins: no twin
collection, no alias, no print axis on any component, and the purity line
(F8) has no other print to cross into.

- **Variables.** The custom properties declared on the page root are the
  primary print's collection, one mode, named after their custom properties
  with the WEB code syntax `var(--wf-…)`. A twin print's collection holds a
  variable per token it binds, aliasing the primary one where the prints
  agree. Primitives no print binds directly and every print resolves alike go
  in a collection of their own, which is left out when it is empty.
- **Binding.** A measured value binds to the first custom property in its
  authored chain whose value equals the value measured on the element, in the
  print that renders it; a value the code wrote as a literal stays a literal
  and is counted in the report. A colour the code mixed with transparency
  binds its token with the mix's share as its opacity.
- **Drawings.** An SVG shape is an element like any other: the protocol reads
  its fill and stroke chains, the plan lists each layer id with the variables
  its paints bind, and the plugin binds each imported vector by its layer
  name, then names the layer for its kit part. A paint no layer binds falls
  back to the drawing's own `color` chain, as a drawing painted in
  `currentColor` authors it.
- **Gradients.** A gradient stop binds as any colour does, through the
  background's authored chains. A tiled pattern Figma cannot repeat prints as
  its mean tint, a measured value the report lists as approximated.
- **Kit literals.** The kit's stylesheet names every colour through a `--wf-*`
  token, so nothing the kit draws prints as a raw value.

## 7. Components

The kit is the component library: one component or component set per kit
row that the measured route prints, named as the kit names it, in dependency
order so a main may hold instances of the rows before it.

- **The kit table.** `kit.mts` names, per component, the kit export that
  renders it, the CSS-module class of its root (`wireframe.pill`), its group
  and the axes its variants differ on. An axis reads a `data-*` or `aria-*`
  attribute of the root, the first of a set of classes on the root, the first
  of a set of parts under it, or a drawing's shape. Kit modules are a registry
  (module id → stylesheet path); every part names its module, and `checkKit`
  proves every export, file and class against its own module's source, so a
  renamed class or export fails the plan.
- **Identity.** A measured element is an occurrence of the first row whose
  root is among its CSS-module classes, the class spelled by a grammar of §2.
  No two rows share a root class; where one row's root composes another's
  (`.field` composes `.box`), the composing row comes first.
- **Variants** are the axis values the census sees. A data attribute present
  with no value is `true`. The viewport is an axis only for a component whose
  viewports draw one variant differently, and the print only where the table
  holds more than one print.
- **The main component** of a variant is the shape most of its occurrences
  share. A shape is what an instance cannot override: structure, layout,
  stacking, sizing modes, every fixed size inside the root, and every position
  auto layout does not derive. It leaves out the root's own size and position,
  text characters, paint colours, strokes, effects, and which variant a nested
  instance shows.
- **Variants derived from shape.** Where one set of axis values prints more
  than one shape, each shape is a variant of its own, under a property the
  census derives for the whole component: the part whose presence tells the
  shapes apart, or else `form`, valued by a shape's signature. A set keeps its
  most printed shapes and a component its derived variants within
  `CONFIG.figma.census`; an occurrence past those bounds prints as a frame
  named for its part. The report lists each derived property and each frame,
  so the kit can name the axis the shapes stand for.
- **Instances** carry what differs from their main as overrides: characters,
  fills, strokes, effects, visibility, opacity, an imported drawing's colours,
  and a swap of a nested instance's variant. A text whose characters vary is a
  TEXT property. None is detached.
- **Containers** (`Storyboard frame`) hold their surface and padding around a
  slot; each instance's slot holds that occurrence's own content and layout.
- **Modules outside the kit** print as frames of instances and layers.

## 8. The file

| Page | Holds |
| --- | --- |
| Design system | the variables' swatches, the text styles' specimens, and the components, one Section per kit group |
| Wireframes | one block per print (`Wireframes` here), each a Section per route group holding the route's frames |

The plugin checks the open file's key against `CONFIG.figma.fileKey` before
it touches anything. Pages are found by key. On the first run it adopts, per
role, the one page whose name is the role's name or one of its `adopt` names
in `CONFIG.figma.pages` and that no role has claimed; two pages of one name,
or a page two roles name, stop the print before any change. A role with no
page gets a new one only while the file has room under `CONFIG.figma.pageLimit`.
Every unit takes its place as it prints, so a print that stops leaves both
pages in order. Unkeyed top-level frames are listed in the panel with one
button that removes them.

## 9. Acceptance

The tolerance is 1 px.

| # | Check |
| --- | --- |
| F1 | Every plan key is printed exactly once, and the report names no key the plan does not |
| F2 | Every figure part (`CONFIG.figma.boxed`: a template's sheet and legend, a storyboard) and every instance lies within the tolerance of its measured box, relative to its route frame |
| F3 | Every text node has its measured line count and width; a single line Figma's metrics set wider keeps the edge that holds its box (§3.3) |
| F4 | No paint is raw unless the plan measured its colour, and every text node carries its text style |
| F5 | The instances per variant equal the census less the reported frames, and none is detached |
| F6 | Every row reads left to right in plan order, and every grid child sits in its cell |
| F7 | Printing unchanged plans with an unchanged printer changes nothing |
| F8 | Each print is pure: a frame or main binds its own print's collection only and holds no layer only another print renders; its instances show its own print's variants |
| F9 | Before printing, the Figma layout model (§5) finds no drift and no sizing conflict |

## 10. Setup

With the dev server up (`npx next dev -p 3100`), `npm run figma:build`
writes the plugin and its manifest (`plugin/dist/`, `plugin/manifest.json`,
both build output). Once, in Figma desktop: Plugins, Development, Import
plugin from manifest, `scripts/design/figma-print/plugin/manifest.json`. Then
open the file and run "Pleiad print" from Plugins, Development. It prints the
plan it carries and reports; each later build replaces the plan it carries.


| Command | Does |
| --- | --- |
| `npm run figma:build` | measures the route at `CONFIG.base`, plans, and rebuilds the plugin with the new bundle |
| `npm run figma:receive` | collects the plugin's reports and PNGs on loopback |
| `npm run figma:check` | judges the newest report against the bundle |
| `npm run figma:test` | the pipeline's tests: the one-print table, then every suite under the twin table |

## 11. Second opinion

| Reviewer | Scope | Date | Outcome |
| --- | --- | --- | --- |
| Codex CLI (gpt-6-astra, read-only) | The port's shape: one print against twin collections, dev-server provenance, class grammars and kit identity, SVG portability and token binding, page adoption, the root contract | 2026-11-04 | Incorporated |
