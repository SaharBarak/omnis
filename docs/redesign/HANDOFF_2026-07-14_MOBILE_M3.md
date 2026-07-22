# Handoff — the mobile app is now Material 3

Date: 2026-07-14 · Branch: `redesign/knowledge-experience` · Scope: `packages/mobile` only

---

## How to commit this

The working tree is **187 files dirty and shared with a parallel site session.**
**Never `git add -A`.** Stage by explicit path.

```sh
# 1. the design system + the whole mobile app
git add packages/mobile specs/mobile/DESIGN_LANGUAGE.md
git add docs/redesign/HANDOFF_2026-07-14_MOBILE_M3.md
git add package-lock.json          # the generator's devDep; see the warning below
# → feat(mobile): rebuild the app on Material 3
```

Two traps in the staging:

- **`docs/redesign/SESSION_HANDOFF.md` is touched by BOTH sessions.** I added the
  M3 section; the site session edited the same file. Committing it sweeps in
  their work-in-progress. Either coordinate, or leave it for whoever commits last.
- **`packages/engine/src/services/group-analysis.ts` was already dirty when this
  session began.** It is not mine. Leave it.

`packages/mobile/package.json` gains one devDependency —
`@material/material-color-utilities@^0.3.0` — used *only* by the palette
generator script, never imported by the app. `0.4.0` ships broken extensionless
ESM and will not load under Node; the `^0.3.0` pin is deliberate.

---

The mobile app was rebuilt on Material 3. Not "M3-inspired" — the colour system,
type scale, shape scale, elevation model, state model, motion system, and
component set are M3's. The bespoke "Pleiad dark cosmic" system it used to wear
is gone, and `specs/mobile/DESIGN_LANGUAGE.md` has been rewritten to say so.

Net: **47 files changed, +3,821 / −4,726.** The app got smaller because eight
sheets stopped hand-rolling the same modal.

---

## Read this first

`specs/mobile/DESIGN_LANGUAGE.md` is the contract and it is short. Everything
below is context for *why*, not a substitute for it.

---

## The colour system is generated, not authored

`scripts/generate-m3-palette.mjs` → `src/theme/m3-colors.ts`.

49 M3 roles × 2 schemes, computed from one seed (`#7D5BC9`, the brand purple) by
Google's `@material/material-color-utilities`. **Never hand-edit `m3-colors.ts`.**
To change the palette, change the seed and re-run the generator.

The variant is `SchemeFidelity`, and that choice is load-bearing: it is the one
variant that keeps faith with the seed, landing `primaryContainer` on `#7D5BC9`
*exactly* and deriving a gold `tertiary`. `SchemeTonalSpot` (the M3 default)
desaturates the brand toward neutral; `SchemeExpressive` rotates the hue to teal
and throws it away entirely.

**Gotcha:** `@material/material-color-utilities@0.4.0` ships broken extensionless
ESM imports and will not load under Node. Pinned to `0.3.0`.

## Domain colour vs theme colour

`src/theme/tokens.ts` no longer holds a design system. It holds **content**: the
six system flavours, the four Dreamspell seals, and the five relationship-type
colours. A red seal is red because the tradition says so — it survives a scheme
flip and a seed change.

The test, applied consistently: *what the app is showing* → `tokens.ts`. *What
the app looks like* → `theme/m3.ts`. A raw hex in a screen is a bug. There are
none left; the only surviving `@/theme/tokens` imports across all 98 files are
`FLAVORS`, `SystemFlavor`, `SEAL_COLOR_HEX`, and `RELATIONSHIP_COLORS`.

## Two deliberate departures from stock Material

Both are in DESIGN_LANGUAGE §7. Both answer "immersive", which stock M3 is not.

**The atmosphere** (`components/cosmic-ground.tsx`). M3's `background` role is
one flat colour. The old implementation tried to do better with two
`borderRadius: 240` Views at 7% opacity — which renders as two hard-edged discs,
because React Native has no radial gradient. Skia does, and it was already in the
bundle for the map. It now paints the `background` role, the `hero-sky.webp`
mural masked into a vertical fade, and two soft radial glows in the seed's own
primary and tertiary, drifting ±6dp over 40s.

**The murals were already there.** `hero-sky.webp` and four `zone-*.webp` files
have shipped in `assets/mural/` since onboarding was built, and **no authed
screen ever rendered one.** They now carry the atmosphere and the Library's six
tradition portals. (Only four of six systems have art — `src/lib/library/murals.ts`
is a deliberately partial map; `undefined` means "fall back to a tonal card", and
tzolkin/integration do.)

**The split-flap board** on Today keeps its flip. One set piece, on the home
screen. M3's motion system objects to a *second* one, not to this.

---

## Bugs found and fixed that predate this work

- **The splash screen was `#208AEF`** — Expo-template blue, flashing before a
  dark app. Now the M3 `background` role.
- **`userInterfaceStyle` was hard-locked to `"dark"`**, which would have made the
  generated light scheme unreachable. Now `"automatic"`; dark remains the
  fallback when the OS expresses no preference, because the product is a night sky.
- **Six touch targets were under the 48dp floor** — four 40×40 icon buttons on the
  person screen, a 20pt settings gear with `hitSlop: 8`, a 42dp dismiss on the map's
  node card. All now clear 48 via the `IconButton` component or `hitSlop`.
- **No screen had pull-to-refresh.** Today, People, and Circles now do.
- **`NodeCard` rendered behind the navigation bar** on the map.
- **`initialsOf` was copy-pasted into nine files.** Now `src/lib/text.ts`.

## Two bugs introduced during the work, caught before landing

Recording these because both are traps the next person can fall into:

- **`useScrollProgress` mutated a shared value from a plain JS callback.** This
  project has the **React Compiler enabled** (`experiments.reactCompiler`), which
  rejects that outright — it was the only lint error in the tree. Rewritten as a
  `useAnimatedScrollHandler` worklet, which is also strictly faster (UI thread, no
  bridge crossing per frame). **Consequence: the six screens using it must use
  `Animated.ScrollView`/`Animated.FlatList`.** A plain one will silently never fire.
- **`useAnimatedStyle` cannot call `theme.surfaceAt()`.** It's a plain JS closure;
  calling it inside a worklet throws on the UI thread. Resolve theme colours on the
  JS thread and close over the result.

---

## Known follow-ups (none blocking)

1. **`TopAppBar` animates `height`**, a layout property. It works, but it re-lays
   out the ScrollView every frame and will show on low-end Android. The clean fix
   is an absolutely-positioned header with padded scroll content. Left deliberately:
   changing that contract mid-migration would have churned every screen.
2. **A snackbar raised while a sheet is open renders behind it** — sheets are
   `Modal`s. Pre-existing behaviour, not a regression; sheets generally close before
   toasting. If it bites, the host needs to move into a portal above the modal layer.
3. **Dynamic colour (Material You) is not wired.** The theme is a runtime-swappable
   object, so it is a small change: `@pchmn/expo-material3-theme` + a settings
   toggle. It needs a dev-client rebuild (native module), which is why it wasn't
   done blind.
4. **8 lint warnings remain**, all one pre-existing class
   (`react-hooks/set-state-in-effect`, the shimmer pattern). Present on `HEAD`
   today in files nobody touched.

---

## Verification status

- `npx tsc --noEmit` → **0 errors**
- `npx eslint src` → **0 errors** (6 pre-existing warnings)
- `npm test` → **1117/1117 passing, 52 files**
- **Run on the Android emulator.** Today, People, Map, Circles, Library, and the
  person reading pager were all walked and screenshotted.

There is still **zero automated coverage of the UI** — the one mobile test
(`jwt.test.ts`) is a pure module, and the vitest runner deliberately excludes
anything importing `react-native`. Everything below was caught by *looking*, and
would not have been caught otherwise.

### Three bugs the emulator caught that every static gate passed

1. **The app would not boot at all.** `npm i <pkg> -w packages/mobile` (used to
   add the palette generator's dep) re-resolved the tree and dropped mobile's
   nested `react@19`, leaving it on the hoisted root `react@18` — and the React
   Compiler needs `react/compiler-runtime`, which 18 does not have. Metro died
   with `UnableToResolveError`. **`tsc` and `eslint` were both green through
   this.** A plain `npm install` at the root restores the nesting.
2. **The navigation bar was laid out wrong.** `TabTrigger` passes its own `style`
   (a row layout) down through `asChild`, and `NavItem` spread it *after* its own
   — so labels sat beside the icons instead of under them, and the fifth
   destination was pushed off the screen. Fixed by pulling `style` out of the
   spread.
3. **"Kin 143 · blue Cosmic Night".** The sentence-case sweep dropped a
   `.toUpperCase()` that had been hiding a lowercase engine value (`seal.color`
   is a `'red' | 'white' | 'blue' | 'yellow'` union). Now `sentenceCase()`'d at
   the four phrase-initial sites — but deliberately **not** in `reading.ts`,
   where the same value is mid-sentence ("the blue seal and a Cancer sun") and
   lowercase is correct.

Also fixed on device: Circles' empty state was showing its own "Create a circle"
button *and* the extended FAB — two primary actions, three inches apart, saying
the same thing. The FAB now stands down whenever an empty state is up.

### To run it yourself

The Android SDK is a brew cask, **not** at `~/Library/Android/sdk`:

```sh
export ANDROID_HOME=/opt/homebrew/share/android-commandlinetools
export PATH=$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH
emulator -avd pleiad &                       # the AVD already exists
cd packages/mobile && npx expo start -c
adb reverse tcp:8081 tcp:8081                # not the LAN IP
adb shell am start -a android.intent.action.VIEW \
  -d "pleiad://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081"
```

Note the Expo dev-client's floating bubble sits exactly on top of the app's
settings gear — that grey gear in the corner of every screenshot is Expo's, not
ours.

### Known cosmetic issues, seen and left

- The map's filter chips and the person screen's segmented button both scroll
  horizontally and clip at the right edge. Correct behaviour (they're scrollable),
  but it reads as truncation on first glance.
- The four test people all carry `1990-01-01`, so they all read as the same kin.
  Legacy rows, not a live bug.
