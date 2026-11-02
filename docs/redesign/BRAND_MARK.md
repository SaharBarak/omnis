# Brand Mark: the Lantern

The Pleiad mark is a hanging lantern: a ring, a domed cap, an arched teal
frame around a lit gold window, and a pale base. This spec is the one
definition every drawing of it reads. That covers the inline mark on the web
and in the app, and every icon file a browser, a home screen, a store or a
link preview asks for by name.

## Problem class

The population is every place the logo is drawn:

- **Inline on the web.** `BrandMark` in the bento top bar and footer, the
  landing nav and sections, the app shell, login, onboarding, and two lab
  experiments.
- **Inline in the app.** The mobile `BrandMark` on the boot screen, login,
  the tab bar and the empty state.
- **Files.** The favicon (ICO and SVG), the Apple touch icon, the web
  manifest icons (any and maskable), and the Open Graph card. In the Expo
  app: the store icon, the Android adaptive layers (foreground, background,
  monochrome), the splash icon, and the web favicon.

A new place that draws the mark takes it from this module; it never redraws
it.

## Prior art

- **Apple HIG, App icons.** The store icon is a 1024 px opaque square; the
  system cuts the corners, so the file is full bleed with no alpha. A mark
  stays simple enough to recognise at small sizes.
- **Android adaptive icons.** Layers are 108 dp. The launcher shows the
  middle 72 dp, and a circle of 66 dp is always visible. The monochrome layer
  is a single-colour silhouette that Android 13+ tints for themed icons.
- **W3C maskable icons.** The safe zone is a centred circle with a radius of
  40% of the icon.
- **Favicons.** Browsers that read `/favicon.ico` by name take PNG-compressed
  16, 32 and 48 px entries. Current browsers prefer an SVG icon. iOS reads a
  180 px opaque `apple-touch-icon.png`.
- **Open Graph.** The card is 1200 × 630.
- **Generated, never authored.** This is the repo's own rule for the mobile
  glyph registry and the M3 palette (`packages/mobile/scripts`). Derived
  output is written by a script and committed, and a test fails when the
  committed file drifts from what the source derives today.

## The drawing

The geometry is one table in `src/lib/brand/mark.ts`. One unit is a tenth of
the body's half-width, and all positions derive from the table:

| Part | Value | Meaning |
| --- | --- | --- |
| `body` | 10 | Radius of the body's arch, and its half-width |
| `wall` | 3 | Frame wall, between the body's edge and the cut |
| `gap` | 2 | Width of the cut between the frame and the window |
| `length` | 16.5 | Straight side of the body below the arches' common centre |
| `ring` | 3 / 2 | Outer and inner radius of the hanger ring |
| `lid` | 8 | Half-chord of the cap and the base |
| `brim` | 0.5 | Height of the cap's chord below the body's crown |
| `foot` | 1 | Clear space between the body and the base |

The table resolves into the drawing as follows:

- **The arches.** The window, the cut and the body are concentric arches,
  with radii `body − wall − gap`, `body − wall` and `body`. Each arch is a
  semicircle on straight sides. The wall and the cut keep their widths along
  the bottom too, so the window's straight side is `length − wall − gap`.
- **The cap and the base.** Both are segments of the body's own circle, cut
  at the `lid` chord. A half-chord of 8 on a radius of 10 makes a 6-8-10
  triangle, so each rises 4. The cap's chord sits `brim` below the crown,
  which leaves a notch where the cap overhangs the body's shoulders. The base
  hangs `foot` below the body.
- **The ring.** The ring's hole is tangent to the cap's top, so the ring's
  band merges into the cap and the hole stays round.
- **Bounds.** The mark is 20 × 40 units. Every point lies within half its
  height of its centre, so fitting the height to a circle fits the whole
  mark.

The traced source (Recraft) measures within half a unit of this table at
every edge. Its lopsidedness is not kept.

**Cut, not painted.** The ring's hole and the cut around the window are
holes in the frame. The frame is one path: solids are wound clockwise and
holes counter-clockwise, under the nonzero fill rule. Whatever ground the
mark sits on shows through, so the same path works on dark, light, tinted or
transparent grounds, and in one colour.

## Colour

The mark's colours are the palette's anchors (BENTO_COLOR.md "Anchors"):
the palette is derived from the mark, and the mark is drawn back from the
palette's roles, resolved per theme by `resolvePalette`:

| Part | Role | Dark | Light |
| --- | --- | --- | --- |
| Frame (ring, cap, body) | `accent` | the frame anchor, `#42e5e0` | deep teal |
| Window | `sparkMark` | the window anchor, `#eeb318` | deeper gold, 3:1 on the white tile |
| Base | `ink` | pale | near black |
| Icon tile | `surface1` | navy | white |

The mark takes the default palette's roles whichever palette a page shows:
it is the brand, not a theme. It does follow the theme, dark or light, and
in the dark theme it is exactly the colours the owner picked.

The resolved hex values are written by the generator into
`src/lib/brand/mark-tones.gen.ts`, so client code never imports the palette
solver. A test compares that file with `resolvePalette` output.

**Mono.** Every part takes `currentColor`. Because the cuts are holes, the
lit window still reads in one colour. Mono is for single-colour surfaces: the
app shell's tile, the mobile tab bar, and the Android monochrome layer.

## Placing the mark in a square

Because the mark lies within a circle of half its height, its size in a
square is one number, `fill`: the mark's height as a share of the square's
side. Each output is one row of the generator's `OUTPUTS` table, and this
table is that table:

| File | Size | Fill | Ground | Alpha | Tones |
| --- | --- | --- | --- | --- | --- |
| `src/app/favicon.ico` | 16, 32, 48 | 0.875 | tile, rounded | yes | dark |
| `src/app/icon.svg` | vector, fitted for a 16 px tab | 0.875 | tile, rounded | yes | dark |
| `src/app/apple-icon.png`, `public/apple-touch-icon.png` | 180 | 0.7 | tile, full bleed | no | dark |
| `public/icons/icon-{192x192,512x512}.png` | 192, 512 | 0.7 | tile, full bleed | no | dark |
| `public/icons/icon-maskable-512x512.png` | 512 | 0.7 | tile, full bleed | no | dark |
| `public/og-image.png` | 1200 × 630 | 0.56 of the height | ground, with wordmark | no | dark |
| Expo `icon.png` | 1024 | 0.7 | tile, full bleed | no | dark |
| Expo `android-icon-foreground.png` | 1024 | 0.7 × 72 / 108 | none | yes | dark |
| Expo `android-icon-background.png` | 1024 | – | tile, solid | no | dark |
| Expo `android-icon-monochrome.png` | 1024 | 0.7 × 72 / 108 | none | yes | mono white |
| Expo `splash-icon.png` | 1024 | 0.9 | none | yes | dark |
| Expo `favicon.png` | 196 | 0.875 | tile, rounded | yes | dark |

Why the fills are what they are:

- **0.7, full bleed:** the HIG store icon. The system masks the corners, so
  the mark stays clear of them. The same image serves as the maskable icon,
  because 0.7 is inside the W3C safe zone of 0.8.
- **0.7 × 72 / 108:** the store icon's size inside the 72 dp launcher
  viewport. It must stay within the 66 / 108 safe circle.
- **0.875:** a tab icon has few pixels and must fill them.
- **0.9:** Expo draws the splash image `imageWidth` (76 dp) wide on the
  splash colour, so the canvas is square and the mark nearly fills its
  height.

The app's own splash and adaptive `backgroundColor` stay the M3 ground
(`#151219`). The adaptive background image is the brand tile, and it wins
over the colour wherever both are given.

Tests check each limit on the drawn geometry, not on the scalar: every
point of the fitted mark lies within the safe circle.

## Small sizes

Below about 40 px tall, the drawing's thinnest parts fall under one pixel.
The ring's band and the foot are each one unit, and the cut is two. A
feature that thin turns grey or vanishes. The module's `optical(px)` returns
the table for a render `px` tall, applying a minimum of one pixel:

- **Cuts grow.** The cut around the window and the foot each grow to at
  least one pixel. The window gives up the width the cut takes; the body
  never changes.
- **The ring's band grows** to one pixel around its hole. A hole that would
  be under one pixel across closes, and the ring becomes a solid knob. The
  hole is decided once, at the size the fit settles on, so the fit cannot
  flip between hole and knob.
- **The frame wall** stays at least one pixel.
- **The window** must stay at least one pixel across. The smallest size
  where it does is `MARK_MIN_PX` (about 10.5 px), derived from the table.
  Below it, `optical` refuses.

The favicon's ICO entries are drawn this way at their own sizes. So is the
SVG favicon, fitted for the smallest tab it is shown in (16 css px): Next
advertises it as `sizes="any"`, so Chromium and Firefox show it in place of
the ICO. Inline web marks are fitted at their `size`. Every other output is
40 px tall or more and uses the table as it stands.

## Outputs and dependency direction

`npm run brand:icons` runs `src/lib/brand/generate.ts` through a three-line
shell, `scripts/brand/make-icons.ts`. The shell is there because `scripts/`
is outside tsc and eslint. The generator writes every file in the table
above, plus two source modules:

- `src/lib/brand/mark-tones.gen.ts`: the resolved colours.
- `packages/mobile/src/components/brand-mark.gen.ts`: the paths, the viewBox
  and the tones for the app, which cannot import the web tree.

Dependencies run one way:

- `mark.ts` is pure geometry and SVG strings and imports nothing; tones are
  passed in.
- `outputs.ts` holds the outputs table and the renderer. It is Node-only and
  imports the palette solver and `sharp`; the generator and the drift test
  import it, and no component does.
- Only `generate.ts` touches the filesystem and `next/og` (through
  `og-card.tsx`, which holds the card's layout). It fetches the card's fonts
  and derives every file in memory before writing any, so a network failure
  leaves the tree as it was.
- `sharp` and `tsx` are exact devDependencies, so a framework upgrade cannot
  change a raster unseen.
- The components import `mark.ts` with `mark-tones.gen.ts` (web), or
  `brand-mark.gen.ts` (app).

**One owner per URL.** The favicon, the SVG icon and the Apple icon are App
Router files (`src/app/favicon.ico`, `src/app/icon.svg`,
`src/app/apple-icon.png`), so Next writes their `<link>` tags. The layout's
metadata sets no `icons`, because Next drops every file icon but the favicon
once `metadata.icons` is set. A test holds that rule.

- `public/favicon.ico` is removed, because it claimed the same URL with
  different bytes.
- `public/site.webmanifest` is removed; `src/app/manifest.ts` is the only
  manifest.
- `public/apple-touch-icon.png` stays, drawn from the same row as the Apple
  icon, for clients that ask for it by name.

The Open Graph card is drawn by `next/og`. It sets the mark's SVG beside the
wordmark "Pleiad", in Space Grotesk (the display face), with the tagline from
`src/lib/brand/identity.ts`. The web manifest and the layout's metadata
read their name and tagline from the same module: the title and its template,
the authors, the Open Graph site name, and the Apple web-app title.

## Inline components

On both platforms the box is `size` tall and the mark's own aspect wide.

- **Web, `src/components/brand-mark.tsx`.** Fills are `var(--mark-frame)`,
  `var(--mark-window)` and `var(--mark-base)`, falling back to the dark
  tones. `LabRoot` declares both themes' values on `[data-lab][data-theme]`,
  beside the palette stylesheet. A nested theme boundary therefore sets its
  own values and never inherits the other theme's. Pages outside the lab are
  dark, so they use the fallbacks. A mark on a light surface outside the lab
  (the login card) passes `tone="light"`, which picks the light fallbacks.
  `mono` sets every fill to `currentColor`. The paths are fitted with
  `optical(size)`, so below 40 px the box is a little narrower than half
  its height.
- **App, `packages/mobile/src/components/brand-mark.tsx`.** It picks the dark
  or light tones from `useTheme().dark` and passes explicit fills, since
  native views have no CSS variables. The API stays `mono?: string`: a colour
  string fills every part with that colour. App sizes are in dp, and phones
  run at 2x density or more, so the smallest mark (the 24 dp tab icon) is 48
  device pixels. The app therefore draws the table as it stands, at a fixed
  1 : 2 box.

## Lockup

The mark beside the name is set as type, not as an icon centred on the
text. `lockup()` in `mark.ts` derives its proportions from the drawing, in
cap heights of the word's font:

- The body, from the brim to the foot, is one cap height. Its flat foot
  stands on the baseline. Its round crown rises a little past the cap line,
  as round letters overshoot.
- The ring rises above the body like an ascender, and the base hangs below
  the baseline like a descender.
- The gap to the word is half the mark's width.

`BrandLockup` in `brand-mark.tsx` writes these as `--lockup-*` and its CSS
module turns them into lengths with the `cap` unit. The browser reads the
cap height from the font in use, so the lockup follows any size or face the
surrounding text sets. A fallback face gives a slightly different lockup
until the web font loads; nothing else changes. Where a browser lacks the
`cap` unit, the display face's cap-to-em ratio (`DISPLAY_FACE` in
`type-scale.ts`, read from the font's OS/2 table) stands in. The thin parts
are fitted for a lockup set in the lead role unless a caller passes `fit`. The proportions come from
the fitted table the mark is drawn with (`optical(fit)`), so a small lockup
whose parts grew still sits on its baseline.

The word is set at weight 500. Its stems are then about as thick as the
mark's wall, so neither half reads heavier (make-interfaces-feel-better,
"Match icon stroke to text weight").

## Acceptance

- One geometry table. Both components and every file derive from it, and
  `grep` finds no other drawing of the mark.
- The tones equal `resolvePalette(lantern, theme)` for each role, and the
  dark frame and window equal the anchors.
- The geometry tests read the mark as it renders. They draw it 400 px tall,
  mono and on no ground, and check that:
  - the opaque pixels span 20 × 40 units;
  - the mark is mirror-symmetric within the rasteriser's edge noise;
  - every painted pixel lies within half its height of its centre;
  - the ring's hole, the cut beside and below the window, the notch under
    the brim and the foot are clear, while the wall, the window and the base
    are solid;
  - the cap and the base share the body's radius.
- Swept from 8 to 40 px in quarter-pixel steps, `optical` either refuses
  (below `MARK_MIN_PX`) or leaves no cut, band, wall or window under one
  pixel. From 40 to 200 px it returns the table unchanged.
- A drift test re-renders every raster except the Open Graph card. It
  compares decoded pixels with the committed file, allowing two levels a
  channel for antialiasing on other CPUs. It byte-compares `icon.svg`,
  `mark-tones.gen.ts` and `brand-mark.gen.ts`. The Open Graph card needs a
  fetched font, so its test checks dimensions only.
- A config test checks the references:
  - the manifest's icons and `app.json`'s images are files the generator
    writes, at their stated sizes;
  - the icons that platforms mask have no alpha: the iOS icon, the Apple
    touch icon and the manifest icons. This is read from the configs, not
    from the outputs table;
  - every painted pixel of the mark lies inside each safe circle;
  - each URL has one owner.
- In the lockup, the body's foot sits on the word's baseline and its brim
  on the cap line, within a pixel, at 1440 and 390 px
  (`scripts/e2e/run-e2e.mjs`, `09-bento`).
- Every web call site renders with no layout shift and no horizontal
  overflow at 1440 and 390 px. The 16 px favicon reads as a lantern.

## Second opinion

| Reviewer | Scope | Date | Outcome |
| --- | --- | --- | --- |
| Codex (gpt-6-astra) | Spec, module boundaries, platform icon rules, drift coverage | 2026-10-30 | Incorporated |
| Solution-architect review agent | Implementation against this spec: geometry, optical fit, rasters, tests, conventions | 2026-10-30 | Incorporated |
