# Bento Site

The full Pleiad website and platform UI rebuilt in the bento language of
`/lab/bento` (BENTO_HERO_LAB.md). Marketing pages, public tools and the
signed-in app share one kit, one set of page templates and one data layer.
The live site keeps running until the new tree is promoted.

## Positioning

A survey map shows where water runs before anyone digs. Pleiad does that for
the people in a user's life: one map per person that layers Human Design,
the 260-day count (Dreamspell and the traditional Tzolkin), astrology and
numerology, then the ties between two people and across a group, each tie
weighted by how rare it is. The product is the map. Artwork stays as the ground the map sits on; it
never replaces the map.

## Problem class

A product site that has to sell and then *be* the product: every marketing
claim is a live instance of a screen the user gets after signing up. The
population is every page in `src/app` (57 routes). They reduce to twelve
templates (below). A new page should need a template and a data binding,
never new layout CSS.

## Architecture

| Concern | Decision |
|---|---|
| Location | `src/app/lab/bento/**`, mirroring the live URL tree (`/lab/bento/pricing` ↔ `/pricing`, `/lab/bento/app/people` ↔ `/app/people`). |
| Links | Every internal link goes through `siteHref(path)` from `src/lib/site/routes.ts`. `SITE_BASE` is `/lab/bento` now and `''` after promotion. No literal internal URL in a component. Content written against live paths (legal text, library articles) is mapped by `siteHrefForLive`, which reads the table's `live` column. |
| Shared text | Legal policies live once, as typed data in `src/lib/site/legal/`; the live `/terms`, `/privacy` and `/refund` pages and the bento ones render the same documents, and the support and privacy addresses are defined once. The library reads `src/lib/docs/content.ts`; the index ships section titles only, never article bodies. The contact form posts `{name, email, message}` to the live `/api/contact`, so the server's schema is the one rule. |
| Route table | `src/lib/site/routes.ts` is the contract: path, label, template, nav group, auth, the live route it replaces, and whether it is indexed. Nav, footer, wireframe index, metadata and the promotion step read it. |
| Type | One scale for the tree (BENTO_TYPE.md): roles from `src/lib/design/type-scale.ts`, emitted on the lab root; no raw font size in a lab CSS module (`type-scale.test.ts`). |
| Surfaces | One elevation scale and one set of radius roles (BENTO_POLISH.md): `src/lib/design/elevation.ts` and `radius.ts`, emitted on the lab root; no drop shadow or raw radius in a lab CSS module (`elevation.test.ts`, `radius.test.ts`). |
| Kit | `src/components/bento-lab` grows into the site kit: shell (one top bar for the site and the app, footer), scenes, page templates, cards, notch, atlas renderers, forms. |
| Data | Reuse, never fork: engine (`@pleiad/engine`) for computation, the existing API routes and React Query hooks for signed-in data, `src/lib/data/*` builders for marketing numbers. |
| Compute | Public tools compute in the browser with the pure engine (no account needed), by deep import only. Dreamspell, Tzolkin and numerology load with the page; astrology and Human Design load on demand once a date is valid, debounced. Every on-demand engine load goes through `lazyModule` (`src/lib/lazy-module.ts`): one load shared by concurrent callers, and a failed load retries on the next call. The people hook's computed results load astrology and Human Design the same way, so no client page bundles an ephemeris package (`src/lib/atlas/client-bundle.test.ts`). Signed-in pages read saved people through the existing API and hooks. |
| Auth | Middleware owns the gate. `src/lib/auth/gates.ts` holds the table: the live gate and `SITE_GATE` from the route table (`prefix`, `login`, `home`), so the lab app is guarded by the same code path as `/app`. `gateRedirect` is the whole middleware decision: a signed-out visitor on a gated path goes to that gate's login with the full path and query in `redirectTo`, and a signed-in visitor on a login page goes home. `loginFor` names the login of the gate that owns a path (the live login when none does); the email-link callback sends a failed exchange there, still carrying `redirectTo`. Paths are matched on segment boundaries after percent-decoding, lower-casing and trimming a trailing slash, so `/app` never catches `/apple` and an encoded spelling of a gated path is still gated. The bento app layout re-checks the session server-side with `getSession()` as defence in depth. Every post-login redirect, the email-link callback included, goes through `safeRedirect` (`src/lib/auth/safe-redirect.ts`): the path is parsed against a probe origin, refused if it leaves it, holds a backslash or a control character, or decodes to `//`, and returned normalised. The live app shell is not reused (its links are hardcoded to `/app`); the bento app has its own shell and shares only hooks and API clients. |
| Route contract | `src/lib/site/routes.test.ts` walks the tree: every `page.tsx` is a table row, every row has a page, and every `siteHref` or `signInHref` literal in the tree and the kit lands on a row (dynamic rows match by segment). |
| Indexing | Whole tree `noindex`, absent from the sitemap. Promotion removes the flag. |

## Templates

| # | Template | Pages it serves |
|---|---|---|
| T1 | Home | `/` |
| T2 | Tool (input → live map) | `/map` (was `/calculate`), `/pair` (was `/compatibility`), `/circle` |
| T3 | Board | `/today`, app dashboard |
| T4 | Pricing | `/pricing` |
| T5 | Library index | `/learn`, app library |
| T6 | Article | `/learn/[system]`, library articles |
| T7 | Plain document | `/about`, `/terms`, `/privacy`, `/refund`, `/contact` |
| T8 | Auth | `/login`, `/onboarding` |
| T9 | App list | people, circles, boards |
| T10 | App person | `/app/people/[id]`: the person atlas plus every system tab |
| T11 | App relation | `/app/pair/[a]/[b]`, circle analysis |
| T12 | App system page | numerology, BaZi, Gene Keys, oracles, Tree of Life, moon, calendars, settings |

## The Atlas (hero and product core)

One SVG per person, four layers drawn from the outside in. Every mark is
computed by the engine; nothing is decorative.

| Pin | Layer | What it draws | Engine source |
|---|---|---|---|
| 1 | Dreamspell | 20-seal ring with the kin's seal at 12 o'clock and its antipode at 6, the oracle seats ringed, the tone as a Maya bar-and-dot mark, the traditional Tzolkin day in the readout | `calculations/dreamspell`, `calculations/oracle`, `calculations/tzolkin` |
| 2 | Human Design | Bodygraph: defined centres filled, active channels drawn | `calculations/human-design`, bodygraph layout |
| 3 | Numerology | Life path and the core numbers as a strip under the wheel | `calculations/numerology` |
| 4 | Astrology | Zodiac ring (outermost), natal planets at their ecliptic longitude | `calculations/astrology` |

**Names.** A layer is named by the first system it reads, with that
system's label in the catalog (`SYSTEM_CATALOG`), so the map, the settings
and the system pages never call one system two names. Dreamspell is
labelled Dreamspell and never called the Maya calendar; its system is
described as the 260-day count, and the traditional Tzolkin day sits
beside it.

**Order.** Two orders, each held once in `src/lib/atlas`. The drawing's
structure is outside in (`ATLAS_LAYERS`: the sky ring outermost, the
number strip last); it sets the stacking depth of the exploded view. The
lead order is the order the product reads its systems in (`DIGEST` in
`layers.ts`: Dreamspell, Human Design, Maya Long Count, Numerology,
Astrology). The digest tiles, the layer switch, the readout and the layers
scene's scroll steps follow the lead order, and each layer's pin number is
its place among the layers in it (`LAYERS_BY_PIN`).

**Read beside the map.** A chart system that a birth date gives without a
drawn layer is read beside the map: today the Maya Long Count
(`buildLongCount`: the five places, the dotted date and the calendar
round, GMT correlation). It is light, so it ships with the light half of
the atlas, and it has a digest tile but no pin, no ring and no switch
entry: there is nothing on the drawing to bring forward.

A birth date alone draws the sky at noon with each body's arc for that day
(`getPlanetaryDayArcs`), and the readout says so; the bodygraph and the
rising sign wait for a birth time and place. The atlas states what it lacks
instead of guessing.

Every atlas ships with a text model beside it: the readout table states each
layer's values, so the SVG carries no meaning a screen reader would miss.
Below 720px the atlas drops to two rings at a time, chosen by the layer
switch, instead of shrinking all four.

### Ties, tiers and the edge rule

A tie is one relation the engine finds between two people (`pairTies` in
`src/lib/relations/pair-ties.ts`). Each tie carries its measured base rate,
its surprisal in bits and a tier from `tierOf` in the engine's rarity
service:

| Tier | Base rate | Drawn |
|---|---|---|
| T3 | under 3% | Line, labelled |
| T2 | under 20% | Line |
| T1 | under 75% | Table only |
| T0 | 75% and up | Table, folded under "common ties" |

A tie type's base rate is read through `baseRateOf` in the same service; an
unmeasured type counts as a coin flip, the rate `surprisal` reads as one bit.
Copy that quotes a base rate phrases it with `tieOdds`
(`src/lib/relations/odds.ts`).

`mayDrawEdge` is the single rule for whether a tie gets a line, used by the
pair drawing, the circle drawing and the copy that explains it; copy quotes
the cut-off as `EDGE_CEILING`, the ceiling of the commonest drawn tier. Base rates
come from `MEASURED_PAIRS` (7,140 random pairs for date-only systems, 780 for
systems that need a birth time). Directional ties carry `acts: {by, on}`
(a guide tie points from the guide to the person guided) and are drawn as
arrows.

The pair atlas sets two atlases side by side, anchors each line on the mark
it joins (planet, lit seal, centre or gate) and sizes its frame by tie
count. The circle atlas puts the person with the most total bits at the hub,
orders the ring greedily by tie weight with a deterministic tie-break, and
labels T3 lines only. A tie label's pill is sized from the label's font
size and the average glyph advance held in `geometry.ts` (`TIE_LABEL`,
`labelWidth`, `textWidth`), counting letters and not combining marks, so
pointed Hebrew fits as well as Latin. Circle labels are placed, not pinned:
each person keeps clear its disc and its two lines of words (sizes from
`PERSON_LABEL`), and each label, rarest first, slides along its line to the
clear point nearest its preferred spot (`placeAlong`). A label with no
clear point is left to the table and the pairs row. Pair arcs bow along the
frame's axis from the maps' outer edge (`Frame.clear`), so in the stacked
phone layout they run beside both maps, not through the top one.

### Hero precision

The hero is the Atlas, live, seeded with a sample person so it is never
empty. On screens 1180 px and wider, its three columns fit one viewport
under the nav: `100svh` minus `--nav-h`, floored at 600 px.

- **Left column:** the claim, "Five systems. One map.", its count spelled
  from the digest (`DIGEST.length`, `src/lib/site/number-words.ts`) so it
  can't drift from the tiles beside it; one short line, "Start with your
  birth date."; and the birth fields (date and time paired, then place)
  that redraw the atlas as the user types. Then the sample's birth line,
  "Keep this map" (sign in, return to people) and "Open the full map".
  The claim promises only what a date alone draws: Human Design and the
  rising sign wait for a time and place, and the tiles say so.
- **Centre:** the atlas over the portal artwork (dimmed, behind a scrim), in
  the stage's `fit` mode. The drawing is the largest square the stage
  allows, with a status badge for the deferred compute and the sky's
  precision ("Exact sky" or "Date only"; the values are the digest's) and a
  layer switch that dims the other rings. The switch keeps one line and
  scrolls when its names outgrow it. Pins carry only their layer number
  (`LAYER_META.pin`), and an empty bodygraph gets no pin.
- **Right column:** the digest (`AtlasDigest`, "The digest" below), five
  tiles in the lead order, one per row. The full text readout stays in the
  page for assistive tech (`AtlasReadout`, visually hidden, the drawing's
  description).
- **"Add a second person"** swaps the stage for the pair drawing, and the
  right column for the second person's fields and the rarest ties.

Motion follows storyboard H (BENTO_MOTION.md). CSS draws the map at first
paint. On a new date, anime.js turns the rings the short way and glides
the pins, and the digest values roll.

### The digest

`AtlasDigest` reads the person in the lead order (`DIGEST`): one tile per
layer and one per system read beside the map. Every tile is one grammar,
so the eye learns it once:

- **Figure** on the leading side, in the layer's colour, as tall as the
  three lines of text beside it (caption, lead and small at UI leading, so
  the size is derived from the type roles, not set). A layer's pin sits on
  the figure's corner, as pins sit on the drawing; a tile beside the map
  has none.
- **Text column**, whose start edge every tile shares: the system's name
  (caption, capitals), a strong line (lead, 600, ink, with what the value
  is in the label's voice beside it) and one support line (small, ink 2).
  Support is a list of short phrases; a narrow tile breaks the line between
  phrases, never inside one.

| Tile | Figure | Strong line | Support |
|---|---|---|---|
| Dreamspell | The kin as the drawing sets it at twelve o'clock, cropped (`KinMark`: the lit seal on its disc, the tone above) | Kin number · "Kin" | The kin's title |
| Human Design | The bodygraph | Type | Profile |
| Maya Long Count | The five places as bar-and-dot numerals in paired columns, read left to right and down; a lone last place is centred | The dotted date | The calendar round |
| Numerology | The life path in a ring, the number in ink | "Life path" | Birthday and expression |
| Astrology | The sun's sign glyph | Sun sign · "Sun" | Moon and rising |

Missing input is stated, never guessed: without a time and place the
Human Design tile's strong line is the input it needs, over an empty
bodygraph, and Astrology's support says what the rising sign needs.

A layer tile is a button that brings its layer forward (or, in `travel`
mode, scrolls the layers scene to it). A tile beside the map is text,
not a control, and takes no hover. The layers scene's legend is the legend
of the four plates, so it lists the layers alone (`beside={false}`).

Columns are set by the context, from the tile count (`--tiles`): one per
row in the hero's column and the tool's findings; one row in the map
figure on wide screens; two columns where the row would be too narrow,
with an odd last tile across both. A tile narrower than its figure, gap
and widest line (a container query on the tile) sets the figure above the
words instead of squeezing them.

### Marks explain themselves

Every mark on a person's atlas answers the pointer, a tap and the keyboard
with a card: what the mark is, the person's value at it, and what the
tradition reads into it. This holds wherever `AtlasStage` draws a person
(the hero, the map figure, the people tool). The card enhances and never
gates: every value it shows is also in the readout, and every mark is a
named button the keyboard and a screen reader reach.

**Marks.** `src/lib/atlas/marks.ts` names the marks: their identity
(`AtlasMarkRef`), their stable key (`planet:sun`, `sign:leo`, `rising`,
`seal:12`, `tone`, `centre:g`, `channel:64-47`, `gate:1`), what each is
called and reads for this person (`markTitle`), and which marks belong
with it (`relatedMarks`). It is light: it reads only tables the drawing
already ships, and the centres come from their own engine module
(`data/human-design-centers.ts`) so naming them costs nothing.
`src/components/bento-lab/atlas/mark-geometry.ts` places them
(`placeMarks`) with the same functions the drawing uses for its glyphs, and
a test renders the drawing and checks every glyph against its mark. The
drawing writes each key on the mark's own group as `data-mark`.

| Kind | Layer | Shape | Drawn when |
|---|---|---|---|
| planet | Sky | the glyph on the planet track, at its spread angle | every body |
| sign | Sky | the glyph on the sign track | always, 12 |
| rising | Sky | the ascendant line | a birth time and place are known |
| seal | Kin | the glyph on the seal track, with its disc or seat ring | always, 20 |
| tone | Kin | the bar-and-dot mark | always |
| centre | Body | the centre's layout position and size | a bodygraph is drawn, 9 |
| channel | Body | the channel's polyline, anchored at its length midpoint | the channel is defined |
| gate | Body | the gate mouth | the gate is active outside a defined channel |

A channel draws its own two gates, so gates inside a defined channel are
not marks. Without a bodygraph the layer draws its outline and has no
marks. The Numerology layer is drawn by the strip and the digest, not inside
the drawing, so it has none either.

**Words.** A card's head is the mark's title: a label (what the mark is,
secondary) and a value (the person's value at it, the strong line). The
rest comes from `explain(atlas, ref)` (`src/lib/atlas/explain.ts`), pure
and server-safe, which adds a meaning and a row of facts. No copy is
written for the cards: every line comes from a table the product already
reads, and a mark whose source has nothing for a line leaves it out.

| Kind | Label | Value | Meaning | Facts | Source |
|---|---|---|---|---|---|
| planet | Planet name | Its place in the readout's words (`Leo 12°`, the day's arc, retrograde) | Keywords | Kind | `PLANETS` |
| sign | Sign name | The bodies drawn in it, or "No planets" | Keywords | Element, modality, ruler | `ZODIAC_SIGNS`, `PLANETS` |
| rising | Rising | Sign and degree | The first house's theme and keywords | House | `HOUSES` |
| seal | Colour and seal name | Every oracle seat it holds in this kin (Your seal, Guide, Analog, Antipode, Occult), or its number | The first seat's description | Power, action, essence | `ORACLE_ROLES`, `SEAL_MEANINGS` |
| tone | Tone | Name and number | | Action, power, phase | `TONE_MEANINGS` |
| centre | Centre name | Defined or Open | Its function | Not-self theme, when open | `CENTERS` |
| channel | Channel name | Its two gates | Keywords | The centres it joins, circuit | `CHANNELS` |
| gate | Gate and number | Its centre | Gate name and keywords | | `GATES` |

A sign holds the bodies where the drawing puts them: without a birth time,
at noon, the same place the readout's day arc starts from. The oracle
seats live in one table, `ORACLE_ROLES` (`src/lib/dreamspell-oracle.ts`),
read by the learn page's oracle section, the readout and the cards.

The readout is built from the same titles, so it states every mark: all
the bodies, the rising sign, the oracle, the defined and open centres, the
channels and the lone gates.

**Relations.** `relatedMarks` lights a planet's sign, a sign's planets,
and the rising sign's sign. The person's own seal lights its four seats
and the tone; any other seat lights the person's seal; the tone lights the
person's seal; a seal holding several seats lights the union. A centre
lights its defined channels and the centres at their far ends, a channel
its two centres, a lone gate its centre. Every relation is read from the
atlas and the engine tables; none is stored.

**Pointer.** One nearest-mark layer reads the pointer for every mark,
because planets and gates sit closer than a finger. The pointer is mapped
into drawing units from the drawing's box and the zoom group's live scale,
read from its computed style, so the narrow-screen zoom holds mid-
transition. A ring that is still turning to a new date is read through its
live turn, so the pointer hits a mark where it shows. A mark answers when
the pointer is within its reach: the larger of the mark's own radius and
half of 24 CSS px (WCAG 2.5.8), in drawing units at the current size. A
point mark whose own shape holds the pointer wins outright, so a glyph is
never lost to a line drawn across it. Otherwise, of the marks in reach,
the one whose distance is the smallest share of its reach wins; a point
mark wins a tie with a line, then reading order decides. Every layer
group's live turn is read, not a list of the rings that turn. While the
layer switch holds a layer forward, only that layer's marks answer. The readout is the equivalent for anyone the targets do not
suit.

**Keyboard.** The marks are one toolbar (`role="toolbar"`, "Marks on the
map", with its key hint as its description) holding a button per mark,
rendered on the server from the light titles, with a roving tab stop. The
arrow keys step through the marks in reading order: layer by layer from
the outside in, ring by ring from the outside in, clockwise from twelve
o'clock; the bodygraph top to bottom, then left to right. Home and End go
to the first and last. Under the narrow-screen zoom, a mark the zoom
pushes past the drawing's edge has no button, so focus never lands on
something unseen; the zoom read is the one the stylesheet is heading for
(`--atlas-zoom` while the zoom group has a transform), so the breakpoint
lives in the stylesheet alone. Each button is named by its label and value, and
only the active one is described by the card (`role="tooltip"`, which
holds no controls). Focus shows the same card as hover, and focus moving
to a mark replaces any kept card, so a button is never described by
another mark's words.

**Keeping and closing.** A tap opens the nearest mark's card and keeps
it; a click, Enter and Space keep a card the same way. A kept card stays
while the pointer moves over other marks and closes on a second press on
its mark, on Escape, or on a press outside the drawing. A card the
pointer opened stays while the pointer moves onto it (WCAG 1.4.13): the
pointer leaving the marks closes the card after a grace of `quick`, which
any other event, or the pointer reaching the card, cancels, and moving on
empty ground does not restart. Escape closes any card without moving the
pointer or focus; the stage hears it in the capture phase and stops it
there, so one press never also closes a menu or sheet around the atlas.
A card closed on purpose stays closed until the pointer finds another
mark or leaves. A new atlas or a new layer focus
closes the card, because the marks it described moved or stopped
answering.

**Card.** From the top: the eyebrow (the layer's pin number and name,
keyed by a short stroke of the layer colour), the label, the value in the
display face, the meaning, and the facts row. Every string is set as text.
The surface is the pins' glass. The card hangs from its mark toward the
drawing's centre on both axes, set off by the mark's halo and never closer
than half the least target, no wider than its measure or half the drawing
less that offset. `placeCard` is pure: from the mark's anchor, the card's
layout size and the drawing's size it returns the card's top-left corner,
clamped inside the drawing; the card is set there by `transform`, measured
from its layout box (never its transformed box, which the entrance moves),
and placed again whenever the card or the drawing resizes. Under 720 px, where the pins are
hidden, it docks to the drawing's edge away from its mark, so it never
covers what it describes.

**Micro-interactions.** The active point mark gets an outline ring in its
layer colour, off the mark by the 2 px surface gap (`HALO_GAP`), which
draws itself in (`quick`, `emphasized`); it is drawn inside the mark's
layer group, so it turns with its ring. Its related marks keep full
strength while every other mark dims to the opacity the layer switch uses
(`--atlas-dim`), over `quick`. While the switch holds a layer forward, only
that layer's marks dim; the layers it already dims stay at one dim, never
dimmed twice. A defined channel that is active or related
turns to ink. The card fades in travelling `TRAVEL` from its mark
(`quick`, `standard`) and leaves the same way. A kept card's edge takes
its layer colour. The pins fade while a card is open. The cursor is a
pointer only while a mark is in reach. Each mark's own group owns its
opacity and the entrance animates the group around it, so the two never
write one property. All of it is CSS behind the motion switch
(BENTO_MOTION.md "Policy"), the atlas's existing layer, zoom and readout
transitions included; with motion off the ring, the dimming and the card
appear at once and lose nothing.

**Loading.** The meanings reach the browser after the first paint, through
`lazyModule` (`useExplain`), on the first idle moment or on the first
pointer or focus over the drawing. Until then a card shows its title,
which is already in the first bundle with the marks, their geometry and
their relations. `client-bundle.test.ts` keeps `explain.ts`, and the long
tables only it reads (`dreamspell-meanings.ts`, the engine's gate table),
out of every static client import graph.

## Public tools (T2)

`/map`, `/pair` and `/circle` are one component, `PeopleTool`, with a preset
count: one person, two, or up to `MAX_PEOPLE` (8). Each person is a
collapsible card with date, time, place and an optional name. Place search
runs on submit against Nominatim, never per keystroke, inside its usage
policy. A hit becomes a birth place through `birthPlaceOf`
(`src/lib/atlas/birth-input.ts`): town and country when the geocoder gives
them, the full line otherwise, made plain and clipped to `TEXT_MAX.place`
by `plainText`, so a long geocoder line never empties the form. Every field
the schema refuses (date, time, place, name, Hebrew name) shows its message
under that field once it holds a value.

With one person, the findings column leads with the same digest tiles
as the hero (`AtlasDigest`, one per row in the column's width) and the
readout table under them.

Compute is split by weight. Dreamspell, Tzolkin, the Long Count, numerology
and the data tables load with the page (`buildLightAtlas`); astrology and Human Design
load once from `src/lib/atlas/heavy.ts` through a memoised dynamic import,
after the input settles for `INPUT_SETTLE_MS`. `useDeferredCompute` exposes
idle, loading, ready and error, so every stage has a skeleton and an error
state; a compute that throws synchronously settles as an error like one that
rejects. The first date edit on a sample person clears that sample's time,
place and names, so a visitor's map never mixes in the sample's birth data.

A share link carries the people in `?p=` as base64url JSON: each person's id
and birth input, nothing else. It is validated on the server by
`BirthInputSchema` before anything renders, and refused when two people share
an id. A person's label is derived, never carried: `personLabel`
(`src/lib/atlas/person-label.ts`) gives the name, or "Person A" by position,
for both the decoded link and the tool's cards. A shared map is anyone's
input, so the server renders only its light layers (kin, Tzolkin day, life
path) and the browser computes astrology, Human Design and the ties; the
sample maps on `/map`, `/pair` and `/circle` are drawn in full on the server.
A circle of `n` people runs one engine pair reading per pair; the engine's
pair API casts both charts itself, so a circle of eight casts each chart
seven times until the engine accepts precomputed charts. The same schema
validates every typed birth: free text is capped (`TEXT_MAX`) and refuses
control characters. A link longer than the largest payload the schema can
accept (`MAX_SHARE_LENGTH`, computed from the schema's own limits) is refused
before it is decoded.

`useDeferredCompute` keys each computation by its input plus explicit `deps`
(the page's date, for one), so a change to anything the computation reads
reruns it.

## Board and pricing

`/today` reads `?d=YYYY-MM-DD` through the same date rule as a birth and
falls back to today. It is centred like the home sections: the day stepper,
the full calendar board from `getTodayAcrossSystems` with each row's drawing
from `todayFigures` (`src/lib/today-figures.ts`, server only, plain data to
the client), the day's kin with its oracle cross and the meanings the live
today page uses (`dreamspell-meanings`), and the morning brief in one line.
Stepping a day rolls the board's values the way the day moved. The board's
last tile spans what its row leaves (`lastSpan`, from the shape table and
the column counts held in `board.tsx`), so the board always ends square.

Home is cached for an hour, so its board says which UTC day it was computed
for (`BoardDay`), and once the visitor's UTC day has moved past it, links
to today's board instead of passing yesterday off as today.

`/about` leads its systems section with a figure built from the catalog and
the layer table (`SystemsFigure`; `LAYER_META.systems` says which systems
each layer draws): the four layers, the chart systems read beside the map,
the daily draws and the calendars, with a mark on each that needs a birth
time. Its tie weights are the home method chart (`BaseRateChart`), which
inside an article plays once on entering view instead of scrubbing.

Plan cards, the comparison ledger and every plan count derive from
`PLANS.limits` in `src/lib/site/plans.ts`. The system count is the set of
systems any plan lists (`CHART_SYSTEMS`); daily oracle draws are open to
everyone and stay out of the denominator. Paid plans are in-app purchases,
so a paid plan's button opens the store listing from `store-links.ts`, and
before a listing is live it opens the account. FAQ answers (`src/lib/site/
faq.ts`) read their counts from the same sources.

## Signed-in app (T9 to T12)

The app reads saved people through owner-scoped server functions in
`src/lib/atlas/app/owned.ts` (`routeId` validates an id, `ownedPerson`,
`ownedPeople`, `ownedCircle`), typed by the repositories' row contract
(`PersonRow`, `TagRow`), and turns a saved row into map input with
`src/lib/atlas/app/saved-person.ts` (`birthInputOf`, `atlasPersonOf`,
`atlasPeopleOf`, `missingOf`). Nothing in the app queries the database
another way. Stored text is made plain and clipped to the schema's limits
before parsing, and an unusable place label drops to null, so a long name
never hides a valid person. A read returns a Result: the input, or the field
the schema refused and its message (`issueLine`), which the person, pair and
circle pages show instead of a generic error; `atlasPeopleOf` returns the
readable people and the unreadable ones with their cause.

The app speaks the landing page's language, so a signed-in page and a public
one are built from the same parts:

| Part | Rule |
|---|---|
| Shell | One glass top bar (`site/top-bar.tsx`) for both trees. The site passes its tools and Sign in; the app passes the route group `app` as links, a Systems menu (group `app-systems`) and an account menu (name, group `app-account` (Settings), sign out). Palette, theme and motion sit in the bar. A link is current on an exact match for a group's root and on a segment-boundary prefix otherwise. Menus are `details` disclosures that close on Escape (focus returns to the summary), on a pointer down outside and on navigation. The app keeps `<main id="main">` and the site footer. |
| Heads | Every app page opens with the centred `Section` head at `h1`; actions, pickers and identity chips sit centred under it. A system page keeps its mural as a band above the same centred head. |
| Scenes | `PairScene`, `CircleScene`, `LayersScene` and the figure shell live in the kit (`src/components/bento-lab/scenes/`) with their own stylesheets. They take data, an optional `action` (`{ href, label }`) and make their DOM ids per instance (`useId`). Routes choose the data; the home and the app render the same scenes. |
| Figures | A figure is full width with its facts in a row under it. No app page sets a figure beside a readout: a person's map has its layer digest under it, a system page has its readout, plan gate and layer note in a row under its figure. |

| Page | Sections, top to bottom |
|---|---|
| `/app` | Your map (the account's own person, else the first readable one: the atlas with its digest row) · Every day (the board, filtered by the systems the account picked) · Your strongest tie (`PairScene` of the account's person and the person whose ties carry the most bits) · Your circle (`CircleScene` of the account's person and the people most tied to them, as many as the ring seats) · Your people |
| `/app/people` | Head, search, the people grid with pair and circle picking |
| `/app/people/[id]` | Head with identity chips · the map with its digest row · Taken apart (`LayersScene`) · Ties with your people (the strongest as a `PairScene`, the rest ranked) · Every system |
| `/app/pair/[a]/[b]` | Head with the pickers and swap · `PairScene` with its tie table · Centres they define together |
| `/app/groups`, `/app/groups/[id]` | Head, circles and the new-circle form · head, `CircleScene` with its heaviest pairs, members |
| System pages (T12) | Mural band and centred head with the person picker · figure · readout, plan gate and layer note in a row |

Pair readings are the expensive step (one reading is about 40 ms of engine
work). The app ranks people by their readings and assembles a full pair atlas
only for the winning pair; the account's own atlas is built once on the server
and reused. Readings run in the browser one at a time, yielding between pairs,
and are cached for the visit by both people's ids and birth inputs
(`loadPairReading`, `src/lib/atlas/load.ts`), so the dashboard, a person page
and a circle never read the same pair twice. A circle seats as many people as
their name labels fit around the ring without touching (`circleSeats`,
`atlas/circle-drawing.tsx`), and a circle reuses the readings it already has,
computing only the missing pairs. Every computed section shows a skeleton in
the figure's shape while it reads, and an empty state that names what to add.
"No saved people" and "saved people whose birth data cannot be read" are
different states with different actions.

The pair scene's sticky track holds only when the viewport is tall enough
for its frame; below that it lays out flat. A skip link before each scroll
scene jumps past it.

A system page opens on the person named in `?person=<id>` when that person
belongs to the account, then on the account's own person, then on the
first. Gated systems name the cheapest plan that opens them
(`planThatOpens` in `plans.ts`). A page that needs a birth time or place
reads the requirement from the system catalog (`requiresTime`,
`requiresLocation`) and asks for it instead of assuming a place. Settings
sends back the full notification record it read, so saving one switch
never resets the others.

Rows of a "today across the calendars" board, their labels and the
preference that shows each one live in `src/lib/today-rows.ts`, which
imports types only, so a client renders rows without loading the engine.
Shared look-up data sits with the layer that owns it: BaZi element colours
in `src/lib/design/bazi-elements.ts` (LabRoot sets them as `--el-*`
tokens), moon phase hints in `src/lib/data/moon-phases.ts`. The live pages
read the same modules.

Engine copy that joins clauses with an em dash is set as sentences at
display (`undash`) until the engine's text is rewritten at the source.

## Page order (home)

| # | Section | Job |
|---|---|---|
| 1 | Hero | Live atlas from a birth date |
| 2 | Layers | The map taken apart in depth, one layer per scroll step, the digest row under it |
| 3 | Two people | Both maps across the full width, ties drawn by rarity, the tie rows under them |
| 4 | Circles | The group ring across the full width, the heaviest pairs under it |
| 5 | Every day | One full-width board of the day, the morning brief in one line |
| 6 | Method | One full-width chart of measured base rates and the edge rule |
| 7 | Pricing | Plans from the plan table, the ledger under them |
| 8 | FAQ | `HOME_FAQ`, counts derived from plans and measured rates |
| 9 | Close | Portal artwork, one CTA |

Every section is centred: a full-width figure with its facts in a row under
it. No section is a left/right split or alternates sides, and that includes
the heads: `Section` stacks eyebrow, title and lead on the centre line on every
page, so a page head never sets its title against a lead in the other column.
Each one is built
against its motion storyboard (BENTO_MOTION.md "Storyboards"), and each
section's code lives in its own file under `src/app/lab/bento/(site)/_home/`.

## Primary action

A view's call to action is one component, `PrimaryAction`
(`src/components/bento-lab/site/action.tsx`), styled in `site.module.css`.
It follows the metic.studio button reel (BENTO_MOTION.md "Sources") in the
site's own tokens:

| Detail | Here |
|---|---|
| At least 44 px | 46 px regular. The small size is 36 px tall and its hit area reaches 44 px through a pseudo-element |
| Full pill, concentric | The disc is the pill's height less two insets, so pill and disc share a centre line and their curves stay parallel |
| A real typeface | The display face at weight 500 |
| One signal colour | The lantern at button size (BENTO_COLOR.md "The primary action"): the pill is `action` and its label and disc `onAction`, gold and night. On the dark theme the pill is the mark's gold with a night label; on the light theme it is night with a gold label and disc |
| The arrow turns | On hover and focus the icon turns over `turn` on `emphasized` |
| A light follows the pointer | A radial `actionGlow` light at the pointer, faded in over `quick` |
| It leans toward the pointer | `MAGNET`: a share of the pointer's offset, clamped |
| Press | `scale: var(--press-scale)` over `press` |

What the action does picks the icon, how far it turns and whether it
mirrors in right-to-left text, from one table (`INTENTS`): `forward` turns
its arrow up and on (−45°), `add` turns its plus a quarter, and `save`,
`send` and `out` keep icons that already point. Only icons that point along
the line (the arrows and the paper plane) mirror. A call site names its
intent, never an icon or an angle. Every attribute, handler and ref a link
or button takes reaches the element; the component composes its pointer
handlers after the caller's.

The light and the lean run only for a mouse, and only while motion is
allowed (`useMotionAllowed`): the component marks the pill `data-follow`
while both hold, and the light shows only then, so a touch's sticky hover
or a paused page never lights it. Both clear when the pointer leaves or is
cancelled, and when motion stops. The turn, the press and every
transition follow BENTO_MOTION.md "Policy": they run only while motion is
allowed, and hover turns the icon only where a pointer can hover. The pill
also moves a step toward its disc colour on hover and focus, a colour
change that stays with motion off, and the label says what the action does, so motion never
carries meaning alone. A disabled pill neither lights nor leans.

There is one primary action per section of a page, plus the one in the
nav; a figure's closing action is its section's. Every other action is a
quiet `.btn`, so the spark stays rare enough to read as the way forward.
Secondary buttons press by the same rule.

## Copy rules

From stop-slop (hardikpandya/stop-slop, MIT) and the taste-skill AI-tell
list (Leonxlnx/taste-skill, MIT), restated for this site:

1. Lead with the thing the user does or sees. No warm-up sentences.
2. Name specifics: the seal, the gate, the percentage. No vague claims about
   "deeper insight".
3. Active voice, a person as the subject. No objects doing human verbs.
4. No adverbs, no em dashes, no "not X, it's Y" contrasts, no three-item
   lists by reflex, no closing one-liners built to be quoted.
5. Banned words: elevate, seamless, unleash, unlock, journey, delve,
   tapestry, transform, empower, next-gen, cutting-edge, game-changer,
   holistic, synergy, revolutionary.
6. Every number on a page traces to the engine, the measured base rates or
   the plan table. A claim without a source is cut.
7. Read each block against five questions before shipping: is it direct,
   is the rhythm varied, does it trust the reader, does it sound like a
   person, is anything cuttable.

## Product film

The film is not on the home page: the live hero and the Layers scene show
the product directly. It remains available as a media asset (`PRODUCT_FILM`
in `src/lib/data/lab-media.ts`) for store listings and social use. It was
built with the shotcraft method (Vincentwei1021/video-shotcraft,
Apache-2.0): real screens captured at 2×, one camera move per shot, and
deterministic frames. It is rendered with Remotion to WebM and MP4 at
1600×1000. Capture, composition and render steps live in
`scripts/product-film/`, a standalone package outside the app's
dependencies.

## Wireframes

Greyscale, annotated, one per template, served at `/lab/bento/wireframes`
and exported to `docs/redesign/bento-lab/wireframes/site/`. The legend under
each wireframe is the slot contract the built page must fill.

## Acceptance

- Every route in the route table renders at 1440, 1100 and 390 with no
  horizontal scroll, in dark and light, and with reduced motion.
- Every internal link resolves inside the lab tree.
- The hero atlas redraws from a typed birth date with no network call.
- Signed-in pages show real saved people, with loading, empty and error
  states.
- Copy passes the copy rules; numbers pass the data-source rule.
- No call site styles its own solid button: `grep btnSolid` finds nothing,
  and every primary action is a `PrimaryAction` with an intent.
- Typecheck, lint and tests pass.

## Second opinion

| Reviewer | Scope | Date | Status |
|---|---|---|---|
| Codex CLI (gpt-5.5) | Architecture, route strategy, auth reuse, engine bundle, Atlas risks | 2026-10-11 | Incorporated |
| Codex CLI (gpt-5.5) | Middleware gate, redirect safety, share links, deferred compute, plan derivation, route contract | 2026-10-11 | Incorporated |
| Codex CLI (gpt-6-astra) | Signed-in app in the landing language: shell, scene ownership, dashboard compute bounds, motion and a11y | 2026-10-28 | Incorporated |
| Codex CLI (gpt-6-astra) | Atlas mark interactions: pointer mapping across browsers, ring turns, keyboard and tooltip model, opacity ownership, text equivalence, hit geometry | 2026-11-03 | Incorporated |
| Codex CLI (gpt-6-astra) | Digest in the lead order: the Long Count beside the map, two orders (structure and lead), catalog-derived names, tile grammar, hero claim | 2026-11-04 | Incorporated |
