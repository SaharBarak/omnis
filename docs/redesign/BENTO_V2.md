# Bento v2: the scrolled site

Bento v2 is the production composition of the Pleiad site: the home and
Draw your map at the root (`src/app/(home)`) and the signed-in app at `/app`,
beside the bento site's pages it links to for everything it does not build
(`src/app/(marketing)`, BENTO_SITE.md); V2_PROMOTION.md records how the tree
took the root. It takes the grammar
of the Zeus "bento-v2" landing (reference copied verbatim to
`design/zeus-rebrand-live/`; serve that folder and open
`live/landing/index.html` and `live/portals/index.html`) and speaks it in
Pleiad's own palette, mark, type and engine. Unlike v1, its motion is driven
by scroll. That is a deliberate decision for this tree (2026-11-05); v1 keeps
the BENTO_MOTION law unchanged.

## Problem class

A product site whose sections are bento frames: one viewport-high grid per
section, a large art panel with cut-in corners, a side column of tiles, and
scenes tied to the reader's scroll. The population is the v2 home (five
frames), the v2 signed-in dashboard, and every later v2 page, all built from
one kit so a new page needs only data and a grid.

The kit's three moving parts are reusable concerns, not page code:

| Concern | Owner | Reused by |
|---|---|---|
| Cut-in corners | `Notch` (v1 kit, `notch.tsx`) | every v2 frame, the dashboard greeting |
| Pixel mark | `PixelMark` (v2) on `useCanvasLoop` (v1) | hero, close, dashboard, any frame's art |
| Scroll scenes | `ScrollEngine` + `useScrollScene` (v2) | every v2 section |

## Reference grammar, mapped

| Zeus | Pleiad v2 | Source of the value |
|---|---|---|
| Plum ground, card, soft, line | `--lab-page`, `--lab-surface`, `--lab-chip`, `--lab-line` | lantern palette (BENTO_COLOR.md) |
| Lavender second headline line | `--lab-bright` | lantern palette |
| Lime accent tile, plum ink | `--action` fill, `--on-action` ink (gold on night; night on paper in light) | lantern palette action roles |
| Pixel Z mark, assembled from squares | The Lantern rasterised from `lanternShape()` | `src/lib/brand/mark.ts` |
| Nav and title cut into the hero panel | `Notch corner="tr"` / `"bl"` | v1 kit |
| Montserrat display | Space Grotesk (`--font-display`) at the poster and display roles | BENTO_TYPE.md roles |
| Mono eyebrows | Sans caps at `--type-caps-ls` | the de-mono'd type law |
| Live findings feed | Today across the calendars | `getTodayAcrossSystems` |
| Giant accent numeral (24/7, 3, 10x) | Today's kin; measured tie shares | `buildBentoLab`, `buildPairAtlas` |
| Embedded portal dashboard | Maya's map in a window frame (atlas + digest + ties) | `buildPersonAtlas`, v1 drawings |
| Film with chapter chips | The atlas drawing with layer chips (focus per layer) | `PersonAtlasDrawing` `focus` |
| Compare table with toggle | Pleiad against a sun-sign horoscope / a compatibility score | authored rows, honest and generic |
| Close: question + reassembled mark + link columns | Same, links read from `SITE_ROUTES` groups | `src/lib/site/routes.ts` |

Every number on the page is computed by the engine or counted from a data
table. Nothing is a marketing figure.

## Light and dark

The home is read as a run of sections, not one block. Three rules carry it,
each from practice: a section answers one question; the space between
sections is larger than any space inside one; and a strong ground stays
strong only while it is rare.

- **Turns.** Every section sits on the page's own ground except at most
  two (`V2_INVERSE_MAX`), which turn to an inverse plate (BENTO_COLOR.md
  "Inverse sections"): in the dark theme a paper plate, in the light theme a
  night one. The run turns once: the argument before the close. The product
  itself, after the hero, stands on the page's ground, so in the dark theme,
  the default, Maya's map is read in the dark. A plate is the other theme's
  palette whole, so its ink, accent, action, layers, glyphs and mark follow
  it and pass the same gates. The hero and the close sit on the page and
  bracket the run; sections on the page are told apart by the section gap
  and their own frames.
- **What ties them.** Every section keeps the frame grammar (notched title,
  display type, the gold action, the starfield on its stage); a plate's
  corner is concentric with the panels in it; the page's ground shows
  between every pair of sections.
- **Movement.** A plate opens as it arrives: it scales from 0.92 to full
  from its top edge as its top crosses the lower three quarters of the
  viewport (Scenes, "Plate in"), so the page reads as grounds sliding over
  one another, not a list of boxes.

`V2_SECTIONS` (`src/lib/design/v2-chapters.ts`) is the table, and the page
renders its frames in the table's order (`V2_RUN`; the last, `V2_FOOTER`,
follows the main landmark). A test holds that the run opens and closes on
the page, ends on the footer, turns at least once and at most
`V2_INVERSE_MAX` times, and never sets two turns side by side.

| Section | Ground | The one question it answers | Its focus |
|---|---|---|---|
| Hero | page | What is Pleiad? | the mark and the headline |
| The map | page | What does a map look like? | Maya's map in its window |
| How | page | How is a map drawn? | the turning map and its layer chips |
| Two people | page | What do two maps share? | the pair drawing |
| A circle | page | Who holds a group together? | the circle drawing |
| Why | inverse | Why weigh ties by rarity? | the comparison table |
| Close | page | Where do I start? | the question and the action |

- **One focus per frame.** The focus takes the frame's largest area; beside
  it, at most an eyebrow, a title, one sentence, one supporting list or
  tile, and the action. Words sit on the section's ground itself; only a
  figure gets a stage and only the accent gets a tile. Anything that
  repeats another frame's figure is left to that frame.

## Pixel mark

`rasterLantern(cell)` (pure, `src/lib/brand/pixel-mark.ts`) turns the mark's
paths into lit cells `{ col, row, part }`:

- **Cell size.** One cell is the drawing's thinnest band, the hanger ring
  (`ring[0] − ring[1]` = 1 unit), so every part survives rasterising. The
  20 × 40 unit mark becomes a 20 × 40 grid.
- **Coverage.** A cell is lit when at least half of its area is ink, sampled
  on a 4 × 4 sub-grid with the path's own nonzero rule. Holes stay holes.
- **Part.** Each sample counts once, for the first part in `MARK_PARTS`
  order that holds it (the parts never overlap; the order only makes ties
  deterministic). A lit cell takes the part holding the most samples, ties
  to the earlier part, so the gold window, the frame and the base keep their
  colours (`--mark-*`).
- **One predicate.** The paths are flattened by `src/lib/geometry/svg-path.ts`
  (M, L, A, Z; arcs by the SVG endpoint-to-centre conversion) and tested with
  the nonzero winding rule. Tests and the browser run the same code, so there
  is no `Path2D` parity to keep. Tests hold the topology: the ring hole stays
  open, the window never touches the frame, the grid is mirror-symmetric.

`PixelMark` draws the cells. It renders the cells as an SVG of squares on the
server, so the mark is complete before any script, and swaps in a canvas on
`useCanvasLoop` (at 60 fps, memoised so a frame with no change paints
nothing) once the engines are ready and motion is allowed. Its input is a
handle, never React state:

- **Channels.** `assemble` is the mark's own intro share (time since mount,
  over `V2_MOTION.introMs`) times its named channels (`MarkChannel`), each
  owned by one writer: the hero's and the close's `scroll` scrub, the hero's
  `stage` ("The stage"). Two scenes never race for one value; scrolling
  during the intro simply multiplies in.
- **Two kinds of write.** `set` follows a motion (a scrub writes every
  value on the way). `to(channel, value, ms)` states where the mark is, and
  the mark eases there itself on its own frames, from wherever the channel
  stands, so a writer that changes its mind mid-way never jumps it.
- **Rest.** Clearing a channel sets it to 1, and a scene clears its channel
  when it reverts. While motion is off the mark ignores what was `set` (a
  motion it does not play) and stands at what was stated with `to`, at
  once: whole on a paused page, absent while its room is given away.
- **Intro.** A mark that assembles on mount (`intro`) keeps the server's
  whole SVG only for readers without scripts or with reduced motion
  (`@media (scripting: enabled) and (prefers-reduced-motion:
  no-preference)` hides it), so the assembly never takes apart a mark
  already seen.
- **One paint rule.** The server's SVG and the canvas paint a resting cell
  alike: `SQUARE` of its pitch, at `restAlpha(shade, cover)`.
- Each cell carries a seeded scatter vector and a delay (hash of its index),
  so the same cell always flies the same way. At 1 every cell is home; at 0
  cells are scattered, shrunk and faded. Per-cell progress staggers by delay
  and eases with the emphasized curve.
- Dust: dim squares on the same grid around the mark, read from
  `--lab-line`, the reference's scatter field.
- Glints: at rest, a few window cells brighten on a slow cycle while the
  section is in view and motion is allowed.
- Colours: `readMarkPalette(root)` reads `--mark-frame`, `--mark-window`,
  `--mark-base` and `--lab-line` beside the v1 `LabPalette`, re-read on theme
  change through the same `watchLabRoot`.
- The canvas and the SVG are `aria-hidden`; the brand name is in the text.

## Motion engines (v2 only)

| Engine | Owns | Wrapper |
|---|---|---|
| Lenis 1.3 | Smooth wheel scrolling for the v2 home | `ScrollEngine` provider in the home page |
| GSAP 3.15.0 + ScrollTrigger | Scenes: scrubbed values and once-on-enter timelines | `useScrollScene(build)`, which returns the section's ref |
| Motion (`framer-motion`) | Responses: chip highlight (`layoutId`), presence, rolling values | `m.*`, v1 `Rolling` |
| anime.js / CSS | The v1 atlas drawings embedded in v2 frames keep their own CSS entrance. The pair and circle drawings come in bare: their anime.js sequences belong to the v1 scenes, and v2 draws their lines with GSAP through the drawings' own hooks (`data-tie-line`, `data-edge-line`, `pathLength` 1) | v1 hooks, untouched; `drawLines` for v2 |

Rules:

- **Loaded after paint.** `ScrollEngine` (client, in the home page; nothing on the dashboard scrubs) imports
  `gsap`, `gsap/ScrollTrigger` and `lenis` with `import()` after hydration
  and publishes them through context. An import that resolves after unmount
  does nothing; a failed import leaves the page at rest.
- **Lenis owns the document scroller, for the home's lifetime.** It runs
  on GSAP's ticker (`autoRaf: false`, `lenis.on('scroll',
  ScrollTrigger.update)`, `lagSmoothing(0)`), so scroll, scrub and paint share
  one frame. `anchors: true` keeps in-page links; `prevent` lets popovers and
  anything marked `data-lenis-prevent` scroll natively (every inner scroller on the home carries it, as the map window's digest does). Leaving the home
  removes the ticker callback, restores lag smoothing and destroys Lenis;
  keyboard, find-in-page and history scrolling stay native throughout.
- **Motion allowed is one signal.** The engines run only while the lab says
  motion is allowed (`useMotionAllowed`: no reduced-motion preference and the
  motion toggle not paused). The v1 `MotionToggle` sits beside the theme
  toggle in the hero nav and the dashboard rail. When motion turns off,
  every scene reverts, the pixel marks draw whole and Lenis stops, so the
  page shows its final frame with native scrolling.
- **Rest is the final frame.** The stylesheet draws every element at its
  final, readable state.
- **Arming never hides what was seen.** A once-on-enter entrance arms only if
  its trigger start is still below the viewport when the engines arrive;
  otherwise it keeps its final frame. Entrances play once; none re-hides on
  the way back up.
- **One scope per section.** `useScrollScene(build)` returns the section's ref and runs the build
  inside `gsap.context()` scoped to the section and `gsap.matchMedia()` with
  the conditions `desktop` (`min-width: 900px`) and `compact`
  (`max-width: 899.98px`), so every width builds. Scrubbed parts run on
  desktop; once-on-enter parts run at every width. The scope reverts on
  unmount, on condition change and when motion stops.
- **One refresh coordinator.** `ScrollEngine` batches `lenis.resize()` and
  `ScrollTrigger.refresh()` into one frame after `document.fonts.ready`, after
  `load`, and when the body's size changes (ResizeObserver), never per
  scrub frame, and cancels pending work on unmount.
- **Values as data.** Every scene's trigger window and smoothing is a row in
  `V2_SCENES` (`src/lib/design/v2-scenes.ts`), never inline.
- **Unitless scrubbed values.** Scrubs write transforms, opacity, a canvas
  channel or a custom property; never layout.
- **Two engines never write one property of one element.**
- **Bundle isolation.** GSAP and Lenis join the client-bundle test's HEAVY
  set and its roots gain the v2 trees, so a static import anywhere in v2 or v1
  fails; server data builders stay out of client modules the same way.

The v1 motion-policy test keeps scanning v1 only, and its dependency check
becomes "GSAP is imported only inside the v2 roots".

## Accessibility

- Scrubbed elements never fall below 35 % opacity, and every scrub is a
  function of position, so focusing an element scrolls it into the window
  where it is whole.
- The layer chips' auto-advance stops for good on hover, focus or any press,
  and never runs without motion. Chips are buttons with `aria-pressed`; the
  drawing's text equivalents (digest, readout) stay in the page.
- Each ties panel keeps one live region from its first render, which
  announces reading, drawn and failed in turn; the visible status lines are
  not live, so nothing is read twice.
- Notches are positioned, so every frame reserves their space with padding
  derived from the same radius tokens; below 900 px a notch's content returns
  to the flow. The lab is set left to right; a right-to-left composition
  would mirror the corner table.

## Scenes

| Scene | Trigger window | Writes |
|---|---|---|
| Hero intro | on load, 2.2 s | mark 0 → 1; title lines, pills and side tiles rise (stagger) |
| Hero out | section top at top → bottom at top, scrub | mark 1 → 0; side column up 18 % and to 35 % opacity; title down 25 % and out |
| Tiles in | section top at 80 %, once | every `[data-tile]`, and every item of a list wrapped in `[data-tiles]`, rises 40 px with expo-out, 50 ms stagger; numerals count up |
| Proofs in | section top at 85 %, once | the proof and the table rise 60 px, stagger 80 ms; the proof's numeral counts up |
| Plate in | plate top at bottom → top at 25 %, scrub, desktop | an inverse plate scales 0.92 → 1 from its top edge |
| Lines in | section top at 70 %, once | a drawing's tie lines draw rarest first, one dash each (`drawLines`), at the bento kit's draw duration and stagger; ends and labels appear as each lands |
| Close in | section top at bottom → top at 15 %, scrub | mark 0 → 1 |
| Close line | section top at 60 % → bottom at bottom, scrub | footer rule draws (`--line` 0 → 1) |

## Home (`/`)

Seven frames, sized and stacked by the layout rules below, fitted at
1440 × 860 and 1280 × 720, stacked below 900 px.

1. **Hero.** Art panel in two rows: the pixel Lantern's room, then the
   title's bottom-left notch in flow at its foot, so the Lantern sits at the
   centre of whatever room the title leaves, below the band the top notches
   take (`--v2-notch`, one row of controls in a notch's padding); its dust
   still covers the panel. Brand chip; nav pills in the top-right notch;
   eyebrow, two-line title ("Map every person." / "See every tie.") and the
   primary action in the bottom-left notch. Side
   column, today: the kin tile (below), and under it the day across the
   calendars as fitted day rows, the rows the engine draws a figure for.
2. **The map** (`#map`, page). A band ("Layout rules") on the page's own
   ground. Main: a window frame holding Maya's
   map (the v1 drawing and digest). Side, beside it: eyebrow, title, one
   sentence, and at its foot the four counts read from data (systems in the
   digest, days in the count, gates on the wheel, chart systems in the
   catalog) as a two-by-two of numerals that count up.
3. **Two people** (`#pair`, page). A band. Stage: the frame's title in the top-left
   notch over the bento kit's live pair stage (`PairStage`: two maps side
   by side, a line for every tie rare enough to draw, landscape above
   720 px and portrait below; every mark and tie answers with a card, and
   each drawn tie carries a current once its line has drawn in;
   BENTO_SITE.md, "Ties explain themselves"). Side, on the plate: the pair
   and its rarity, one sentence on which ties get a line, the rarest ties
   weighed in bits with their odds, each row one control with its tie on
   the drawing, and "Map two people".
4. **A circle** (`#circle`, page). A band. Stage: the title notched over the bento
   kit's circle drawing (`CircleDrawing`: the person whose ties carry the
   most at the hub, a labelled line for every pair with a rare tie). Side,
   first column on desktop and after the stage when stacked: who holds the
   circle together, its heaviest pairs (`CirclePairs`) and "Map a circle".
5. **Why** (`#why`, inverse). Main: Pleiad against a sun-sign horoscope or
   a compatibility score, with a toggle and a note on the other option.
   Side: the accent proof, the guide tie's measured share as one numeral,
   set against the commonest tie's share (counted, never drawn). The accent
   follows its plate's scheme: gold ground in the dark plate, night ground
   with a gold numeral in the paper one.
6. **Close** (`#start`). "What ties / you two?", the primary action, the mark
   reassembling; side panel with link columns from the route table; footer
   rule drawn on scroll, lockup, back to top.

## Day rows and kin tile

Views that say what a value is rather than list it, shared by the home
and the dashboard (`src/components/bento-v2`).

- **Day rows** (`DayRows`, rows from `dayRows` in `src/lib/site/v2-day.ts`).
  A ruled list: no row is a box inside the panel's box. Each row is a figure
  in one square slot (`--v2-figure`, the same for every row, so every row's
  words start on one edge), then its calendar's name in capitals, then the
  value and what it is on one line ("16° Scorpio", "1% lit · New Moon"). The
  figures are the bento board's drawings of their values (`todayFigures`:
  the Moon's lit disc, the Sun's sign, the gate's hexagram, the month in
  Hebrew script, the Chinese year's elements); the Long Count's is its kin
  place as one bar-and-dot numeral, and the value keeps all five places.
- **Cycle tracks.** A row's rule is its value's place in its cycle
  (`DayFace.cycle`, `{ at, of, unit }`, computed with the figure): ink from the
  cycle's start to the day, ending in a dot for the day. The Moon's month by
  its elongation, the Sun's and the sidereal Sun's sign by the degree, the
  gate by its line, the Hebrew month by the day of its 29 or 30, the Long
  Count's winal by the kin place of 20, the Chinese year by its place in the
  sixty-year cycle. Every track starts on the words' edge and has the same
  length, so the dots stand as one column: where each calendar is today. A
  row without a cycle has a plain rule. The track draws once with the
  page's first paint, from the inline start; the dot is a status pulse
  ("Loops" in BENTO_MOTION.md), every row's beating together. The track is
  drawn for the eye; the row carries its place for assistive tech, in the
  cycle's unit ("day 28 of 30", "line 4 of 6"). Stacked, a row's meaning
  wraps under its value instead of being cut.
- **Fitted rows** (`fit`). In a column that must not grow, the rows take the
  panel's room without sizing it (`contain: size`), lay out as many whole rows
  as fit (`repeat(auto-fit, minmax(row, 1fr))`) and share what is left; the
  rows past the last that fits flow into zero-width columns past the inline
  end, which the box clips. No row count is written anywhere: the count
  follows the panel's room, the same in Chromium, WebKit and Firefox.
  Stacked, every row shows. Each row sits in a slot that is a size
  container, and the list item inside it hides when its slot has no width
  (`visibility: hidden` under `@container (inline-size: 0)`): focus and
  assistive technology meet the rows the eye does, the list counts only the
  items shown, and the kin tile's arrow leads to the full list. The list is
  `role="list"` over `role="listitem"`, which `list-style: none` would drop in
  Safari on `ul` and `li`.
- **Rows open their calendar's board.** Every day row is a button that
  opens its calendar's board: the system's own calendar for the day, drawn
  in its symbols and set in the kin tile's type (`DayBoardBody`), in the
  card the digest's facts open (BENTO_SITE.md, "Facts explain
  themselves"). One card per list, fed by the same inspect reducer
  (`createInspect`, keyed by the row's field) through the same wiring
  (`factTarget`, as a disclosure): hover previews it after the hover grace
  (where the list's caller has a stage, hover draws the calendar there and
  opens no card: "The stage"), focus owns it, a press keeps it, Escape and
  a press outside close it. New
  rows, or a new `closeKey` from the list's caller, close it: the hero
  passes one that changes as its scrub leaves rest, since a board hung from
  where its row stood would drift from a row the scrub moves. It hangs from
  the open row toward the inline start, takes the room beside it with its
  own fallbacks (BENTO_SITE.md, "Facts explain themselves") and docks under
  720 px. The board is plain data the engine writes for the day
  (`todayBoards`, `src/lib/today-boards.ts`, server only, one per filled
  row), carried by the row (`V2DayRow.board`), both of its calendar's views
  included, so nothing loads on hover or on a change of view. Its parts,
  top to bottom, set apart by rules as the day rows are, never boxed, in
  the board's voice (BENTO_TYPE.md, "The board"):
  - **Mast.** As the kin tile sets a kin: the calendar's name in capitals
    over everything, the row's figure drawn as tall as the numeral (where
    the row draws none, the value's own mark: the Moon that noon for a
    lunar month or a tithi, the month's sign for the Persian), the
    day's number in the calendar as the numeral (in the calendar's own
    numerals where it has them: כ״ח, ٢٨, ۱۷, 丙午), and beside it the
    value's name as a title over a line of words, each word led by its
    glyph where it has one (the sign's glyph before its name, the ruler's
    before the ruler). Under it what the tradition reads into the value.
  - **Calendar.** The unit the day stands in, drawn as the calendar draws
    it. Every cell carries its symbol (the Moon's face that noon, the day
    sign, the line, the tithi's Moon), its numeral in the calendar's script
    and the civil date it falls on; what happens on a day (a quarter, a
    holiday, a sign or month begun) is marked on its cell, and a cell may
    carry several. Days gone are dimmed, today is ringed with the status
    pulse and is the current date to assistive technology. Heads name the
    columns (the weekdays from the calendar's own first weekday, Intl's
    `weekInfo`); bands group cells (a decan under its ruler, a paksha) and
    a legend names every mark and band the view uses. Under the grid a
    readout says the cell under the pointer or focus in full ("Tue 17 Nov ·
    First Quarter · 51% lit · Moon in Aquarius"), today's at rest: the
    calendar explains itself. A cell's words are its accessible name; the
    readout repeats them for the eye only. A ring's readout stands in the
    ring, in the square its circle holds; the readout, the legend and the
    part's head wrap to the calendar's width and never widen it.
  - **Overview.** One labelled control switches the calendar between the
    unit and the larger view it turns in ("Show the year", "Show the
    sixty"); the board grows in place, its mast stays, and the control
    keeps focus. Both views are drawn from the same cells' rules.
  - **Next** and **Facts** stand beside the calendar where both fit at
    their widths, one over the other, and under it where not, so a board
    stays within the window's height where it can.
  - **Next.** What comes next, nearest first, each led by its mark: its
    name, its date (`<time>`, "Tue 17 Nov", with its year where it falls
    past the day's year) and the days to it ("tomorrow", "in 8 days").
  - **Facts.** Label and value, the value led by its glyph where it has
    one, as the card's facts.

  | Row | Mast numeral, title | Unit | Overview |
  |---|---|---|---|
  | Moon | Day of the lunation; the phase | The lunation's days in weeks, each the Moon's face that noon; a quarter's day marked by a dot, its numeral in the board's colour; the Moon's sign glyph on each day it enters a sign | This month and the next, every day its face |
  | Sun | Degree; the sign | The sign's season in weeks, each day the Sun's degree that noon; its three decans banded under their Chaldean rulers' glyphs | The twelve signs on a ring, each with the day the Sun enters it in the year ahead |
  | Sidereal Sun | As the Sun, under the ayanamsa | The sidereal sign's season | The twelve sidereal signs on a ring |
  | Human Design gate | Gate.line; the gate's name | The gate's six lines, top line first as the hexagram is drawn: each its yin or yang line, its name and the day the Sun reaches it | The sixty-four gates in rows of eight in wheel order, each its hexagram drawn over its number, the Sun's ringed |
  | Hebrew date | The day in Hebrew numerals; month and year | The month in weeks from Sunday, each day the Moon's face that noon, its Hebrew numeral and civil date, the weekend Israel keeps marked, holidays on their days | The year's months: each named in Hebrew and English, its length, its first day and its holidays |
  | Hijri date | The day in Arabic-Indic numerals; month and year | The month in weeks from the calendar's first weekday, each day the Moon's face that noon, its numeral and civil date | The year's months |
  | Persian date | The day in Persian numerals; month and year | The month in weeks from Saturday, each day its numeral and civil date | The year's months, each under its sign's glyph |
  | Long Count | The count; the day's Tzolk'in and Haab | The winal's twenty days, each its day sign's glyph (the kin place names the day sign: 0 is Ajaw), its Tzolk'in number and civil date | The places as a column of bar-and-dot numerals, baktun on top, each with its span and, above the kin, the day it next turns (today where it just has) |
  | Chinese year | The year's stem and branch; its name | This lunar month and the next in their decades of ten days, each day its Moon at noon in Beijing, its day as written and its stem and branch, tinted by its stem's phase | The solar terms on a ring; this turn of the animals; the sixty in rows of twelve |
  | Panchang | The tithi in Devanagari numerals; the tithi | The lunar month's thirty tithis in their two pakshas, each the Moon's face at its middle, its name, and the sunrise in Ujjain it holds | This month and the next, every day its five limbs at sunrise; the nakshatras on a ring |

  What the tradition reads into a value comes from the tables the atlas
  cards read (`explain.ts`): the phase's hint, the sign's keywords, the
  gate's keywords; a calendar with none reads its own line from the catalog
  (`SYSTEM_CATALOG`). A decan's ruler is the Chaldean order of the planets
  (Saturn, Jupiter, Mars, Sun, Venus, Mercury, Moon) run on from Mars at
  Aries' first decan; a calendar's numerals are Intl's numbering systems
  (`arab`, `arabext`, `deva`) or, for Hebrew, the letters' values
  (`hebrewNumeral`, 15 and 16 written ט״ו, ט״ז); the stems and branches
  are the engine's tables. A month calendar is drawn in what its month
  follows: the Hebrew and Hijri months begin with the Moon, so each day
  carries its face; the Persian year's months, from Farvardin at the
  equinox, are the signs from Aries, so each month carries its sign. A
  gate's hexagram is drawn from its trigrams' lines, the gate's number
  being the hexagram's in the King Wen order.

  Every cell is a civil day read at its noon, UTC, as the board's other
  values are: a day belongs to the lunation, sign, gate or line its noon
  falls in, and the Moon's face and the Sun's degree are that noon's. Two
  calendars read a day where their tradition does (BENTO_BOARDS.md
  "Systems"): the Chinese calendar's days are Beijing's, and the Panchang
  reads each day at its sunrise in Ujjain. The boards' cells and searches
  share one reading of the sky per day (`skyOf`, a `memoSky`), so a noon is
  read once however many ask for it; the row values read the same
  ephemeris through the engine's services. Where the sky sets a date (an
  ingress, a gate's or line's change, a quarter of the Moon) it is the civil date of the
  instant the sky crosses the boundary, found over the engine's ephemeris
  (`sky-dates.ts`): bisection over whole days at noon UTC, then one reading
  at the midnight between two noons names the day; a run of crossings (the
  year's ingresses) is searched one span at a time, each from the last. A
  crossing is marked on the first cell whose noon is past it
  (`NoonCrossing.noon`), so a lunation holds its own new Moon on its first
  day and a season its ingress on its first; the cell's words keep the
  crossing's date where it is the day before ("Full Moon, Tue 24 Nov"). A
  date is UTC's, or the zone the calendar dates by: the Chinese calendar's
  new Moons and terms are instants (astronomy-engine) dated in Beijing
  (`chinese-calendar.ts`), by its rule (the eleventh month holds the winter
  solstice; of thirteen months from one eleventh month to the next, the
  first holding no principal term is the leap month), since Intl's chinese
  calendar can set a new Moon near Beijing's midnight on the wrong day
  (1954's, 2027's, 2030's); the Panchang's tithis, new Moons and
  Sankrantis are instants dated in India Standard Time (`panchang.ts`). Where an arithmetic calendar sets the date (a
  month's first day, a Hebrew holiday) Intl's calendars count it, read in
  UTC. A board the engine could not build is the row's own words under its
  calendar's line.

  One value has one derivation: a row's figure and its board read the same
  instant (the day's noon, UTC, or the instant its calendar reads a day
  at) through the same reader (the lunation's
  days counted at noon, `lunationOn`; the Moon's `moonReadingAt` of the
  ephemeris' elongation; the Chinese year's `chineseYearOn`; the tithi's
  `panchangDay`; the wheel's
  `wheelPlace`), and the page reads the row values (`getTodayAcrossSystems`)
  at that noon too. Each day's boards are built once and kept for the day
  and the one before it (`boardsOf`): every board is a function of the day
  alone, and the sky's readings are the costly part. A page reads a day's
  rows, figures and boards together (`daySources`), kept in Next's data
  cache across servers for the build (R2 under OpenNext, keyed by the
  build, so a deploy never reads an older shape) and built per request in
  development, where the code changes under one build.

  A board is structured content, read in order, so each row is a disclosure
  of it (`aria-expanded`, `aria-controls`) rather than a description: the
  board is a group named by the row that opens it. Hover and focus show it
  beside the row; Enter or Space keeps it and moves focus into it, so a
  keyboard can scroll a board docked at half the window. Inside, Tab and
  Shift+Tab move between the board's controls (the view switch, the
  calendar) as anywhere; past its last, Tab goes on to the next shown row
  (or past the list, closing the board), and before its first, Shift+Tab
  goes back to the row that opened it. The calendar is one tab stop, an
  ARIA grid: the arrow keys move a cell at a time and Home and End to the
  row's ends, skipping the blanks before a month's first day, and the
  readout follows focus. Escape closes the board and hands focus back to
  its row, which does not open it again. A board that closes under focus
  (new rows, a new `closeKey`) hands focus back to its row, or to the
  first shown row where that one is gone. The row's place in its cycle is
  read with its name ("16 of 30 degrees").
- **The stage** (`DayStage`, `BoardFace`). A card that opens under a
  pointer passing down a list covers the page it came from, once per row.
  Where the list's caller has a figure's room to give, the pointer's
  calendar is drawn there instead: on the home that room is the Lantern's
  (the hero's `markSpot`), so hovering a day row or the kin tile takes the
  Lantern apart and draws that calendar where it stood, and leaving puts
  the Lantern back. Hover opens no card there; focus and a press open the
  board as anywhere, so everything the stage shows is reachable without a
  pointer, and the stage itself is a figure: its calendar is `inert` and
  hidden from assistive technology.
  - **What it draws** (`BoardFace`). The board's own mast and its first
    view (the unit the day stands in), from the row's board data, by the
    board's components: one drawing of a calendar, whichever surface holds
    it. No key, tabs, inspector, Next or Facts: those are worked in, and
    the stage is looked at.
  - **Shape.** The face lays itself out to its room's shape (the stage is
    a size container, `stage`): in a room taller than wide the mast stands
    over the calendar and wraps to its width, a measure at least; in a room
    wider than tall it stands beside it, a measure at most, both centred
    on one line.
  - **Fit.** The face is laid out at the board's own type, then scaled as
    one figure to the room, as the Lantern is fitted to its spot (`useFit`:
    the lesser of the room's width and height over the face's, by
    `ResizeObserver`), and never grown past one level of the type scale
    (`LIFT_SCALE`), so calendars of different sizes keep one voice. No size
    is written for any calendar or window.
  - **Routing** (`StagePort`, `useBoardDisclosure`'s `stage`). An opener's
    pointer reports its key to the stage, and null as it leaves, in place
    of the reducer's `point`; touch reports nothing, as it previews
    nothing. Each list tells the stage while its board is open.
  - **Ownership** (`useStage`, held by the caller for every list that
    shares the room). A preview shows at once. Leaving clears it after the
    hover grace (`quick`), so the pointer passes from row to row, or onto
    the stage, without the room emptying between; while the stage holds a
    calendar it takes the pointer, and the calendar stays for as long as
    the pointer rests on it (WCAG 1.4.13). While any list's board is open,
    or the caller suspends it (the hero, once its scrub leaves rest), the
    stage is empty and takes no preview, and what it showed is forgotten:
    a stage and a board never show two calendars, and nothing returns
    unasked when the reason ends.
  - **In and out.** One exchange in one room. The Lantern gives way with
    `to('stage', 0, V2_MOTION.stageOutMs)` and returns with
    `to('stage', 1, V2_MOTION.stageInMs)`, its cells flying as they do on
    scroll; the dust stays, so the field never blanks. A face arrives
    rising `TRAVEL` from under and scaling up from `1 / LIFT_SCALE` over
    `settle`, and leaves over `quick`; passing from one row to the next,
    the leaving face goes as the arriving one comes, and the Lantern stays
    away. With motion off the exchange is a cut: the face is there, the
    Lantern is not, the canvas repainting once for it (`useCanvasLoop`'s
    repaint) since no frame is running to carry the change.
- **A row steps forward.** Under the pointer (where a pointer can hover),
  under focus and while its board is open, a row's figure and its day's dot
  grow by one level of the type scale (`LIFT_SCALE`, BENTO_MOTION.md
  "Tokens") and the calendar's name brightens to ink (the system highlight
  in forced colours). The figure grows from its inline-start edge, the edge
  the fitted list clips at, into the gap before the words; the gap is the
  row's own column gap, so the figure's slot keeps its whole width. The row
  keeps room under its rule for the grown dot, and the track stops half a
  grown dot short of the row's end, so the dot never meets the clip or the
  focus ring. The focus ring sits inside the row, the rule's thickness.
  The growth is a response behind the motion switch; with motion off, the
  name's ink and the focus ring remain.
- **Kin tile** (`KinFace`, data from `kinOfDay`). The seal's glyph in a disc
  at the head; the kin's number as the numeral beside its tone's bar-and-dot,
  its name and the affirmation's two words for the day (the seal's power, the
  tone's action, `kinWords`); the thirteen days of its wavespell as cells,
  past days filled and today marked, over "Day n of 13" with the wavespell's
  name and theme; today's cell carries a status pulse on a ring round it
  (the fill under its number stays solid), beating with the day rows' dots.
  Its pill is `LivePill`, the kit's one live pill. Where the day's sources
  are read (`kinOfDay(day, sources)`), the kin carries its board
  (`kin.row`, BENTO_BOARDS.md "The kin's board") and the tile's number,
  name, words and wavespell are the button that opens it, as a day row
  opens its calendar's; the pill and the glyph stay outside the button.
- **Seal glyphs** (`sealGlyphSrc`, `day-signs.ts`). A seal is drawn by its
  Maya day sign, one series for all twenty: the standard inscription forms on
  Wikimedia Commons (`MAYA-g-log-cal-DNN-<Name>.svg`, Bluebalam after CJLL
  Wright, CC BY-SA 4.0), day NN for seal NN, the spelling there kept as data
  beside the engine's own. `npm run glyphs:seals` syncs them for the site and
  the app: it checks each file's licence on Commons, records its author and
  licence (`day-signs.sources.json`, which `public/images/ATTRIBUTION.md`
  cites), paints it with `currentColor` and titles it with its seal and its
  page. `seal-glyphs.test.ts` holds every seal to its own day sign, one ink
  (so a mask keeps its counters open), a recorded free licence, and the same
  file in the app.
- **Ties in words** (`tieView`, `tie-text.ts`). Every view of a tie (the
  home's pair list, the dashboard's ties) takes its name, system, meaning, odds,
  share, tier and bits from one function. A reading's ties arrive rarest
  first (`pairTies` in relations), so a view takes the first, never re-sorts.
- **Glyphs on any ground** (`GlyphMark`, bento-lab kit). A seal or sign glyph
  is drawn as a mask over `currentColor` (prefixed and unprefixed: the build
  runs no autoprefixer), so it takes the ink of the surface it sits on; v1's
  board, digest and circle list draw their glyphs through it too. A glyph in
  a ring is `GlyphDisc`: the ring is the disc's own border, outside the mask,
  sized by `--disc` and tinted by `--disc-ring`.

## Dashboard (`/app`)

The reference's portal grammar with the account's own data. Gated like v1
(`GATES` row for the v2 prefix; login is the bento site's, returning here),
and the layout re-checks the session before it reads anything.

- **Rail.** Brand chip and theme toggle; the app nav from `routesIn('app')`
  and `routesIn('app-systems')` with the active pill (`isCurrentLink`) and a
  people count badge; the account card with sign-out. Stacked, the rail
  becomes one scrolling row of destinations and drops its group labels.
- **Greeting.** Weekday and kin eyebrow; "Your map," / name (bright); pixel
  dust ground; notched actions: Add a person, Open the full map.
- **Gold tile.** The kin tile for today.
- **Strongest tie.** The heaviest pair drawn as the bento kit draws a pair
  (`PairDrawing`), its rarest tie and odds under it, then the pair's ties
  counted per rarity tier (`TIER_LABEL`), bars scaled to the largest tier,
  and a link to the two maps. A pair with no tie rare enough for a line is
  still drawn, and its caption says so.
- **Your circle.** You and the people most tied to you, as many as the ring
  seats, drawn as the bento kit draws a circle (`CircleDrawing`), beside its
  heaviest pairs and "Save as a circle". The person at the middle is
  `hubOf` (`src/lib/atlas/circle-hub.ts`, client safe). Below three people
  it says how many more to save (`circleNeeds`: counted from everyone saved
  until the ring seats them, then from who it seats).
- **Today feed.** Day rows for the calendars the account follows
  (`useSystemPreferences`, as the bento board reads them; all of them until
  read), unfitted, on a plain panel. The rows come from `dayRows`, which the
  home's builder uses too.
- **People.** One card per saved person: name, kin (the account's own card
  reads "You"), Maya title, birth line and a map status pill (full, or the
  first field the map still needs: time or place). Unreadable rows show
  their issue line; the last card adds a person.
- **Your map.** The account person's `MapWindow`: atlas stage beside the
  digest at the viewport's height; stacked, the stage is the drawing's
  square.

People are read on the server, owner-scoped, once per request (`cache`);
the account person's atlas is drawn there. Ties are read in the browser
once, by `useTiesAtlases` (bento-lab `people/`, the hook the bento
dashboard reads through too): the pairs ranked one at a time, the heaviest
drawn in full from its winning reading, and the circle seated. A
`TiesProvider` holds the result for both panels. A drawing that belongs to
other people than the ones asked for reads as not ready, so an old drawing
never sits under a new name. The dashboard has no scroll engine: its
drawings show at rest.

## Draw your map (`/map`)

### Problem class

Value before an account: a visitor makes the thing the product keeps (a
map) while signed out, sees what it gives, and the account adopts it at
sign-up without asking for anything twice. The population is every v2
action that ends in "keep this" (the map now; a pair and a circle later),
so the hand-off is one mechanism, not a page's code. The reference is the
Zeus parcel flow: three numbered steps over one live plate, the result
shown before sign-in.

### The page

One frame on the page's ground, no scroll engine (it is a form; nothing
scrubs). Top to bottom:

1. **Head.** Title "Draw your map." and one sentence: type a birth date,
   and the kin, the gates and the sky appear before you sign in.
2. **Steps.** Three numbered steps in one row (stacked below 900 px), each
   a disc with its number, a title and one line, read from `SKETCH_STEPS`
   (`src/lib/site/v2-sketch.ts`):

   | Step | Title | Line | Done when |
   |---|---|---|---|
   | `day` | Your birth date | The kin and the life path need nothing more. | the date parses and the sample has yielded |
   | `hour` | Hour and place | Optional. They light the bodygraph and the rising sign. | both time and place are set |
   | `read` | Read your map | Kin, gates and the sky, as soon as the date settles. | the map for the current input is drawn |

   A step is done or not by its rule; the current step is the first that
   is not done (`sketchSteps`, pure). So a drawn map without an hour reads
   01 done, 02 current (it says optional), 03 done. The current disc takes
   the action fill (`--action` with `--on-action` numerals); a done disc is
   ink on the line; the rest are outlined. Each step is a button that
   moves focus to its field (the date, the time, the map), so any answer
   can be changed at any step; nothing locks.
3. **Plate.** The v2 `MapWindow`, one window holding the input and the
   result. Its bar reads like a map's readout: "Sample" and Maya's name and
   birth line while the sample shows, then "Your map" with the kin and the
   birth line. Under the bar, the birth fields in one row (`BirthFields`
   `row` layout: date, time, place; stacked below 900 px), then the atlas
   stage beside the digest. The map computes as the bento tool does
   (`useDeferredCompute`, `loadPersonAtlas`, `INPUT_SETTLE_MS`), and the
   window shows its status (`MapWindow` `status`).
4. **Taking the plate.** While the sample shows, the stage and digest are
   dimmed and `inert` under one button, "Draw yours", which moves focus to
   the date field; the visitor's first date replaces the sample and lifts
   the veil (`useAtlasDraft` clears the sample's time, place and name with
   it). The fields are never covered, so the keyboard path is the plain
   one. While the visitor's date is incomplete, the last map stays readable
   but dimmed (`MapWindow` `stale`), and the plate's live line, always in
   the page, says a whole date is needed.
5. **Keep.** Under the plate: one line on what keeping does ("Nothing is
   saved until you keep it. Kept, it waits in this browser for an hour
   while you sign up.") and the section's primary action, "Keep this map",
   enabled once the input parses and is not the sample.

### The hand-off

Birth data is personal, so it never travels in a URL, a redirect or an
OAuth `state`, and nothing a signed-out visitor draws is stored on a
server. A kept map waits in the visitor's own browser, out of scripts'
reach, and the account is offered it after sign-in; it adopts nothing
without a press. The page has no share link for the same reason: a share
link carries birth data in its address (the bento tools keep theirs and
say so).

- **Keep.** "Keep this map" posts a server action (`keepSketch`) with the
  map's input. The action parses it with the form's own schema
  (`BirthInputSchema`) and sets one cookie (`SKETCH_COOKIE`,
  `src/lib/atlas/app/sketch.ts`) holding exactly one input, a random nonce
  and its owner: the signed-in account's id, or none for a visitor. The
  cookie is `HttpOnly`, `SameSite=Lax`, `Secure` outside development, its
  `Path` the v2 app prefix (it travels only to the pages that offer it) and
  its lifetime one hour (`SKETCH_TTL_S`: the hand-off serves the sign-up
  under way, not a later visit on a shared computer). Its encoded length is
  capped by the largest input the schema accepts (`MAX_SKETCH_LENGTH`), well
  inside a cookie's 4 KB; the schema refuses half a surrogate pair (which
  JSON would escape past any cap), and a keep is written only when its value
  reads back (`sketchValue`). Signed in, the action sends the visitor to the
  dashboard; signed out, to the bento login in sign-up mode
  (`mode=signup`), returning to the dashboard. A signed-in visitor who
  reaches a login page with a safe `redirectTo` goes there, not to the
  tree's home (`gateRedirect`). Nothing is stored server-side, so there is
  nothing to rate-limit or purge.
- **Offer.** The dashboard reads the cookie on the server and decodes it
  with the same schema. It offers the map only to its owner, or to any
  account when it has none. The offer is a keep card first in the grid:
  what was drawn (kin, Maya title, birth line), the fields to change it,
  and the actions. Whether the account already has its own map is read
  from its own person (`is_self`), readable or not, never from the first
  person saved. Without one, the primary is "Keep as you"; with one, it is
  "Add as a person" (the people API needs a name) and a quiet "Replace your
  map", so an existing map is never overwritten unasked. "Discard" drops it.
- **One write path each.** "Keep as you" and "Replace your map" write the
  profile's birth fields and complete onboarding through the profile
  service (`updateOwnProfile`, which `PATCH /api/profile` runs too: it
  ensures the user and profile rows, then mirrors the profile into the
  account's own person with `upsertSelfPerson`). The account's display
  name changes only when the map carries a name. "Add as a person" goes
  through the people service (`createPersonWithinPlan`, which `POST
  /api/people` runs too, plan cap included), from `personInsertOf`.
- **Each action re-checks.** The keep card posts one action (`keepOffer`)
  with the pressed button's `intent` (as you, replace, person, discard), so
  the card shows the outcome of the last press only. Every action reads the
  session, parses its input again, and checks the cookie's owner and that
  the form's nonce is the cookie's, so a tab showing an older map cannot
  consume a newer one; the page keys the card by that nonce, so a newer map
  never inherits an older one's fields. "Keep as you" is refused once the
  account has its own person; only "Replace your map" overwrites it.
  It clears the cookie (same `Path`) only after its write succeeds; a
  refused write (the plan cap, a bad field) keeps the map on offer with the
  reason. The pending action disables its buttons. Keeping as you is
  idempotent; two tabs adding the same map as a person at the same instant
  can still add it twice, which a server-side record would be needed to
  stop.
- **Leaving.** Signing out from the dashboard clears the cookie. A map kept
  in one browser is not offered in another; the dashboard then asks for
  one birth date as before.

### Changing it later

The account's own map stays editable: the dashboard greeting carries a
"Change your map" control when the account has its own person. It opens a
modal dialog (the platform's `dialog`: focus held inside, Escape closes,
focus returns to the control) with the same fields, filled from the saved
person afresh on every open (no unsaved edit or old error survives a
close), and saves through the same profile service as "Keep as you", so the
profile and the person never drift. The keep card and the dialog are one
editor (`MapEditor`).

### Accessibility

- The steps are buttons in an ordered list; the current one carries
  `aria-current="step"`, and each says its state in words for assistive
  tech (done, current, optional). "Read your map" moves focus to the map's
  labelled region (`tabIndex=-1`).
- While the sample shows, the stage and digest under the veil are `inert`;
  the veil's one button and the fields above it stay reachable.
- The map's status (drawing, failed) is the stage badge's live region.
  "Read your map" is done only when the drawn map is the current input's.

### Acceptance

- `/map` renders the sample on the server; typing a date draws
  the visitor's map; the steps follow `sketchSteps` (unit tests for every
  combination of date, hour and drawn).
- The cookie holds only what the share schema accepts, is `HttpOnly` and
  scoped to the v2 app path, and no URL in the flow carries birth data.
- Signed out: Keep → login in sign-up mode → dashboard with the keep card;
  "Keep as you" draws the dashboard as the account's map and the card is
  gone. Signed in with a map: the card offers "Add as a person" and
  "Replace your map". A cookie owned by another account is not offered; a
  stale nonce is refused; a refused write keeps the offer.
- "Change your map" saves through the profile and the dashboard redraws.
- Fits 1440 × 860 and 1280 × 720; stacks at 390 px with no horizontal
  scroll; both themes.

### Open

- One own person per account is held by code (`upsertSelfPerson` selects,
  then inserts), not by the database; a partial unique index on
  `people(owner_id) where is_self` and a transactional profile-and-person
  write need a migration against existing rows.
- The plan cap is checked, then the person inserted, in two statements; two
  concurrent adds can both pass it. Serialising per owner needs the same
  migration pass.

## The app in v2

### Problem class

Every signed-in interface of the app (`/app/*`: people, a person, a pair,
circles and a circle, the calendar, the library and its articles, settings,
the six system pages) speaks v2's language, and every link inside it stays
in v2. The population is fifteen
routes over one set of components (`src/components/bento-lab/{app,people,
systems,docs,site}`) whose links were spelled for the bento site alone.

### Links

- **One resolver.** `routes.ts` owns the trees: `SiteTree` (`'v1' | 'v2'`),
  `matchRoute(path)` (the route table's rows, patterns matched segment by
  segment, so `/app/pair/[a]/[b]` takes both ids), `resolveSiteHref(tree,
  href)` and `createSiteHref(tree)`. Query and hash are kept; anything that
  is not a site path (protocol-relative, external) is refused.
- **What v2 serves** is read off the table: its own pages (`/`, `/map`) and
  every row of the signed-in groups (`APP_GROUPS`), patterns included. Any
  other path (the guides under `/learn`, pricing, legal) resolves to the
  bento site. `v2-routes.ts` is that rule's adapter; it lists no paths.
- **Which tree a component links into** is serialisable data, never a
  function: server components take `tree` as a prop from their route file;
  client components read it from `SiteTreeProvider` (`useSiteHref`,
  `useAppHrefs`), which each tree's app layout sets. The people links
  (`appHrefs(tree)`: person, pair, circle, new circle, a system on a
  person) are built from the same resolver. No URL is resolved at module
  scope.

### Pages

- **Route files stay thin in both trees**; what a page does (reading its
  params, ownership, the missing state, building the atlas) is one shared
  body in `src/components/bento-lab/app/pages/`, rendered by the v1 and the
  v2 route file with their tree. v2 never imports a v1 route module.
- **v2's layout** keeps authentication and `V2Shell`; v1's `AppShell` is
  never nested in it. The rail lists every app page from the table, now
  all served in v2.
- **A record's own actions sit in its head**, in both trees: a person is
  edited in a dialog (the saved form, seeded from the record) and removed
  to the trash after a question; a circle is shared as a link made on a
  press, and deleted after a question. The dialog is the platform's modal
  `<dialog>` (`DialogButton`): focus held inside it, Escape closing it,
  focus handed back to its button. An edit refreshes the server's render
  of the page it was made on; an add or a removal goes to the page it
  leaves for, and that navigation renders it fresh. No mutation refreshes
  a route only to move a count: a refresh still in flight absorbs the next
  one, so an edit made just after an add would keep the old render. The
  rail's people count reads this client's people list, which every add,
  edit and removal writes (`usePeopleCount`), and the server's count until
  the client holds a list.
- **The framework floor is Next 16.4.** A refresh renders under the
  route's `loading.tsx`; on Next before 16.3 the React it bundles can
  leave that transition suspended with no ping, so an edit saves but the
  page keeps its old render until the next interaction, intermittently
  and only in production builds (vercel/next.js#86055, fixed by
  react#36134). The adapter moves with it: Next 16.4 reads
  `server/preview-props.json`, which OpenNext Cloudflare inlines from
  1.20 (with `@opennextjs/aws` 4.1.15 and Wrangler 4.148); an older
  adapter throws on that read and every server-rendered route answers
  500 on the Worker. Next, OpenNext Cloudflare and Wrangler therefore
  move as one change, proven on a Worker preview by repeated edits,
  prefetched navigation and back and forward. Open: `pnpm-lock.yaml`,
  beside the npm lockfile CI installs from, still records an older Next.

### Appearance

- **Presentation owners carry an `appearance`** (`'bento' | 'frame'`),
  read off the tree (`APPEARANCE[tree]`): `PageHead`, `Section`,
  `PageStack`, `PageBlock`, `SystemPage` and the map skeleton. `frame`
  sets the page in v2's grammar: each part a panel (`frame.module.css`) a
  gap apart, the head on the art gradient with the eyebrow, the title and
  the lead from the panel's start, the actions in a row under them; the
  slots (picker, actions, children) are the same in both.
- **Tokens, not overrides.** The modules' cards keep their own surfaces
  and sit on v2's panels as insets. Where the two grammars differ, the
  module reads a variable with the bento site's value as its fallback and
  v2's layout scopes the other: `--set-justify` (sets of tiles and chips
  centred on the bento site, from the panel's start in v2).

### Flows

Each is walked signed in, at 1512 × 860 and 440 × 900, in the three
engines, and kept as proof (screenshots):

- Today: the kin tile and every day row open their boards.
- People: search; add a person (date, time, place); open one; edit them;
  delete them (confirmed, the count in the rail follows).
- A person's map; each system page on that person (`?person=`).
- Two people: picked from the list, the pair page, switching either person.
- Circles: chosen from the list, saved, opened, shared.
- Calendar: month and 13 Moons, moving through months, back to today.
- Library: the index, a topic, an article.
- Settings: the systems followed, language and time, the daily brief, the plan.
- Sign out, landing on v2's home.

### Acceptance

- A link inside any v2 app page resolves to v2 for every app route, and to
  the bento site for every other row (a test over the whole table).
- Every v1 app route has a v2 route file rendering the same body.
- The flows above pass in all three engines with no page error and no
  horizontal overflow.

## Layout rules

- **Plates.** An inverse section is a plate (`groundProps`, one value
  carrying both the chapter and the plate class, so neither is set alone): the frame's
  grid on the other theme's ground, padded by `--v2-plate` (the panel's own
  padding; the gap below 900 px) and rounded concentric with the panels in
  it (`--radius-stage` plus that padding). Sections stand apart by
  `--v2-section`, the page's gutter, twice any gap inside a frame. Words
  and lists sit on the ground itself, ruled by hairlines (`wallList`); a
  figure's stage is the only panel, and it takes the plate's art ground.
  Under forced colours a plate draws a `CanvasText` edge.
- **Bands.** The map, the pair and the circle each sit in a band: the
  section is one viewport (`100svh`) on the page's ground and holds its
  frame centred at `--band-zoom` (0.77) of its size (`.band`, `.banded` in
  the frame kit). Zoom scales the frame's layout, type and spacing as one, so
  it reflows as one piece and a plate's scroll-in transform stays its own;
  zoom leaves a percentage as it is, so the frame's width and height take the
  same share of the band. Stacked, a band's frame keeps its full size and its
  own height.
- **Frames.** A frame is at least the viewport's height less two gaps, and
  never below fifteen hit targets; more content (zoomed text, long names)
  grows it rather than clipping. Stacked (below 900px) it takes its
  content's height.
- **Content that must not size a frame.** A drawing or a scroller that
  should take the room it is given sits in a box that is empty to layout:
  absolutely inside a flexible box (the tie graph, the How drawing) or under
  `contain: size` (the map window's body). Stacked, such a box takes its
  drawing's square.
- **Drawing slots.** A bento drawing hosted in a v2 panel (the pair and
  circle drawings, on the home and the dashboard) sits in `frame.drawingSlot`:
  an empty flexible box with the drawing absolute in it and its SVG set to
  the box's height, so the viewBox fits the drawing to whatever room the
  panel leaves. Stacked, the drawing returns to the flow at its own shape.
  A drawing being read again for new data keeps its place, dimmed to
  `--busy-alpha`, with `aria-busy` on its slot, until the new one lands.
  The bento facts and pair lists keep the bento surface class, which carries
  each tie's layer tone, and take the v2 panel's skin from `frame.skinnedList`
  (raised) or `frame.skinnedInset` (inset); the frame's stage is
  `frame.figureStage`, its title `frame.figureTitle`, its last action
  `frame.columnEnd`.
- **Drawings drawn on the server, unless they answer.** On the home the page
  draws the circle drawing and its list and hands them to the client frame
  as slots; the frame only plays them (rise, `drawLines`), so that atlas
  never ships to the browser. The pair answers the pointer, so its atlas
  ships whole and the frame draws it (`PairStage`). A frame finds what to
  play by data hooks and the `[data-tiles]` wrapper, never by another
  module's class names.
- **Reading order.** A flipped frame keeps its stage first in the source and
  moves its side column to the first column with `order` on desktop only,
  so a stacked frame reads title, drawing, then the list.
- **Titles.** A frame's title is cut into a corner of its largest panel
  (`Notch`), so the side column holds only its list or tiles.
- **Notches that stack.** A stacked panel has no corner to cut: any notch
  that holds content carries `frame.notchStack`, which puts it in flow,
  unfilled, without its corner pieces, and lets its controls wrap onto a
  second line before any of them narrows. Frames keep only their own padding.
- **Notch insets.** A notch's content keeps the panel's padding from every
  edge it shares with the panel, so a title cut into a corner sits as far
  from the screen's edge as the panel's own content.
- **Lists in a fixed column.** A list that shares a column that must not grow
  is fitted (see "Fitted rows"): it shows whole items only, never a clipped
  one, and never pushes the frame. A list with a fixed count (a stat's ties,
  a circle's heaviest pairs) is not fitted: it may grow its frame, as any
  content does.
- **Grid columns.** A grid that holds a scroller (the atlas stage's layer
  switch) sets its column to `minmax(0, 1fr)`, so the scroller scrolls inside
  the column instead of widening it.
- **Flexible shares when stacked.** Panels that share a column's height
  equally (`flex: 1 1 0`) take their content's height when
  stacked, and anything positioned in a corner of them returns to the flow.
- **Fit.** No panel clips its own content at 1280×720 or 1440×860; the only
  clipped box is a fitted list, which hides whole items past the last that
  fits and never shows part of one.

## Routes

v2 serves its own pages (`/`, `/map`) and every row of the signed-in
groups, patterns included ("The app in v2", "Links"); `resolveSiteHref`
(`routes.ts`) resolves a path, query and hash kept, to v2 where v2 serves
it and to the bento site otherwise, so a v2 link never lands on a page v2
has not built. A test fails when a v2 page has no row, a served row has no
page, or a row names a path the route table does not have.

The gate table gains one row: prefix `V2_BASE/app`, login the bento site's,
home the v2 dashboard, no auth paths of its own. A signed-out visitor goes
to the bento login with `redirectTo` set to the v2 page, which the login
honours through `safeRedirect`; a signed-in visitor who reaches the login
goes to that same safe `redirectTo` (never to a login page), else to the
tree's home. `mode=signup` (`AUTH_MODE_PARAM`) opens the login on account
creation. The v2 layout re-checks the session on the server and every read
is owner-scoped, as in v1.

## Acceptance

- Typecheck, lint and unit tests pass; v1 motion policy and client-bundle
  tests unchanged and green.
- Rasteriser tests: every part has cells; the window's cells sit inside the
  frame's cut; the ring hole stays open; cell count is stable.
- Home fits 1440 × 860 and 1280 × 720 per frame with no overflow; stacks at
  390 px with no horizontal scroll.
- The dashboard renders signed in at 1440 × 860 and 390 px in both themes;
  signed out it redirects to the bento login with `redirectTo` back here.
- With reduced motion or the motion toggle paused, every frame shows its
  final state and nothing scrubs.
- Light and dark themes both read; text contrast follows the palette roles
  on the page and on every inverse plate (both are a theme's palette).
- Each frame's focus holds the largest area; the run opens and closes on
  the page and turns to an inverse plate at most `V2_INVERSE_MAX` times,
  never twice in a row (a test over `V2_SECTIONS`).
- Scroll at 60 fps on the home (Performance trace, no layout in scrub frames).

## Second opinion

| Reviewer | Scope | Date | Status |
|---|---|---|---|
| Codex (`gpt-6-astra`) | this spec, kit split, Lenis/ScrollTrigger lifecycle, gate, raster | 2026-11-05 | incorporated |
| Codex (`gpt-6-astra`) | "Draw your map": hand-off store, offer vs adoption, actions, services, routing, accessibility | 2026-11-09 | incorporated; open items in "Open" |
| Code-review agent | "Draw your map" implementation against this spec | 2026-11-09 | incorporated; clearing the cookie on sign-outs outside v2 left to owner binding and the hour's lifetime |
| Codex (`gpt-6-astra`) | the boards' calendars: mast, cells, overview switch, noon rule, crossings, numerals, grid keyboard | 2026-11-09 | incorporated |
| Codex (`gpt-6-astra`) | the app in v2: tree-aware links, shared page bodies, appearance variants, flow list | 2026-11-09 | incorporated |
| Codex (`gpt-6-astra`) | the app in v2, implementation review: record edits, dialogs, rail count, framed sections | 2026-11-09 | incorporated |
| Codex (`gpt-6-astra`) | the stage: hover routing, ownership across lists, hover grace, the mark's stated channel with motion off, fit | 2026-11-12 | incorporated |
| Codex (`gpt-6-astra`) | the framework floor: a refresh left suspended under `loading.tsx`, Next 16.4 against an app-level workaround, adapter versions | 2026-11-10 | incorporated |
