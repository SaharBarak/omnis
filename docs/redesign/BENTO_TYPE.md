# Bento Type

The type scale for every page in the bento tree (`/lab/bento/**`) and the
kit (`src/components/bento-lab`). It is the type twin of BENTO_MOTION.md:
one table in `src/lib/design/type-scale.ts`, emitted as custom properties on
the lab root (`LabRoot`, beside the motion and palette tokens), and read by
every CSS module through those properties.

## Problem class

Every text style on a page sits on one scale, so that sizes relate to each
other and to the window. The population is every `font-size` in the lab's CSS
modules, about 150 declarations across 13 modules. Without a scale, each one
is a size picked for its own box: the readout rail on the home page set its
labels at 10, 11 and 12 px and its numbers at 16, 26 and 40 px in two faces,
beside a 64 px headline. The rail read as the smallest, quietest thing on the
page, though it is the reading the page exists to give. A new component
should take a role, never a size.

Sizes alone do not make a hierarchy. The digest's tiles held three text
levels a single step apart on the dense end (a 14.2 px value over a 12.6 px
label), spaced only by their leading, which is the same above and below
every line. So nothing grouped and the levels read as near misses. The
second half of this spec is the rules for setting levels together: how far
apart they sit, how the space between them is derived, and which face sets
which role.

## Prior art

- **Utopia** (utopia.fyi): a fluid modular scale. A step is the body times a
  ratio raised to the step, with one ratio at a narrow window and another at
  a wide one, interpolated linearly between them with `clamp()`.
- **Apple HIG, Typography**: text styles are named by role (Large Title,
  Title, Headline, Body, Callout, Footnote, Caption), and the smallest text
  is 11 pt. Body copy is the reference size, and everything else is read
  relative to it.
- **Material 3 type scale**: roles grouped as display, headline, title, body
  and label, where a label is short, often capitalised, UI text.
- Leading and tracking fall as size rises. A heading set at body leading
  looks loose; small capitals need added tracking to stay legible.
- **Refactoring UI** (Wathan, Schoger): hierarchy comes from weight and
  colour as much as size; a secondary line steps back by being lighter, and
  sizes too close together read as mistakes.
- **Capsize** and the CSS `text-box` properties: a line trimmed to its cap
  height and baseline, so the space between lines is the space set between
  them, not leading split above and below.
- **make-interfaces-feel-better** (Krehel): balanced wrapping on headings,
  tabular figures on numbers that change, antialiased text on macOS.

## The scale

Base 16 px (the body, step 0). The window range runs from 360 px (a small
phone) to the page's own widest box, `PAGE.max` in
`src/lib/design/layout-tokens.ts` (1320 px, also `--page-max` for the page
rule). The ratio is 1.125 (major second) on a phone and 1.25 (major third)
at the wide end.

- Steps above the body are fluid. They rise between the two widths and hold
  past the wide end. Past that width the page's columns stop growing, so a
  size inside them stops too.
- Steps at and below the body are fixed at the dense ratio, so small text
  never shrinks as a window grows.

Sizes in px; leading and tracking at the wide end.

| Role | Step | 360 px | 1320 px | Leading | Tracking | Used for |
|---|---|---|---|---|---|---|
| poster | 7 | 36.5 | 76.3 | 0.93 | −0.033em | Numbers set as graphics: a feature tile's number, a system page's big number. The ceiling. |
| display | 5 | 28.8 | 48.8 | 1.02 | −0.028em | A page's one headline across a full-width head. |
| title | 4 | 25.6 | 39.1 | 1.08 | −0.025em | Page and section titles, and a headline set in a column (the home hero). |
| figure | 3 | 22.8 | 31.3 | 1.16 | −0.020em | A tile's or panel's leading number (Kin, profile, life path). |
| heading | 2 | 20.3 | 25.0 | 1.25 | −0.015em | Card and panel titles. |
| lead | 1 | 18.0 | 20.0 | 1.5 | −0.008em | Intro paragraphs; a tile's secondary numbers. |
| body | 0 | 16 | 16 | 1.5 | 0 | Running text, values, controls, inputs, buttons. |
| small | −1 | 14.2 | 14.2 | 1.5 | 0.005em | Secondary text: meta lines, the sample line, helper text. |
| caption | −2 | 12.6 | 12.6 | 1.5 | 0.01em | Labels: in capitals with caps tracking for a head or eyebrow, in sentence case under a value; table heads; credits. |
| micro | −3 | 11.2 | 11.2 | 1.5 | 0.01em | Pin digits, chart ticks, fine print. The floor; nothing is smaller. |

Leading and tracking are derived, not picked:

- **Running text** (lead and below) keeps prose leading, 1.5.
- **Headings** take the leading that falls along the reciprocal of their
  size, from the first heading (1.25) to the display (1.02).
- **Tracking.** Every role takes the tracking that falls along the reciprocal
  of its size, from the body (0) to the display (−0.028em). It stops at
  +0.01em for small type.
- **Exact at every size.** The ends are set at the wide end's sizes. A
  reciprocal `k + c / size` multiplied by the size is `k·size + c`, a length
  CSS writes as `calc(k·1em + c)`. So a heading's leading and every tracking
  are emitted as those lengths, true at whatever size a fluid role resolves
  on this window. The display on a 360 px phone gets 1.19 leading, not the
  1.02 that suits it at 49 px.
- **Capitals.** Words set in capitals replace their role's tracking with
  `--type-caps-ls` (0.08em). Only caption and micro are ever set in
  capitals, and only for one level per component: the eyebrow, a tile's
  head, a table head. Labels under values stay in sentence case, so two
  levels of capitals never compete.

## Custom properties

`typeCssVars()` emits, for each role:

- `--type-<role>`: the size, a `rem` value or a `clamp()`;
- `--type-<role>-lh`: the leading;
- `--type-<role>-ls`: the tracking.

It also emits two shared settings:

- `--type-caps-ls`, the tracking for capitals;
- `--type-ui-lh`, 1.25 (the first heading's leading), for short UI strings
  that may wrap once, such as a value in a tile, where prose leading would
  open a gap between two lines of one name.

A rule takes a role whole:

```css
.value {
  font-size: var(--type-body);
  line-height: var(--type-body-lh);
  letter-spacing: var(--type-body-ls);
}
```

`em` sizes stay allowed for parts that scale with their parent (a superscript,
a glyph beside a word), as does `inherit`. A raw `px` or `rem` font size in a
lab CSS module fails `type-scale.test.ts`. Exemptions:

| What | Why |
|---|---|
| `wireframe.module.css` | Its sizes are drawing units in page miniatures, not type a reader reads at that size. |
| A declaration marked `/* drawing */` | SVG text in viewBox units (the number ring, the map's sign symbols), which scale with the drawing. Only a rule that also paints the SVG (`fill`, `stroke`, `text-anchor`) carries the mark. |
| SVG text placed by geometry (`TIE_LABEL`, `PERSON_LABEL`) | Drawing, held in `geometry.ts`. |

Glyphs that stand in for a number take that number's role as their size:
the sky tile's sign marks are `var(--type-figure)`, so they weigh the same as
the other tiles' figures.

## Measure

A paragraph's role holds only where its line keeps at least 45 characters.
An intro paragraph is `lead` across a page; in a column narrower than 45ch
at the lead's size it is `body`. The home hero's claim column is one such
column.

## Contrast

Two text levels that read against each other either share a size, and
differ in weight, colour or case, or differ in size by at least the scale's
open ratio (1.25, `LEVEL_CONTRAST`). This is the lab's policy for setting
levels together. One step on the dense end (16 over 14.2, or 14.2 over
12.6) is 12 % apart, close enough that the two read as near misses rather
than as two levels. Apple's text styles work the same way: Headline and Body
share 17 pt and differ in weight, while Body sits over the smaller Footnote.

On the fixed end, two steps (1.27) clear the bar and one does not. A fluid
role clears it against a fixed one at every width once its narrow size does:
`heading` (20.25 at 360 px) over `body` (16) holds from a phone up.

Marks are not levels. A glyph, a drawing, a pin's digit or a number
standing in for a glyph (the life path's figure) is sized by the lines it
stands beside ("Marks" below), so it never pairs against them.

The table holds sizes only. Whether two levels of one size differ enough in
weight, colour or case, and whether a pair is missing from the table, is
still read on the page.

## Voices

A component's voice is its levels, each a role, and the pairs of levels that
read against each other. Voices live in one table, `TYPE_VOICES` in
`src/lib/design/type-voice.ts`, beside the scale:

- `type-voice.test.ts` checks every pair against the contrast rule at every
  width the scale tests.
- `voiceCssVars(voice)` emits `--voice-<level>`, `-lh` and `-ls` (the
  level's role's size, leading and tracking) on the component's root. The
  component's CSS module takes its sizes from those properties and from no
  role directly. The test holds the module to its voice: every font size is
  exactly one of its levels (`var(--voice-<level>)`, or `inherit` and `em`
  for parts that scale with their parent), every level appears in the
  module, and no other module reads a voice.

A component joins the table when its text is reworked; the digest is the
first. Its levels name what the text is to the component (`lead`, `label`),
so a role can change in the table without touching the CSS.

## Trimmed lines

Space between lines of UI text comes from the type, not from leading. A
line's leading is half above and half below its words, the same on every
line, so lines spaced by leading alone sit at even intervals and never
group. Capsize and the CSS `text-box` properties (Baseline in every engine
since Firefox 154, August 2026) trim a line to its cap height and baseline,
so the space between two lines is exactly the space set between them.

Inside a voiced component, single lines and short values are trimmed
(`text-box: trim-both cap alphabetic`). A value that wraps keeps its leading
between its own lines; only its first and last edges are trimmed. The
spacing is derived:

- **Cap height.** Both faces set their capitals at 0.7 em (OS/2
  `sCapHeight` 700 of 1000 units, Barlow and Space Grotesk alike), emitted
  as `--type-cap`. A trimmed line is that tall.
- **Pair.** The lines of one fact (a value and its label, the lead and its
  note) stand apart by the room the upper line's em box leaves below its
  capitals: `(1 − cap) × size` of the upper line, emitted as the factor
  `--type-room`. It is an optical choice, not a metric: the room is about
  what the face's descenders reach, so it grows with the line that has
  them: 4.8 px under a 16 px value, 7.5 px under a 25 px lead.
- **Group.** Parts of a component (a tile's head, lead and supports) stand
  apart by twice the body's pair, `--type-group` (9.6 px), which is wider
  than the pair under any level a voice sets, its lead included. Proximity
  reads parts as separate only when the space between them is wider than the
  space inside them; `type-voice.test.ts` holds every voice to that at every
  width.
- **Inset.** A surface holding trimmed lines insets them by the group on
  every side, so the space from a card's edge to its caps matches the space
  from its edge to its words' sides. Where a surface is stretched past its
  content, the extra space is shared evenly between the insets and the
  groups (`align-content: space-evenly`); the pairs keep their size, so a
  fact's lines stay together as the parts move apart.

Where a browser has no `text-box`, lines keep their leading and the same
gaps add to it: the component is taller and keeps its order. Every overhang
below is set inside `@supports (text-box: trim-both cap alphabetic)`, so an
untrimmed line never has a mark pulled over it.

A trimmed box holds text, never a clip. A number that rolls (`Rolling`)
clips its moving copies to its own line box; it sits inline in a trimmed
line rather than being trimmed itself, so the clip keeps the digits' ink
(a slash, a degree sign) whole.

## Marks

A mark is as tall as the em boxes of the lines it stands beside: a support's
mark is its value's size, the lead's mark the lead's size and the note's
together. An em box is the size a face is drawn to, so a mark keeps the
weight of its lines at every size. It overhangs its trimmed lines into the
space around them, so it never adds height of its own:

- The lead's mark centres on the lead's lines, however many the value wraps
  to. Its overhang is set for one value line and the note; a wrapped value
  is taller than the mark, which then centres with no overhang.
- A support's mark centres on its value's first line, so a value that wraps
  keeps its mark beside its first word. A number standing as the mark is a
  word of that line, set in the same trimmed box, so the two share a
  baseline.
- The pin is a disc 1.75 times its digit, centred on the head's line in the
  same way. Its hit area (40 px, 44 px under a finger) is wider than the
  head and reaches into the group below; it sits above the lead, so the
  part of the lead's button under it answers as the pin.

## Faces and weights

Faces stay as `src/app/layout.tsx` loads them:

- **Space Grotesk** (`--font-display`) sets display, title and figure, and
  nothing smaller. The face follows the role, never the content: a date or
  a number in a text role is set in the text face. `type-voice.test.ts`
  checks every rule that names the display face against the size it sets;
  a rule that inherits the face, or names it without a size, is outside
  what the test can see. Rules that set it smaller before this held lab-wide
  are listed in the test (`DISPLAY_IN_TEXT`), and each leaves the list as
  its component takes a voice.
- **Barlow** (`--font-sans`) sets everything else, numbers included, with
  tabular lining figures (`tnum`, `lnum`) wherever a number can change
  while the reader watches, so a digit's width never moves its line.
- A line never changes face.

Weights:

- 400 for running text and for labels: a label steps back by weight and
  colour, not size alone.
- 500 for values and controls.
- 600 for heads in capitals, headings, figures and numbers standing as
  marks.

A level keeps one weight wherever it appears; one role can carry levels of
different weights (the caption sets the eyebrow at 600, the note at 500 and
the label at 400).

## The digest (home hero, `AtlasDigest`)

Each tile is a head, a lead and a row of supports (BENTO_SITE.md, "The
digest"). Its voice (`TYPE_VOICES.digest`):

| Level | Role | Set as |
|---|---|---|
| `eyebrow` | caption | The system's name: 600, capitals, ink 2. |
| `pin` | micro | The pin digit, on a disc 1.75 times the digit (`--pin`), the same disc as the drawing's pins. |
| `lead` | heading | The lead value: 600, ink, balanced wrapping. |
| `note` | caption | The lead's note: 500, ink 2; a label inside it is 400, ink 3. |
| `figure` | figure | A number as the lead's mark: 600, display face, ink, tabular figures, leading 1. |
| `value` | body | A support's value: 500, ink, balanced wrapping. A number as its mark is the same level at 600. |
| `label` | caption | What a support is: 400, sentence case, ink 3, under its value. |
| `card` | caption | The card a fact opens. |

Pairs that read against each other: the lead and its note, the lead and a
support's value, a value and its label, the eyebrow and the lead, the note
and a value.

The tile is trimmed and spaced as "Trimmed lines" sets out: head, lead and
supports a group apart, each fact's lines a pair apart, the tile's inset the
group on every side.

## Acceptance

- Every font size in the lab's CSS modules is a role, and in a voiced
  module one of its voice's levels (`type-scale.test.ts`,
  `type-voice.test.ts`).
- The scale is monotonic and nothing resolves below 11 px.
- Every voice's pairs hold the contrast rule at every tested width.
- Every voice sets its parts further apart than the lines of any fact.
- Space Grotesk appears only in rules set at figure or larger, outside the
  listed rules.
- The home hero with the sample person, at 100 % zoom, at 1512×768,
  1440×730, 1440×900, 1280×720, 1100 and 390, dark and light, with motion
  on and reduced: the claim column and the rail fit with nothing cut off
  and no scroll, no tile's content is taller or wider than the tile, every
  tile's lead mark resolves to the same height, and every support's mark to
  its value's size. A person whose values are longer wraps them, and the
  column scrolls (BENTO_SITE.md, "Container").
- Labels in ink 3 hold 4.5:1 on a selected tile's tint in both themes.
- Every route in the route table renders at 1440 and 390 with no horizontal
  scroll.

## Second opinion

| Reviewer | Scope | Date | Status |
|---|---|---|---|
| Independent Claude agent (read-only) | Scale model, roles, leading and tracking derivation, floors, CSS API, enforcement, the readout rail at 1512×768 | 2026-10-30 | Incorporated: wide end from the page width, exact leading and tracking lengths, hero headline at `title`, sign marks at the figure size, tile overflow and tint contrast checks. Moving the rail's button and restyling tiles as rows stay layout questions outside this scale. |
| Codex (gpt-6-astra, read-only) | Contrast, voices, trimmed lines, marks, faces, the digest's voice and fit | 2026-11-05 | Incorporated. Container-relative (`cqi`) roles stay a separate decision until fit testing asks for another axis. |
