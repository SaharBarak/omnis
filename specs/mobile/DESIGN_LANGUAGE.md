# Pleiad Mobile — Design Language

Status: **Material 3.** Supersedes the bespoke "Pleiad dark cosmic" system that
this document described until 2026-07-14.

The mobile app is a Material 3 app. Not "M3-inspired", not "brand skin over
Material bones" — the colour system, the type scale, the shape scale, the
elevation model, the state model, and the motion system are all M3's, and the
component set implements M3's components.

Two deliberate departures are named in §7. Everything not named there is M3, and
where this document and the M3 spec disagree, the M3 spec wins.

---

## 1. Colour

### 1.1 The system is derived, not authored

Every colour in the app is one of **49 M3 roles**, and all 49 are computed from a
single seed by Google's own `material-color-utilities`.

| | |
|---|---|
| Seed | `#7D5BC9` (the brand purple) |
| Variant | `SchemeFidelity` |
| Contrast | 0 (standard) |
| Generator | `packages/mobile/scripts/generate-m3-palette.mjs` |
| Output | `src/theme/m3-colors.ts` — **generated, never hand-edited** |

`SchemeFidelity` is the variant that keeps faith with the seed. It lands
`primaryContainer` on `#7D5BC9` exactly — the brand purple survives into the
palette as a real role — and derives a gold `tertiary` (`#f1bf59`). The M3
default, `SchemeTonalSpot`, desaturates the seed toward neutral;
`SchemeExpressive` rotates the hue to a teal and discards the brand entirely.

To change the palette, change the seed and re-run the generator. Do not edit a
hex.

### 1.2 Schemes

Dark and light are both generated and both complete. **Dark is the default and
the fallback** — an unset system preference lands on dark, because the product
is a night sky. `useTheme()` in `src/theme/m3.ts` resolves it.

### 1.3 Domain colour is not theme colour

`src/theme/tokens.ts` holds the six system flavours and the four Dreamspell seal
colours. These are **content**, not UI: a red seal is red because the tradition
says so, and it stays red in the light scheme, in the dark scheme, and under any
seed.

The rule: if it describes *what the app is showing*, it's a domain colour and it
lives in `tokens.ts`. If it describes *what the app looks like*, it's a role and
it comes from `m3.ts`. Nothing else is a colour source. A raw hex in a screen is
a bug.

### 1.4 Elevation is colour

In M3, a raised surface is not a shadowed surface — it is the same surface with
`surfaceTint` composited into it. `theme.surfaceAt(level)` does that blend.
Raising something makes it **lighter**, not darker-edged.

Real shadows are reserved for the components that genuinely float: the FAB,
menus, and the snackbar. `SHADOW.level*` exists for those and nothing else.

### 1.5 Interaction is a state layer

A pressed component does not change its fill and does not shrink. It wears a
translucent veil of its own *content* colour — 10% for pressed, 8% hover, 10%
focus. `stateLayer()` produces it and the `Touchable` primitive is the only
place it is drawn. Android additionally gets a native ripple, because that is
what an Android press feels like.

---

## 2. Typography

The M3 type scale, in the app's own faces. M3 explicitly supports a brand/plain
typeface split, and this is it:

| Slot | Face | Roles |
|---|---|---|
| Brand | **Space Grotesk** | `display*`, `headline*` |
| Plain | **Barlow** | `title*`, `body*`, `label*` |
| Data | **IBM Plex Mono** | `data*` |

The fifteen M3 roles keep the spec's sizes, line heights, and tracking. The
three `data*` roles are a documented **extension**, not an M3 role: every
numeral in the app — kin, gates, gematria values, dates, scores — is tabular, so
a figure cannot change width between frames.

Address type by role, never by size. `<Text variant="titleMedium">`, never a
`fontSize`.

---

## 3. Shape

The M3 shape scale: `none` 0 · `extraSmall` 4 · `small` 8 · `medium` 12 ·
`large` 16 · `extraLarge` 28 · `full`.

Bottom sheets take `extraLarge` on their top corners only. Buttons, chips, and
FABs take `full`. Cards take `medium`. Text fields take `extraSmall`.

---

## 4. Layout

M3's 4dp grid (`SPACE`). Screen margin **16**. The compact window class is the
only one targeted in v1.

**Every interactive element clears 48dp.** Where the drawn component is smaller
than that — a 40dp button, a 32dp chip — the target is extended with `hitSlop`,
which grows the tap area without inflating the visual. This is not a
recommendation; it is the floor, and the previous system missed it in six places.

---

## 5. Components

`src/components/m3/` is the component set, and it is the only source of UI.
A screen reaching for a raw `View` with a hand-picked colour is the signal that
a component is missing — add it there rather than styling in place.

Buttons come in five emphases (filled, tonal, elevated, outlined, text) and a
screen gets **at most one filled button**. If everything is emphasised, nothing is.

The navigation bar's active destination is marked two ways at once: a
`secondaryContainer` **pill behind the icon**, and the icon switching to its
filled weight. Colour alone is not enough to survive a colour-blind user or a
sunlit screen.

Every data surface still ships all four states — loading (skeletons that match
the final layout, never a spinner), empty (composed, with the action that would
fill it), error (stated plainly, with the retry attached), and success (haptic +
snackbar).

---

## 6. Motion

M3's easing set and duration scale, both in `m3.ts`. `emphasized` for anything
the user initiated; `standard` for incidental change. Durations are chosen by
how far a thing travels, not by feel.

Animate `transform` and `opacity` only, on the UI thread, in worklets. Nothing
bounces — the springs are damped to settle.

`AccessibilityInfo.isReduceMotionEnabled` turns off every decorative motion: the
split-flap board renders static, the atmosphere stops drifting, sheets and
indicators keep only their functional movement.

---

## 7. The two departures from stock Material

Both are deliberate. Both are the answer to "immersive", which stock M3 is not.

**The atmosphere.** M3's `background` role is one flat colour, and a flat colour
is the least immersive thing a night-sky product could sit on.
`components/cosmic-ground.tsx` paints, behind every screen: the `background`
role, the `hero-sky.webp` mural masked into a vertical fade, and two soft radial
glows in the seed's own `primary` and `tertiary`. It drifts ±6dp over 40 seconds
— under the threshold of noticing, which is the point. It is Skia, because React
Native has no radial gradient and the previous approximation (two `borderRadius:
240` Views at 7% opacity) rendered as two visible hard-edged discs.

Everything *in front of* the atmosphere is M3. The backdrop is not.

**The split-flap board.** Today's board keeps its departures-board flip. It is
the one set piece in the app, it is on the home screen, and M3's motion system
has no objection to it — only to there being a second one.

---

## 8. Voice

Unchanged. Calm, concrete, confident. Complete-thought headlines, never feature
labels. No mysticism kitsch, no SaaS hype. Dry humour only in persistence copy.
