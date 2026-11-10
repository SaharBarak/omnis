# Bringing the mobile app to the v2 design

The mobile app (`@pleiad/mobile`, Expo 57 / RN 0.86, expo-router) is skinned in
Material 3; the web is now the bento / Lantern language live at pleiad.io. This is
the contract for closing that gap: what already matches, what does not, the shape
options, a recommendation, and the sequence.

## What already matches

The two are not far apart. Mobile already uses the web's brand split — Space Grotesk
for display/headline, Barlow for body/label, IBM Plex Mono for the bodygraph — with
tabular figures for kin and gate numerals. The system glyphs were ported from the web
(`<Glyph>`, `currentColor` tinting, `npm run gen:glyphs`). The domain content colours
(the six systems' flavours, the Dreamspell seal colours) live apart from the theme in
`src/theme/tokens.ts`, exactly as the web keeps content colour out of the palette. The
`/api` layer the app reads is unchanged by the promotion.

## The gap

The look system differs at three levels:

The palette. Mobile derives 49 Material 3 roles from a single purple seed
(`#7D5BC9`, SchemeFidelity) in `src/theme/m3-colors.ts`. The web is the Lantern palette
(dark-first, gold accent) from `src/lib/design/bento-palette.ts`. Same role idea,
different hues and a different accent.

The surfaces. M3 renders elevation as `surfaceTint` mixed into a surface at a
level-specific opacity (`surfaceAt()`), and interaction as a translucent state layer.
The web renders depth as the bento frame language: plates, paper, the inverse section,
concentric insets, hairline walls — not tint-on-tint.

The components. Mobile's building blocks are M3 (`src/components/m3`, cards, state
layers). The web leads with the figure: glyph-led cards with an eyebrow group, a
two-column facts grid, a concentric inset, and the atlas/digest reading surfaces.

## Shape options

Option A — re-skin, keep the M3 structure. Replace the generated M3 palette with
roles mapped from the Lantern palette, align the type and shape scales to the web
tokens, and restyle the M3 components toward the bento card. Least disruption; the
screens, navigation and state-layer interaction model stay. Risk: M3's tint-based
elevation and the bento plate/paper model do not express the same way, so some screens
read as "M3 wearing Lantern colours" rather than as the web.

Option B — port the bento token layer. Bring the web's design tokens (palette,
scheme, type, radius, motion) across as the mobile theme and rebuild the shared
components (card, frame, reading surfaces) against them, retiring the M3 layer. Closest
match; one design system across web and mobile. Risk: largest change, touches every
screen, and RN has no CSS custom properties, so the tokens become a typed theme object
and a provider rather than `:root` variables.

Recommendation: adopt B's token model from the start, migrate the components into
it gradually. A palette-only re-skin is not enough: depth in this app is tint-based
(`surfaceAt()` carries cards, sheets, buttons and navigation), so swapping the hues
leaves every surface still reading as Material 3, and the web's distinctions — a cyan
accent apart from the gold action, and light, dark and inverse schemes — have no home
in the M3 role set. So the foundation is the ported bento token layer (palette with the
accent/action split, the scheme/inverse model, type, radius) as a typed theme and
provider; components then move onto it screen by screen, most-seen first, so the app
stays shippable throughout rather than flipping in one change. This is B's end state
reached on A's gradual, low-risk cadence.

## Sequence

1. Port the bento token layer as the mobile theme: a generated theme sourced from
   `bento-palette.ts` (the accent/action split, the scheme and inverse model), plus the
   web type, radius and motion tokens, carried as a typed theme object and a provider
   (what `useTheme()` already is) — kept generated so a palette change still regenerates.
2. Stand it up beside the M3 theme so both resolve during the transition and screens
   move one at a time, with the depth model being plate/paper/inverse rather than
   `surfaceAt()` tint.
3. Migrate components onto the ported tokens most-seen first: the person reading, the
   today board, pair and circle, then lists, forms and settings — each the bento card
   (eyebrow group, two-column facts, concentric inset, hairline walls).
4. Retire the M3 layer once no screen references it.
5. Verify on device/emulator (`pleiad` AVD) in both schemes; screenshot parity against
   the live web screens.

## Open questions

- Light scheme: the web could not dim its light paper (a gate-edge limit). Mobile has
  a full light M3 scheme today — keep a light scheme, or go dark-only to match where
  the web is strongest?
- Whether the bodygraph and atlas drawings (SVG) are shared source with the web or stay
  mobile-native renders.

## Second opinions

| Reviewer | Scope | Date | Status |
| --- | --- | --- | --- |
| codex (gpt-6-astra) | Re-skin vs token-port shape | 2026-11-10 | Incorporated |
