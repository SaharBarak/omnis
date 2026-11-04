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

## Faces and weights

Faces stay as `src/app/layout.tsx` loads them:

- **Space Grotesk** (`--font-display`) sets display, title and figure. Figures
  use `font-variant-numeric: tabular-nums` so changing numbers keep their
  width.
- **Barlow** (`--font-sans`) sets everything else.

Weights:

- 400 for running text.
- 500 for values and controls.
- 500 for labels under values.
- 600 for heads in capitals, headings and figures.

A role keeps one weight wherever it appears.

## The digest (home hero, `AtlasDigest`)

Each tile is a head over a row of facts (BENTO_SITE.md, "The digest").

- **Name.** The system's name: caption, 600, capitals, ink 2.
- **Note.** The extra fact at the end of a beside tile's head: caption,
  500, ink 3.
- **Pin.** The pin digit is micro, on a disc 1.75 times the digit
  (`--pin`), the same disc as the drawing's pins.
- **Mark.** As tall as the figure role (`--mark`), so a glyph, a drawing
  and a number weigh alike across the tiles.
- **Number.** Figure role, 600, ink, tabular figures, leading 1. It
  stands on the values' line.
- **Value.** Small, 500, ink, with balanced wrapping.
- **Label.** What the value is: caption, 500, sentence case, ink 3.

## Acceptance

- Every font size in the lab's CSS modules is a role (`type-scale.test.ts`).
- The scale is monotonic and nothing resolves below 11 px.
- The home hero at 1512×768, 1440×900, 1280×720, 1100 and 390, dark and
  light: the claim column and the rail fit with nothing cut off, no tile's
  content is taller or wider than the tile, and every tile's marks resolve
  to the same height.
- Labels in ink 3 hold 4.5:1 on a selected tile's tint in both themes.
- Every route in the route table renders at 1440 and 390 with no horizontal
  scroll after the migration.

## Second opinion

| Reviewer | Scope | Date | Status |
|---|---|---|---|
| Independent Claude agent (read-only) | Scale model, roles, leading and tracking derivation, floors, CSS API, enforcement, the readout rail at 1512×768 | 2026-10-30 | Incorporated: wide end from the page width, exact leading and tracking lengths, hero headline at `title`, sign marks at the figure size, tile overflow and tint contrast checks. Moving the rail's button and restyling tiles as rows stay layout questions outside this scale. |
