# Bento Boards

The boards a day row or the kin tile opens: each calendar drawn as its own
tradition draws it, readable without knowing the tradition, and worked by
hand. This document is law for `src/lib/boards/*`,
`src/components/bento-v2/{day-board,board-calendar,board-mark}.tsx`, the
kin tile's board and the board colours. BENTO_V2.md ("Day rows and kin
tile") places the boards on the page; BENTO_TYPE.md ("The board") sets
their type; BENTO_COLOR.md ("Source colours") solves their colours.

## Problem class

Eleven calendars and counts, each a tradition with its own units, symbols,
colours and figures, shown in one card each. The population is every
system the day rows and the kin tile carry, and every system added later.
A board fails in one of three ways: it says less than the tradition does
(a month with no holidays, a Tzolk'in with no portals), it says it in a
shape the tradition never uses (a wavespell as a list of numbers), or it
says it in words a reader cannot follow without the tradition's book. The
holistic answer is one model of a board, where a tradition's units, its
figures, its categories and its colours are data the engine derives from
the tradition's own rules, and one component set that draws any of them,
explains every mark it draws, and lets a hand move through it.

## Sources

| Source | What it sets |
|---|---|
| The tradition's own rules and tables, per system ("Systems"), each cited in the engine table that holds it | Units, figures, categories, colours, dates |
| WAI-ARIA APG: Grid, Tabs, Toolbar patterns | The calendar as one tab stop with arrow keys; the views as tabs; legend and Next as toggle buttons |
| WCAG 2.2: 1.4.1 Use of colour, 1.4.11 Non-text contrast, 2.4.7 Focus visible | Colour never alone; marks and tints at 3:1; one visible focus |
| The data-visualisation method (bundled `dataviz` skill) | A legend that filters by pointing; highlight, never hide |

## The board

A board is plain data the server writes for a day (`DayBoard`,
`src/lib/boards/types.ts`) and the client draws (`DayBoardBody`). Every
calendar's board has the same skeleton, so a reader who learns one reads
them all: one place for what the day is, one for the controls, one stage
for the figure, one inspector for the cell in focus, then what comes next
and the facts.

### Wireframe

```
 ┌ board: an opaque sheet, one width for every calendar, its head washed ───┐
 │ MAST   ◯figure  17°  Scorpio                                    [ × ]   │
 │                      ▽ Water · Fixed · Feminine · ♂ ruled by Mars        │
 │        Transformation, intensity, depth.                                  │
 ├ BAR ─ ( Season │ Year │ Terms )                          ( ◎ Today )    ┤
 ├ STAGE ──────────────────────────────────┬ SIDE ──────────────────────────┤
 │ THE YEAR AHEAD  the day the Sun enters… │ IN FOCUS · today                │
 │                                         │  ♏  Scorpio                     │
 │          the view's cells               │     since Fri 23 Oct 09:38 UTC  │
 │   (grid · figure · wheel · ladder),     │     water, fixed, feminine      │
 │   centred; a wheel holds the focused    │ ─────────────────────────────── │
 │   cell's mark at its hub                │ NEXT  ●─ Term of Jupiter  2 d   │
 │                                         │       ●─ Decan III        3 d   │
 │ KEY  [▲ Fire] [▼ Earth] [● quarter] …   │       ●─ Sagittarius     13 d   │
 ├ FACTS ──────────────────────────────────┴─────────────────────────────────┤
 │ Element   ▽ Water      │ Exaltation  No planet    │ Decan   ☉ III, the Sun │
 │ Modality  Fixed        │ Detriment   ♀ Venus      │ Term    ☿ Mercury      │
 │ Ruler     ♂ Mars       │ Fall        ☽ Moon       │                        │
 └───────────────────────────────────────────────────────────────────────────┘
```

The board is one sheet width for every calendar: two measures for the
stage and the side's basis beside them (`--board-wide`, from
`--type-measure` and `--board-side`), or the window less the card's
margins where that is less. Switching calendars never resizes the sheet.
The stage and the side are a sidebar layout inside it, sized by their
content and never by a breakpoint: the side keeps its basis (a Next line
at the board's text size, `--board-side`, growing only where it stands
alone on its line), the stage takes the rest, and
where the stage would fall under half the board the side drops under it:
mast, bar, stage, key, inspector, next, facts, one column. The facts run
under both as a band, in as many columns of the side's basis as the sheet
holds, read down each column, so the stage and the side end near each
other and the sheet stays short. The bar stays in view as the board
scrolls.

### Regions

- **Mast.** What the day is, as the kin tile sets a kin: the calendar's
  name in capitals and its own script, the figure (the row's drawing, else
  the value's mark), the day's number in the calendar's own numerals, the
  value's name as a title over a line of words each led by its glyph, and
  what the tradition reads into it, two lines at most. The board's close
  button sits at its end; Escape and a press outside close it as well.
- **Bar.** The controls, wrapping where narrow: the views as a segmented
  control (`role="tablist"`, a roving tab stop, automatic activation: the
  arrow keys select the tab they reach, mirrored in right-to-left text; one
  view shows no control), and **Today**, which clears what is lit (a Next
  event, a pressed key) and moves focus to today's cell in the view shown.
  A view with no today (the Tzolk'in's oracle) marks it unavailable
  (`aria-disabled`, still focusable) and says why in its title. A tab is a short noun.
- **Stage.** The view shown, one mounted at a time: its name as the
  heading, its caption, then its cells, centred. The board's width holds
  across views; its height follows the view. The stage is the room its
  view measures against: a grid or a wheel wider than the room scrolls
  across in its own scroller, never the sheet's, and keeps its text's
  size. Under the cells, the **key**:
  the legend as chips that wrap across the stage, each its sign and its
  words; pointing at or focusing one lights the cells carrying its key,
  pressing it holds that.
- **Inspector.** The side's first part: the cell in focus in full. Today's
  cell at rest (the view's first where it has no today); the cell pointed
  at, focused, or lit by a Next event while that lasts. Its mark large, its
  first phrase as a title, the rest as lines, a chip when it is today. The
  board owns which cell that is (the calendar reports pointing and focus
  as they happen); the calendar keeps its own roving stop and keys.
- **Next.** What comes next, nearest first, as a timeline: each event its
  mark on a rail, its name, and how far off it is. An event that falls in
  a view's cells names that cell (`BoardEvent.at`, a view's `id` and a
  cell's `key`, unique in its view) and is an action button: pointing at
  or focusing it lights its cell where its view is the one shown (it never
  switches the view by hover), and pressing it shows that view and moves
  focus to the cell once the view is drawn. An event with no cell is
  words.
- **Facts.** Label and value, the value led by its glyph, ruled rows in
  the band's columns. The label column is as wide as the longest label
  (`--label-ch`), so values align down every column.

### Surface

A board's card is a sheet the window's height (less the card's
margins): a view, or the inspector following the pointer, changes what it
holds and never where it stands, so the tabs and Today never move under
the pointer. The facts follow the stage and the side, and what room is
left stays at the sheet's foot, never a gap between the parts; a board
taller than the sheet scrolls inside it, the bar held at its top. Where
the window has no anchor positioning, or is a phone's, the sheet docks
to the window's foot at the window's height less a gap above.

The card is the opaque surface variant of the fact card
(`surface="board"`, never inferred from its role): the page's surface with
its edge and shadow, no blur, the head washed in the row's colour
(`--tile`) over that surface as v2's art panels are, so nothing behind it
reads through the cells. Regions are set apart by the panel's own rules
(under the bar, over each part of the side, over the facts) and by the
gap between the stage and the side; the inspector alone is an inset,
since it is the one thing that changes as focus moves.

## Views

A view is cells in a layout, under heads, banded, keyed:

- **Layouts.** `grid` (a table: rows of `columns` under heads, a month in
  weeks, the Tzolk'in's 260), `figure` (a tradition's own diagram: few
  cells, each a tile placed where the diagram sets it), `wheel` (cells as
  the sectors of concentric rings) and `ladder` (one under another with
  their names beside them). "Figures" says which a tradition's figure is.
  A section places its cells one way, never both: in reading order after
  its blanks, or every cell where its figure sets it
  (`CalendarSection.places`, a row and column per cell key, from the
  section's top-left, no two alike). Placed rows are drawn as rows, the
  gaps as blank cells, so the grid's rows and indices hold for assistive
  technology.
- **Direction.** A view of a calendar that writes itself right to left
  (the Hebrew, Hijri and Persian months, years and portions) sets its
  cells in that order, as its own pages do: the first weekday at the
  right. The direction is derived from the calendar's locale
  (`Intl.Locale.getTextInfo`) on the server and carried as the view's
  `dir`; the arrow keys follow it. The view's name, caption and key keep
  the page's direction.
- **Heads.** Column heads (`heads`: the weekdays from the calendar's first
  weekday) and row heads (`rowHeads`: a Tzolk'in row's seal), each with its
  words and, where it has one, its mark. Heads are `columnheader` and
  `rowheader`; arrow keys skip them.
- **Bands.** A band groups cells under one name (a decan, a paksha, a
  castle, the Tzolk'in's mystic column). A band has a source colour where
  its tradition gives it one (`tint`, "Source colours"), else a step of the
  board's colour.
- **Keys.** Every mark, band and event kind a view draws has one legend
  entry, keyed (`LegendEntry.key`); a cell lists the keys it carries
  (`CalendarCell.keys`). The board's builder is the one authority on
  membership: it writes a cell's band, events and keys together, and a test
  holds every cell key to a legend entry and every entry to a cell. The
  legend is a toolbar (`role="toolbar"`, one tab stop, arrow keys between
  entries) of toggle buttons, one pressed at a time: pointing at or
  focusing an entry lights the cells that carry its key and quiets the
  rest, and pressing it holds that until it or another entry is pressed
  (`aria-pressed`); a pointed entry shows over a pressed one while pointed.
  A lit cell keeps its words; a quiet one keeps its place, its name and
  ink 3, never less.
- **Cells.** A cell carries its symbol, its numeral in the calendar's
  script, a name where the unit has one, the civil date it falls on, what
  happens in it, the keys it carries and its words in full (`said`, its
  accessible name). Days gone are dimmed; today is ringed with the status
  pulse and is the current date to assistive technology.
- **Readout.** A cell in full, its mark large, its first phrase as a
  title, the rest as lines: the board's inspector (BENTO_BOARDS.md "The
  board", "Inspector"), and at a wheel's hub the same cell again, compact
  and for the eye only, since the cell's name carries every word of it.
The calendar is one tab stop, an ARIA grid. The arrow keys move a cell at
a time in the direction pressed: left and right along the reading order,
drawn so the right arrow moves to the cell drawn on the right in either
direction of the page; up and down to the nearest column of the next row
in the section, past a section's edge to the nearest column of the next
section's edge row. A wheel keeps its own keys ("Figures", Wheel).
Home and End go to the row's ends, Control with them to the view's.

## Figures

A tradition draws its cycle one way, and a reader who knows the tradition
looks for that drawing: a wavespell is a U of thirteen kins, a zodiac a
wheel, a rashi chart a square of twelve houses, an Initial Series a double
column of glyph blocks, a gate a hexagram. A board's first view is that
figure, the unit the day stands in, and the stage on the page draws it
(BENTO_V2.md "The stage"). A figure is data like any view: the builder
places its cells and says its orientation from the tradition's source; the
calendar draws any of them from four layouts.

### The layouts a figure uses

- **Figure.** Tiles on a lattice (`places`). A tile is its mark two lines
  tall, a second mark over it where the tradition sets one there (`over`:
  a kin's tone in bar and dot over its seal, a period's coefficient over
  its name), its numeral and its name. A section whose cells are a course
  (`path`) joins them in the cells' order by a line through their centres,
  drawn under the tiles in the lattice's own units, so nothing is measured.
- **Wheel.** Each section is a ring, from the hub outward, the coarser
  division inside the finer, each ring named. A cell is a sector as wide
  as its share of its ring (`span`, in the ring's own measure; every cell
  of a ring says one or none does, and then the shares are equal). The
  view says where the turn begins and which way it runs (`wheel.origin`, a
  clock position; `wheel.turn`); a ring says where on the turn its first
  cell begins (`from`) and the view where today stands (`wheel.hand`), both
  in degrees along the turn from the origin, so the Rave Mandala's gates
  begin at 302°, gate 41's 2° of Aquarius from 0° Aries. The hand is drawn
  from the hub across every ring. One ring's cell is the day's place and
  is today's; the rings round it are its ground and say in their words
  where the Sun stands in them.
  - *Drawing.* The sectors are the drawing: they carry the cells' colours
    and states and take the pointer over their whole area. The cells stand
    upright at their sectors' centres and take focus; a cell shows its
    mark and its numeral where its sector's arc holds them, and a narrower
    one keeps its ground, its edge and its name. The hub holds the
    inspected cell, its mark two thirds of the square the hub holds.
  - *Geometry*, derived in slots (a line of the calendar's text and its
    cell's padding, the room one mark takes; `wheel.ts`): a ring is as
    thick as the lines its cells carry; a ring's inner radius is at least
    the circumference its cells' faces need, over 2π, and never inside the
    ring before it; the hub is at least the readout it holds. A wheel
    keeps the calendar's own line: in a room too narrow for it, it scrolls
    across, as a wide grid does.
  - *Keys.* Left and right go round the cell's own ring, the last cell on
    to the first, in the turn's order whatever the page's direction; up
    goes to the ring outside and down to the ring inside, at the nearest
    bearing, measured round the turn so its seam is no gap. Home and End
    go to the ring's ends, Control with them to the wheel's.
- **Ladder.** A cell whose mark is a hexagram's line draws it as the
  hexagram draws it: a bar the figure's width, broken where yin, so six
  cells one over another are the hexagram itself.

### Each tradition's figure

| System | Figure (first view) | As its source draws it | Source |
|---|---|---|---|
| Kin | The wavespell: a U of thirteen tiles on a five-by-five lattice, tone 1 at the top left, down to the overtone tower (5), across the foot to the solar tower (9), up to the cosmic gate (13) at the top right; each tile its tone in bar and dot over its seal's glyph, in its seal's colour; the gates and towers keyed, the pulsars keyed | Magnetic gate, overtone tower, solar tower, cosmic gate and nine chambers; the pulsars 1·5·9·13, 2·6·10, 3·7·11, 4·8·12 | Law of Time, *Thirteen Moons in Motion*; the Dreamspell kit's wavespell |
| Kin, oracle | A cross of five tiles: guide above, antipode left, analog right, occult below, the kin at the centre, each its tone over its seal | Fifth-force oracle | Law of Time tutorial |
| Sun | The zodiac as a wheel from 0° Aries at nine o'clock, counter-clockwise (the natural wheel, a chart with Aries rising; a convention of chart drawing, not of the dignities' sources): the twelve signs, outside them the thirty-six faces under their Chaldean rulers, outside those the sixty Egyptian terms at their unequal widths; the hand at the Sun's longitude | The natural wheel (Aries rising at the left); faces in descending Chaldean order from Mars; terms of five planets | Ptolemy, *Tetrabiblos* I.20–21; astro.com on the faces |
| Sidereal | The rashi chart, South Indian: a four-by-four square, the twelve rashis fixed round its edge, Mesha second from the left in the top row, clockwise, the middle open; the Sun's rashi is today's. It fixes signs, not houses: the board draws no ascendant | The fixed-sign chart of the south | Wikipedia, "Kundali (astrology)" |
| Sidereal, nakshatras | A wheel: the twelve rashis, outside them the twenty-seven nakshatras, 13°20′ each from 0° Mesha, the two rings joining at Mesha, Simha and Dhanu; the hand at the Sun's sidereal longitude. Mesha begins at the top, clockwise, as the chart runs; the tradition fixes no wheel orientation | 27 × 13°20′; joints at Mesha, Simha, Dhanu | Brihat Parashara Hora Shastra 4 |
| Gate | The hexagram: the gate's six lines as a ladder of bars, the sixth on top, each solid or broken, by its name and the day the Sun reaches it | Lines numbered from the bottom, drawn from the top | Jovian Archive |
| Gate, mandala | The Rave Mandala as a wheel: the twelve signs, outside them the sixty-four gates in the wheel's order from gate 41 at 2° Aquarius, 5°37′30″ each, each its hexagram and number, the four quarters banded; the hand at the Sun. Turned as the zodiac wheel is (Aries at nine o'clock, counter-clockwise), the board's choice: no source read fixes the printed mandala's turn | Signs inside, gates outside; quarters from gates 13, 2, 7, 1 | Ra Uru Hu's Rave Mandala; Jovian Archive |
| Long Count | The Initial Series, abbreviated: a double column read in pairs, left then right, down: b'ak'tun, k'atun; tun, winal; k'in, the Tzolk'in day; the Lord of the Night, the Haab' day; each block its coefficient in bar and dot over its name, the Tzolk'in block its day sign; the Lord of the Night is named G1 to G9 and carries no coefficient | A stela's Initial Series after the introducing glyph: the five places, the Tzolk'in, glyph G, the Haab' (the Lunar Series between is left out: the engine holds no table for it) | Pitts, *Maya Numbers and the Maya Calendar* (FAMSI); Kettunen and Helmke (2020) |
| Moon | The lunation as a wheel of its days, each sector the Moon's face at noon, from the New Moon at the top, counter-clockwise as the Moon goes round the Earth seen from the north; the hand at today | No single canon: the orbit diagram's direction | NASA, "Moon Phases" |
| Chinese | The solar year as a wheel: the twelve solar months by their branches (30° of the Sun each, from one sectional term to the next; the lunar months, of unequal length, are the Month view's), outside them the twenty-four solar terms, 15° each, tinted by season; the winter solstice at the foot, in the middle of the 子 month, the summer at the top, clockwise, as the south-up compass sets the branches, the board's choice of that convention; the hand at the Sun, set between the term in force and the next by the days gone | 子 north, 午 south, south at the top; 冬至 in the 子 month | Hong Kong Observatory; the twenty-four-direction compass |
| Chinese, sixty | Six rows of ten, a row a 旬 opening on a 甲 year, a column a stem | 六甲 | Wikipedia, "Sexagenary cycle" |
| Hebrew, Hijri, Persian, Panchang | The month in weeks, as their printed pages set it (right to left where the script runs so); the Persian day names and the Panchang's nakshatras as wheels | Luach, taqwim, panchang month pages | Chabad and Hebcal month views; Drik Panchang |

Where a source fixes no orientation (the nakshatra wheel, the lunation's
ring), the board keeps the one its tradition's neighbouring figure uses
and the view's caption does not claim it as canon. Element colours on the
zodiac (fire red, earth green, air yellow, water blue) are the modern
print convention, named as such in the key.

## Source colours

A tradition's colours are its own: Dreamspell's red, white, blue and
yellow seals and green castle; the elements' fire, earth, air and water;
the Chinese five phases; the bright and dark halves of the Hindu month.
A category keeps its own identity in data (the seal's colour, the sign's
element); its tint is presentation, a `Tint` from one closed set of source
colours (`red`, `yellow`, `green`, `blue`, `white`, `black`) that its
engine table maps it to. The four chromatic tints are solved per theme as a
categorical set (BENTO_COLOR.md "Source colours"); `white` and `black` are
the neutral extremes, told apart by form wherever they are drawn (white an
outlined ground, black a filled one). A tint colours marks, swatches, cell
grounds and cell edges; text never wears one, and a tinted ground keeps the
cell's ink at 4.5:1. In forced colours a tint gives way to the system's
colours and the form remains. Where a board has no source colours its bands
are steps of its own colour. A source colour outside the set is drawn as
its nearest tint and named in the legend: the Chinese wood's blue-green
(青) is the green tint, the phase's character carrying it.

## The kin's board

The kin tile opens the day's kin board as a day row opens its calendar's,
through the same disclosure (`useBoardDisclosure`): the kin's number, name
and wavespell are the opening button, the tile's pill and glyph stay
outside it. The board is built with the day's others (`todayBoards.kin`)
and carried by the kin's row (`kinRow`, assembled as `dayRows` assembles
its rows). The engine owns the kin's relations, portals, cycles and dates;
the board's builder owns its views, places and words.

- **Mast.** The seal's glyph; the kin's number; "Blue Planetary Eagle"
  (colour, tone, seal) over the tone's and the seal's words, each led by
  its mark (bar-and-dot, glyph), and the wavespell's day; the meaning is
  the Dreamspell affirmation's five lines as three sentences
  (`generateMantra`).
- **Wavespell** (unit, figure). The thirteen kins of the wavespell on its
  U ("Figures"), joined in their order: each its tone in bar and dot over
  its seal's glyph, its seal's name and its civil date, tinted by its
  seal's colour; the gates (1, 13) and towers (5, 9) keyed; each keyed by
  its pulsar (time
  1·5·9·13, life 2·6·10, sense 3·7·11, mind 4·8·12: a tone's remainder by
  four, `tonePulsar`), portal days dotted. The caption is the wavespell's
  question.
- **Tzolk'in** (view, the harmonic module). Thirteen columns of twenty as
  Dreamspell lays them (`modulePlace`: column ⌈k/20⌉, row the seal), each
  row headed by its seal's glyph in its colour, each cell the kin's number
  tinted by its seal; the fifty-two galactic activation portals dotted;
  the mystic column (kins 121–140) keyed. Its cells are numerals alone,
  so they take their figures' width at the note's size and the module
  keeps to a phone's card.
- **Oracle** (view, figure). The fifth-force oracle (`oracleKins`): guide
  above, antipode left, analog right, occult below, the kin at the
  centre; each its tone over its seal's glyph, its kin, its role and its
  name, tinted;
  the legend says each relation's rule (same colour set by the tone; ten
  seals across; seals summing to nineteen; to twenty-one, tones to
  fourteen).
- **13 Moon** (view). The month the day falls in: four heptads (red,
  white, blue, yellow) under the seven radial plasmas, each head saying
  its centre (`PLASMA_CENTRES`); each day its kin's glyph, its day of the
  moon and its civil date, tinted by its seal. The view steps aside on
  0.0 Hunab Ku and the Day Out of Time, which stand outside the moons.
- **Dates.** A kin's civil date in the spin comes from the engine's count
  (`spinDates`: the 260 counted days from kin 1, 29 February outside the
  count and keeping the 28th's kin).
- **Next.** The next galactic activation portal, wavespell, castle (a new
  spin at kin 1), 13-Moon month and the Day Out of Time, nearest first;
  each points at its kin on the module where it falls in this spin.
- **Facts.** Seal (power, action, essence), tone (power, action), colour
  (action, direction), wavespell, castle (colour, direction, court), earth
  family (centre, digit), clan, pulsar, harmonic, 13-Moon date, plasma
  (centre), portal.
- **Tested** against 13.0.0.0.0 (21 December 2012): kin 207, Blue Crystal
  Hand, day 12 of the Yellow Warrior wavespell in the Yellow Southern
  Castle of Giving; oracle 259 / 12 / 77 / 54; Core family, Blood clan;
  Rhythmic Moon 9, Seli.

## Systems

Per system: its units and figures, its categories and tints, its Next and
its Facts, and the engine table each comes from. A rule the engine derives
is tested against the tradition's published values, never against itself.

| System | Views | Bands and tints | Source |
|---|---|---|---|
| Kin | Wavespell (figure) · Tzolk'in · Oracle (figure) · 13 Moon | Seal colour (red, white, blue, yellow); heptads; pulsars; portals; mystic column | Argüelles, *Dreamspell* (1990) and *Synchrogalactic Yoga*; Law of Time; Dreamingbones tables for families and clans |
| Hebrew | Month · Year · Parasha | Shabbat and Yom Tov red; Yamim Noraim, the Omer, the Three Weeks and Hanukkah banded; the Torah's five books | Hebcal (hebcal.com, CC BY 4.0) for 5786–5788; Rambam, *Kiddush HaChodesh*; Shulchan Aruch OC 428, 685; Sefer Yetzirah (Gra) 5 |
| Hijri | Month · Year | White days, last ten nights, first ten days and Tashriq banded; sacred months and Ramadan banded in the year | Umm al-Qura (ICU `islamic-umalqura`); Qur'an 9:36, 2:203 |
| Persian | Month · Year · Day names | Fridays and public holidays red; seasons banded; the four weeks of the day names banded | Iran's official calendar (ICU `persian`); Boyce and *Encyclopaedia Iranica* for the day and month dedications; the ephemeris for the Tahvil |
| Gate | Lines (the hexagram) · Mandala (wheel) · Colours · Centre | The four quarters of the Rave Mandala banded; left and right tones banded; no source tints | Ra Uru Hu's Rave Mandala (gate 41 at 2° Aquarius, 302°), dated against the Swiss Ephemeris; Jovian Archive on substructure; two published godhead listings; Chrysalis, "HD101: The Human Design Circuits" |
| Long Count | Series (figure) · Winal · Tzolk'in · Haab' | Wayeb' and today's trecena banded; period endings, 0 Pop and 819-day stations marked; no source tints | GMT correlation 584283; Kettunen and Helmke, *Introduction to Maya Hieroglyphs* (2020); Wikipedia's Haab' and Maya calendar articles (ALMG names, year bearers); MacLeod and Kinsman (2012) after Thompson on the 819-day count |
| Sun | Zodiac (wheel) · Season · Terms | The three faces banded; each day under its term's planet; the signs tinted by element (fire red, earth green, air yellow, water blue, the modern convention) | Ptolemy, *Tetrabiblos* I.12–20 (Robbins, Loeb 1940); Dorotheus, *Carmen Astrologicum* I.1; Lilly, *Christian Astrology* (1647); USNO and NASA for the equinoxes and solstices |
| Sidereal | Chart (figure) · Month · Nakshatras (wheel) | The nakshatras banded over the rashi's days; each day under its drekkana's lord; the rashis banded by tattva; the nakshatras keyed by Vimshottari lord; no source tints | Brihat Parashara Hora Shastra 4, 6, 46; Lahiri ayanamsa; Drik Panchang for the Sankrantis and the Sun's nakshatra entries |
| Chinese | Year (wheel) · Month · Animals · Sixty | Each day and year tinted by its stem's phase (wood green, fire red, earth yellow, metal white, water black); the terms banded by season, each in its phase's tint; principal terms, terms and festivals keyed; yang a solid line, yin a broken one | The Purple Mountain Observatory's rule (GB/T 33661-2017); the Hong Kong Observatory's Gregorian-Lunar conversion tables (2025–2028, 2033); Wikipedia for the stems, branches, five phases, terms and festivals; astronomy-engine (Cross, MIT) for every new Moon and term |
| Panchang | Tithis · Month · Nakshatras | The pakshas white and black; kshaya and vriddhi tithis keyed; Ekadashi, Purnima, Amavasya, Sankranti and Vishti keyed; the nakshatras banded by Vimshottari lord | Surya Siddhanta 1.62 (Ujjain); Drik Panchang (Ujjain) for 2026; Wikipedia for the tithis, yogas, karanas and lunar months; Brihat Parashara Hora Shastra 46; Lahiri ayanamsa; astronomy-engine for the sunrise and every instant |
| Moon | Lunation (wheel) · Year · Two months | No source tints: the Moon's face is the mark; quarters, sign entries, apsides, supermoons and eclipses keyed | USNO for the quarters; NASA (Espenak) for the eclipses and supermoons; lunaf.com for the apsides; astronomy-engine (Cross, MIT) for every instant |

### Hebrew

The engine (`hebrew-calendar.ts`, `parasha.ts`, `data/hebrew-holidays.ts`,
`data/hebrew-months.ts`, `data/parashot.ts`) owns the year, its keviah and
cycles, the holidays with the rules that move them, the eves, Rosh Chodesh,
the molad from BaHaRaD, the Omer and the readings; the builder
(`src/lib/boards/hebrew.ts`) the views and words. Days are kept as in
Israel; where the diaspora keeps a day otherwise (a second festival day,
Simchat Torah on its own day, another week's portion) the cell names it,
keyed `diaspora`.

- **Month** (unit). The month in weeks from Sunday: each day its Moon, its
  numeral in letters and its civil date; Shabbat titled by its portion (or
  the festival read in its place) and tinted red with each Yom Tov; holidays
  keyed by kind (Yom Tov, Hanukkah and Purim, fasts, minor days, the State's
  days); eves on the day before; Rosh Chodesh, both days where it has two;
  the molad on its day; the named Shabbatot and Shabbat Mevarchim. The
  seasons are bands; on a red day a band is carried as a key, so the tint
  shows (`ground`, `months.ts`).
- **Year**. The months, each under the sign Sefer Yetzirah (Gra version
  5:1–10) sets over it, its letter and faculty in its words; the holidays'
  first days. The caption gives the keviah (`זשה`: Rosh Hashanah's weekday,
  the year's kind, Pesach's weekday) and the year's length.
- **Parasha**. The fifty-four portions in five sections banded by book;
  each its date this cycle, the pairs joined this year and the portions the
  diaspora reads on another Shabbat keyed; the week's portion ringed.
- **Next.** Holidays' first days, eves, Rosh Chodesh, the molad and the
  week's portion, nearest first, six.
- **Facts.** The year in letters, the keviah and length, the year of the
  nineteen and of the shmita, the coming month's molad as announced, the
  week's portion (the diaspora's where it differs), the Omer's day and its
  sefirot, Sefer Yetzirah's month.

The portions are derived without tables of years: Tzav (Metzora in a leap
year) before Pesach, Bamidbar before Shavuot, Devarim before the 9th of Av
and Nitzavim before Rosh Hashanah hold the year; each stretch between them
joins as many pairs, in the customary order, as it is short of Shabbatot.
The derivation matches Hebcal in both reckonings for 5746–5834.

### Hijri

The engine (`hijri-calendar.ts`, `data/hijri-months.ts`) reads each month
by its number from Intl's `islamic-umalqura`, never by its name; the
builder (`hijri.ts`) writes the board.

- **Month** (unit). The month in weeks from Sunday, each day its Moon and
  Arabic numeral; Fridays marked in their head and cells (Jumuʻah); the
  white days (13th–15th), the last ten nights of Ramadan, the first ten
  days of Dhu al-Hijjah and the days of Tashriq banded; a night (Laylat
  al-Qadr, the Night Journey, Mid-Shaban) marked on the evening it begins.
- **Year**. The twelve months by their Arabic names and what the names
  mean; the four sacred months and Ramadan banded; each month's days.
- **Next.** The next month, the next white days and the year's days,
  nearest first; a month begun by sighting the crescent (Ramadan, Shawwal,
  Dhu al-Hijjah) and its days are expected, set by sighting.
- **Facts.** The year AH, the month and its meaning, whether it is sacred,
  the reckoning (Umm al-Qura), the day beginning at sunset.

### Persian

The engine (`persian-calendar.ts`, `data/persian-days.ts`) owns the months
by number, the thirty Zoroastrian day names, the jashns, the year's feasts,
Chaharshanbe Suri and the Tahvil; the builder (`persian.ts`) the board.

- **Month** (unit). The month in weeks from Saturday, each day its Persian
  numeral and its Zoroastrian name; Fridays and public holidays red; the
  feasts, the jashn, the evening feasts from sunset and the Tahvil (with
  the Sun's glyph) on their days.
- **Year**. The months under their signs from Aries, by their Persian
  names, each its patron yazata, its Dari name and its feasts; the seasons
  banded.
- **Day names** (wheel). The thirty names round a wheel, banded in the four
  weeks each opened by a day of Ahura Mazda, the month's jashn keyed.
- **Next.** The next month, the feasts and jashns and the Tahvil, nearest
  first.
- **Facts.** The year AP, the month and its patron, the day's name, the
  season, the Dari month, the Tahvil in Tehran time.

The day names are read onto the civil days 1 to 30 of each month, the
reading under which Mehregan falls on 16 Mehr and Tirgan on 13 Tir as Iran
keeps them; the 31st of the first six months has no name. The Tahvil is
the March equinox from the ephemeris (astronomy-engine `Seasons`) in Iran
Standard Time, UTC+3:30. The lunar religious holidays Iran sets by its own
sighting are not on this board: the engine reckons the Hijri months by Umm
al-Qura, which can differ from Iran's by a day.

### Gate

The engine owns the wheel and its tables: `data/human-design-gates.ts`
(the mandala from gate 41 at 302°, `wheelPlace` down to the base,
`oppositeGate`), `data/human-design.ts` (the quarters with their godheads,
the line's colours and tones), `data/human-design-channels.ts` (the seven
circuits, `harmonicsOf`), `calculations/sky-dates.ts` (`gateChanges`,
`gateLines`) and `calculations/hd-wheel.ts` (`sunEntersGate`, the Rave
New Year, the next quarter). The builder (`src/lib/boards/gate.ts`) writes
the board. The Sun is read at noon UTC on the tropical zodiac; the Earth's
gate is the one across the wheel, sharing the Sun's line, colour, tone and
base.

- **Lines** (unit, ladder). The Sun's gate's six lines, top line first as
  its hexagram is drawn, each yin or yang, by name, with the day the Sun
  reaches it; today's line with its colour, tone and base at noon. Under
  them the harmonic gates: each gate across a channel from the Sun's gate
  or the Earth's, keyed by the body it answers, with the channel the two
  complete and its circuit. Where the Sun's and the Earth's gates are one
  channel's two ends (43-23 and 34-20 in a Rave year), neither is listed as
  the other's harmonic; Facts names the channel.
- **Mandala** ("The Rave Mandala", wheel). The twelve signs and, outside
  them, the sixty-four gates in the wheel's order from gate 41
  ("Figures"); each gate its hexagram,
  its quarter and godhead and where it opens, to the arcsecond (gate 19
  from 7°37′30″ Aquarius). The Sun's gate, the Earth's and the harmonic
  gates keyed; the quarters banded; the gate the Sun reaches next, the next
  quarter's Sphinx gate and gate 41 at the Rave New Year carry their
  events. The Rave year runs from gate 41, so the gates before the Sun's
  in it are past.
- **Colours**. Today's line as its thirty-six colour and tone places, six
  colours by six tones: each colour headed by its motivation and
  determination, each tone by its cognition; tones 1–3 (left) and 4–6
  (right) banded; noon's place is today.
- **Centre**. The gates of the Sun's centre, and the Earth's where it is
  another, each with its channels to the gates across them.
- **Next.** The next line, the next gate where the next line does not open
  it, the next quarter and the Rave New Year, nearest first, each lighting
  its cell.
- **Facts.** The Sun's and the Earth's gates and line, the line's name,
  the colour (motivation, determination), the tone (cognition, side), the
  base, the centre and channels, the channel the Sun and the Earth complete
  between them where they do, the harmonic gates and their circuits, the
  quarter, the godhead, the trigrams and the Gene Key.

The board has no source tints. The bodygraph's customary centre colours
include brown, which is not in the closed `Tint` set, so the centres carry
their names alone. The quarters and tone sides are bands in steps of the
board's colour.

Sources, each tested in the engine: the Rave New Year and the quarters'
Sphinx gates dated against the Swiss Ephemeris (`hd-wheel.test.ts`); the
substructure sized as Jovian Archive gives it ("The Basics of Substructure
in Human Design": a colour 9′22.5″, a tone 1′33.75″, a base 18.75″); the
sixteen godheads as two listings give them, agreeing gate for gate
(thehumandesignsystem.com, barneyandflow.com: Hades holds gates 1, 43, 14
and 34); the circuits as Chrysalis lists them: Knowing 9 channels,
Centering 2, Integration 4, Understanding 7, Sensing 7, Ego 5, Defense 2,
with the Brainwave (57-20) in Knowing and Exploration (34-10) in Centering
(`data/human-design.test.ts`).

### Long Count

The engine owns every count, read from the era base 13.0.0.0.0 4 Ajaw
8 Kumk'u by the GMT correlation (584283, 13.0.0.0.0 on 21 December
2012): `long-count.ts` (the places, the Haab' day, the Haab' year and its
bearer, the period a day ends), `tzolkin.ts` (the day by its count of days,
its place in the 260, its trecena), `lords-of-night.ts`,
`eight-nineteen.ts` and `data/haab-months.ts`. The builder
(`src/lib/boards/long-count.ts`) writes the board. Names are in the ALMG
orthography the day signs keep: the Haab' months as Wikipedia's Haab'
article sets them after Kettunen and Helmke (Pop, Wo', … K'ank'in, …
Kumk'u, Wayeb'), the places K'in, Winal, Tun, K'atun and B'ak'tun (Piktun
above, a modern name).

- **Mast.** The count (13.0.14.1.10), the Calendar Round as its title
  (4 Ok 3 Keh), the days since the era base, the day sign by its glyph and
  gloss, and the Lord of the Night.
- **Winal**. The twenty days of the winal, two rows of ten from its
  Ajaw: each its day sign's glyph, its Tzolk'in number and sign, and its
  Haab' day; the readout adds the civil date, the count and the Lord of
  the Night.
- **Tzolk'in**. The 260 from 1 Imix to 13 Ajaw in thirteen columns of
  twenty consecutive days, a row per day sign headed by its glyph and name
  (the four that bear years say so); each cell the day's number alone, so
  it keeps to a phone's card as the kin's module does. Today's trecena is
  banded.
- **Haab'**. The year the day falls in, from 0 Pop: a row per month (its
  name; its Classic Mayan reading and its colonial Yukatek spelling in its
  words), each cell the day's number in the month, 0 the month's seating;
  Wayeb''s five days banded. Its name gives the year's bearer.
- **Series** (unit, figure). The Initial Series ("Figures"): the places as
  bar-and-dot numerals from the b'ak'tun, each with its span in days and
  the day it next turns, then the Tzolk'in day, the Lord of the Night and
  the Haab' day. The k'in is today's cell.
- **Days marked** in every view where they fall: a period ending (a tun,
  k'atun or b'ak'tun completed), 0 Pop with its bearer, a station of the
  819-day count; Wayeb' banded.
- **Next.** A new winal, the next trecena, the next 819-day station,
  Wayeb', the Haab' new year and its bearer, and the tun, k'atun and
  b'ak'tun, nearest first; each lights its cell in the first view that
  holds its day.
- **Facts.** Days since creation; the Tzolk'in day, its gloss and its place
  in the 260; the trecena; the Haab' day, its Classic reading and its place
  in the 365; the year bearer and its 0 Pop; the Lord of the Night; the
  day of the 819-day count and its last station; the correlation.

The board has no source tints. The four directional colours the day signs
cycle through and the direction and colour of each 819-day station are
left out: the engine holds no table for them checked against a published
source. The Haab' months carry their names alone; their glyphs are not in
the public sets.

Sources, each tested in the engine against its published values:
Kettunen and Helmke, *Introduction to Maya Hieroglyphs* (Wayeb, 2020),
p. 52, the twenty days from 9.9.0.0.0 3 Ajaw 3 Sotz' with their Lords of
the Night (`long-count.test.ts`, the board's winal for 10 May 613 in
`src/lib/boards/long-count.test.ts`), p. 51, the Haab' numbers each day
sign can stand on, and Tables VIII, XII–XIII; Wikipedia's Haab' and Maya
calendar articles for the ALMG month names and the Classic year bearers
(Ik', Manik', Eb', Kab'an on 0 Pop); MacLeod and Kinsman, "Xultun Number
A and the 819-Day Count" (*Maya Decipherment*, 2012), after Thompson, for
the 819-day count's base station 12.19.19.17.17 1 Kab'an 5 Kumk'u and the
Palenque Temple XIX station 12.9.19.14.5 1 Chikchan 18 Ch'en
(`eight-nineteen.test.ts`).

### Sun

The engine owns the dignities (`data/zodiac-signs.ts`: the traditional
rulers, the exaltations at their degrees, detriment and fall, the
triplicity lords, the genders; `data/terms.ts`: the Egyptian terms) and the
sky's instants (`calculations/sky-events.ts`: the Sun at a longitude, the
equinoxes, solstices and cross-quarters, each to the minute); the builder
(`src/lib/boards/sun.ts`) the board. The lords are Hellenistic: the ruler
is the traditional one, the modern one named beside it where they differ.

- **Season**. The sign's days in weeks, each the Sun's degree at its
  noon UTC, led by the planet whose term holds that degree and keyed by
  the term; the three faces banded under their Chaldean rulers; the
  ingress and a cross-quarter on the first day whose noon finds the Sun
  past them, each timed in UTC. An equinox or solstice is the ingress
  itself and is named once.
- **Zodiac** (unit, wheel). The twelve signs from Aries, each its glyph,
  the day the Sun enters it, its element, modality, gender, ruler and
  exaltation, and the turning of the year it holds, tinted by element;
  outside them the thirty-six faces and the sixty terms, each keyed by its
  lord, so a planet's key lights everything it rules.
- **Terms**. The sign's five terms as a ladder, each its planet, its
  degrees and the days the Sun holds it.
- **Next.** The next term and face in the sign, the next two ingresses (one
  at an equinox or solstice named as it), and the next turning not already
  named, nearest first.
- **Facts.** Element, modality, polarity, ruler, exaltation, detriment,
  fall, triplicity, decan, term, and the ingress that began the season.

The cross-quarters are the Sun at 15° of the fixed signs, the midpoints in
longitude between the equinoxes and solstices; they are derived, and
almanacs that date them by the midpoint in time differ by a day or two.

### Sidereal

The engine owns the rashis (`data/rashis.ts`: names, Devanagari, lords,
drekkanas, navamsas), the nakshatras (`data/nakshatras.ts`) and the Lahiri
ayanamsa (`ayanamsa.ts`); the builder (`src/lib/boards/sidereal.ts`) the
board.

- **Month**. The Sun's month in its rashi, as India's solar
  calendars keep it, in weeks from Sunday: each day its degree at noon UTC,
  led by its drekkana's lord and keyed by the drekkana; the nakshatras it
  crosses banded, each with its deity and Vimshottari lord; the Sankranti on
  the first day whose noon finds the Sun in the rashi.
- **Chart** (unit, figure). The twelve rashis as the South Indian chart
  fixes them ("Figures"), by their Sanskrit names, in Devanagari, each the
  day of its Sankranti, its lord and tattva; Makara and Mesha Sankranti
  marked as the festivals they are kept as.
- **Nakshatras** (wheel). The twelve rashis and, outside them, the
  twenty-seven nakshatras from Ashwini, each led by its Vimshottari lord
  and keyed by it, with the day the Sun enters it.
- **Next.** The next drekkana in the rashi, the next nakshatra, and the
  next three Sankrantis, nearest first.
- **Facts.** The ayanamsa and its value, the rashi, its lord and tattva,
  the drekkana, the navamsa, the nakshatra and pada, its deity and lord,
  and the Sankranti that began the month.

A Sankranti and a nakshatra's entry are dated in India Standard Time, as the
almanacs date them, and not timed: the engine's Lahiri ayanamsa is a mean
rate (50.29″ a year from 23.85° at J2000), which puts the instants up to
about forty minutes from Drik Panchang's true ayanamsa. The observed
festival day follows the almanac's sunrise rule and can be the day after
the Sankranti.

### Moon

The engine owns the instants (`calculations/sky-events.ts`: the quarters,
perigees and apogees with their distances, the Moon entering a sign, the
eclipses and their kinds, the supermoons by Nolle's definition as Espenak
reckons it) and the lunation (`sky-dates.ts`); the builder
(`src/lib/boards/moon.ts`) the board.

- **Lunation** (unit, wheel). The lunation's days round a wheel from the
  New Moon ("Figures"), each the Moon's face at noon UTC and its civil
  date; on the first day whose noon holds them,
  the quarters, the signs the Moon enters, the perigee and apogee with
  their distances, the supermoons and the eclipses, each timed in UTC.
- **Year**. A lunar year of lunations from the one the day stands in, each
  named by the sign its New Moon falls in, with its New and Full Moons,
  its length, its supermoons and its eclipses.
- **Two months**. This civil month and the next, every day its face and
  events as in the lunation.
- **Next.** The four quarters, the Moon's next sign, the next apsis and
  the next eclipse, nearest first, each timed.
- **Facts.** Lit fraction, age, the Moon's sign, its distance at noon UTC,
  the New Moon that began the lunation, and the lunation's length.

The Moon has no source colours; its face is its mark.

### Chinese

The engine owns the calendar (`calculations/chinese-calendar.ts`: the
months, the leap month, the solar terms, the festivals' days, the new
year), the one table of stems and branches (`data/sexagenary.ts`, read by
`calendars.ts` for the years and `bazi.ts` for the pillars), the terms
(`data/solar-terms.ts`), the months' and days' names and the festivals
(`data/chinese-months.ts`) and the five phases (`data/wuxing.ts`), every
date in Beijing; the builder (`src/lib/boards/chinese.ts`) the board.

- **Month**. This lunar month and the next, each in its three
  decades of ten days (上旬, 中旬, 下旬 heading the rows): each day the
  Moon's face at noon in Beijing, its day as written (初一 to 三十), its
  stem and branch and its civil date, tinted by its stem's phase; the solar
  terms and the festivals on their days. A leap month is written with 闰
  before the month it repeats.
- **Year** (unit, wheel). The twelve solar months by their branches and,
  outside them, the twenty-four terms of the solar year from Lichun
  ("Figures"),
  each its characters, pinyin, the Hong Kong Observatory's English name and
  its day; banded by season, each season in its phase's tint (spring wood,
  summer fire, autumn metal, winter water); the principal terms keyed; a
  sectional term names the solar month it opens.
- **Animals**. The twelve years of this turn of the animals, each its
  characters, animal and Gregorian year, tinted by its stem's phase.
- **Sixty**. The sixty in six rows of ten, a row a 旬 opening on a 甲
  year, a column one stem; each year
  tinted by its stem's phase, its polarity a solid (yang) or broken (yin)
  line.
- **Next.** The next month, the next two terms, the next festival and the
  new year, nearest first; the first month's first day is said once, as
  the year.
- **Facts.** The animal, the element and its character, the polarity, the
  new Moon the year began on, the lunar date, the term in force, and the
  day's and the month's stems and branches.

Months begin on the day of the new Moon in Beijing; the eleventh holds the
winter solstice; of thirteen months from one eleventh month to the next,
the first holding no principal term is the leap month. Every new Moon and
term is an instant from astronomy-engine dated on its Beijing day, so a
new Moon minutes either side of a Beijing midnight (2027's, at 23:56) falls
on the almanac's day; a day keeps the term it reaches by its end. The
derivation matches the Hong Kong Observatory's tables month by month and
term by term for 2025–2028 and 2033, their leap sixth, fifth and eleventh
months among them, and the Spring Festival from 1954 to 2034 where tested.
The four pillars' months and years turn on the same Beijing-dated terms
(`bazi.ts`), a date-level reading: a birth on a term's own day is read as
past it. The phases' colours are the correspondences' (青 blue-green, 赤
red, 黄 yellow, 白 white, 黑 black); earth opens none of the four seasons
the terms band, and its stems' days and years are yellow wherever they
fall.

### Panchang

The engine owns the five limbs, the months and their instants
(`calculations/panchang.ts`), their names (`data/panchang.ts`), the
nakshatras' lords and deities (`data/nakshatras.ts`) and the rashis
(`data/rashis.ts`); the builder (`src/lib/boards/panchang.ts`) the board.

- **Tithis** (unit). The lunar month's thirty tithis in their two pakshas,
  three rows of five: each the Moon's face at its middle, its numeral in
  Devanagari, its name and the sunrise it holds; a tithi no sunrise falls
  in keyed kshaya, one that holds two keyed vriddhi; the pakshas white and
  black.
- **Month**. This civil month and the next in weeks from Sunday, each day
  the Moon's face at sunrise, its tithi's numeral and its five limbs in its
  words; the Ekadashis on their days, Purnima and Amavasya on the day they
  begin with the time, the Sankrantis on their days; a day whose sunrise
  falls in Vishti keyed.
- **Nakshatras** (wheel). The twenty-seven from Ashwini, each led by its
  Vimshottari lord's glyph and banded by it, its deity in its words, and
  the sunrise the Moon stands in it in its circuit about the day: the
  mansions ahead of today's by the sunrises to come, those behind by the
  sunrises gone; a mansion no sunrise finds says so.
- **Next.** The next Ekadashi of each paksha, Purnima and Amavasya as they
  begin, the next Sankranti and the next month, nearest first.
- **Facts.** The tithi and when it ends, the paksha, the nakshatra with its
  pada, lord and deity, the yoga, the karana (Vishti named), the vara and
  its lord, the month amanta and purnimanta, and the sunrise.

Every limb is read at sunrise in Ujjain (Avanti, 23°10′N 75°47′E), the
prime meridian of the Surya Siddhanta (1.62): the Sun's upper limb on the
horizon with standard refraction. The limb in force at sunrise is the
day's, however soon after it ends. The month is amanta, new Moon to new
Moon, named for the rashi the sidereal Sun enters in it (Mesha: Chaitra);
where it enters none it is adhika and carries the next month's name, where
two, the first names it. The purnimanta month takes the next month's name
in the dark half, an adhika month its own in both. An Ekadashi is kept on
its sunrise, or, where no sunrise falls in it, on the day it begins (the
Smarta reading; Vaishnava rules can keep it a day later). Tithi times are
India Standard Time and agree with Drik Panchang to a minute or two; they
hold anywhere in India, where only the sunrise moves. A Sankranti is dated,
not timed, as on the Sidereal board. The derivation matches Drik's five
limbs and months for 25 May (in Adhika Jyeshtha), 24 July and 8 November
2026, and its Ekadashis of 20 November, 4 December and 20 December. The
day row's tithi is the same reading (`panchang`).

## Acceptance

- Every view of every board: cells, heads skipped by arrows, today current,
  each key's cells lit by its legend entry, each event with `at` lighting
  its cell; tested per board.
- Every engine table a board reads is tested against published values of
  its tradition.
- The kin tile opens its board by hover, focus, press and keyboard, and
  hands focus back on Escape, as a day row does.
- Tints pass the categorical gates in both themes.
- Typecheck, lint, unit tests; the three-engine harness at 440, 1280 and
  1512 with no board past the window.

## Second opinion

| Reviewer | Scope | Date | Status |
|---|---|---|---|
| Codex (`gpt-6-astra`, read-only) | Board model: views as tabs, placed cells, keyed legend, Next to cells, source colours, kin board disclosure | 2026-11-09 | incorporated |
| Codex (`gpt-6-astra`, read-only) | Chinese calendar and Panchang engines: instants from astronomy-engine, the Beijing and Ujjain day policies, one table of stems and branches, the pillars on Beijing-dated terms, the two boards' views | 2026-11-09 | incorporated |
| Codex (`gpt-6-astra`, read-only) | The board's skeleton: wireframe, sidebar layout, bar, inspector state, opaque surface | 2026-11-09 | incorporated |
| Code review (background agent) | The board's implementation: focus requests, inspector fallthrough, Today's state, ring bands, forced colours, the sheet's bound | 2026-11-09 | incorporated |
| Codex (`gpt-6-astra`, read-only) | The board as a window-height sheet, against freezing its place or reserving every view's height | 2026-11-09 | incorporated |
| Codex (`gpt-6-astra`, read-only) | Figures: the four layouts (figure tiles and courses, wheels of rings with spans, origin, turn and hand, hexagram ladders), the wheel's geometry and keys, each tradition's first view | 2026-11-18 | incorporated |
