# Handoff — App redesign (web + mobile), 2026-07-14

The authed web app and the mobile app were redesigned to the website's
visual language. **Nothing is committed.** Tree health at handoff:
web typecheck ✓ · mobile typecheck ✓ · **1132/1132 tests ✓** ·
`next build` ✓ 50/50 · iOS Hermes export ✓ · Android emulator boots and
renders (verified live).

Read **`docs/redesign/APP_DESIGN_CONTRACT.md`** before touching anything
under `src/app/app`. Read **`specs/mobile/DESIGN_LANGUAGE.md` §10** before
touching mobile tokens.

---

## 1. The finding that framed the whole job

The app didn't drift on *palette* — `src/app/app/dashboard.css` already
remapped the shadcn vars to the landing's dark violet. It drifted on
**grammar**: stock shadcn components, raw palette hex (20 in group
analysis alone), zero framer-motion, no per-system flavor vocabulary, no
honest-partial states. Meanwhile **`packages/mobile` was already the most
mature expression of this product's UX** — mobile's own tokens file says
it was transcribed *from* the web system.

So the web app was rebuilt in mobile's grammar, and then mobile got the
one thing web had that it lacked (the bodygraph).

---

## 2. Web — `src/components/app-kit` (NEW) is the spine

A component kit ported from `packages/mobile/src/components`, speaking
the landing-v2 language:

| Piece | Role |
|---|---|
| `PageSection` | flavored hairline + accent eyebrow + staggered fade-up (`index` drives delay) |
| `Rise` | bare entrance (PageSection's motion, no chrome) |
| `DataRow` | the universal key/value row — **lists are hairline rows, never nested cards** |
| `MeterBar` | accent fill (scaleX) + count-up numeral; `suffix`/width props |
| `StatNumber` / `StatWord` | tabular-mono numerals / word stats |
| `FlavorTabs` | six-system segmented control, framer `layoutId` pill, accent hairline crossfade |
| `FlapBoard` | split-flap set piece (mobile's deterministic rotateX cascade) |
| `Notice` | the ONE warning/info/error/success banner — the amber copy-paste is dead |
| `LockedPage` | entitlement gate: dimmed real preview, **not** a wall |
| `AddDataChip` | honest-partial path back to the edit form |
| `SkeletonRow(s)/Card` | loading = layout-matched skeletons; **spinners banned** |
| `seal-colors.ts` | the ONE source for dreamspell seal colors (`--seal-*` tokens) |
| `motion.ts` | `EASE_OUT [0.4,0,0.2,1]`, `SPRING {100,20}` — **nothing bounces**; `useCountUp` |

Every page under `src/app/app` was rebuilt on it (dashboard, people,
person detail, groups + analysis, predictions, moon, graph, resonance
matrix, relationships, profile, settings, billing, cards, boards).

**Shell** (`app-shell.tsx`): sticky blurred header carrying the
homepage's mono `pleiad / your-map / <section>` control-chrome
breadcrumb, translucent sidebar over the cosmic ground, brand-glow logo
tile, platform-aware ⌘K / Ctrl K.

### Bugs fixed en route (real, not cosmetic)
- 🔴 **Group edit wiped membership.** `handleEditGroup` fetched the group
  but never passed `initialMemberIds`, so saving an edit called
  `setGroupMembers([])`. Fixed in `groups/page.tsx`.
- 🔴 **Cosmic ground could swallow text.** `html.dash-theme body::before`
  at `z-index: 0` paints *above* all static (non-stacking-context)
  content. Must stay **`z-index: -1`**. Caught by screenshot, not tsc.
- `ArrowRight` was the "Back" icon in the board editor; `h-screen` →
  `h-[100dvh]`; 6 dead framer-motion dashboard components deleted.

---

## 3. Mobile — additive, because it was already 5/5

A full audit of every screen found near-total system adherence: no nested
boxes, all four states everywhere, one spinner in the whole app. So the
work was additive.

- 🟢 **The bodygraph now exists on mobile.** It was text-only, deferred to
  "M2" in a code comment — the last "web has a picture, mobile has a
  list" asymmetry. `components/person/bodygraph.tsx` (react-native-svg,
  already a dep) + `bodygraph-layout.ts`, which is a **verbatim copy of
  `src/components/human-design/bodygraph-layout.ts` — KEEP THE TWO IN
  SYNC.** 36 per-channel lanes, half-channel hanging gates, 64 gate
  marks, design/personality/both activation colors. Hover → **tap-to-reveal**
  (RN has no hover). Verified rendering on the emulator, correctly
  dimmed under `LockedPage` for a free-plan account.
- **Token gaps closed at the source** (`theme/tokens.ts`, spec §10 written
  FIRST — that file's own law): `TYPE.micro` (10pt mono caps) and
  `TYPE.monoValue` (14pt tabular) killed ~12 hand-rolled font sites;
  `COLORS.scrim` collapsed 8 copy-pasted modal scrims; `COLORS.amber`
  gave the app its first caution affordance.
- **`ui/notice.tsx` + `ui/error-state.tsx`** (new) replaced 4 duplicate
  error Panels and the quiet retry lines in settings/share/library.
- Paywall's `GOLD = '#C9A227'` literal → `FLAVORS.integration.accent`;
  last content spinner (place search) → quiet mono "SEARCHING…";
  `flavor-tabs` spring now honors `useReducedMotion`.
- **Onboarding ritual backdrops** landed (the one self-declared
  unfinished visual, `TODO(asset bundle)`): each step wears the mural of
  the system it unlocks, opacity 0.28 under a 0.55 ground scrim,
  crossfading. `assets/mural/`, 2.7MB webp, via `expo-image`.

---

## 4. Emulator gotchas (cost real time — read before debugging RN)

- **A "your code is broken" red screen may be a lie.** We hit
  `Property 'FONTS' doesn't exist` while `tsc` was green and the cited
  source line **did not exist in the file**. Cause: Metro had
  incrementally hot-patched and **cached a half-applied edit**. Fix:
  `npx expo start -c`. Always confirm the error's source line against
  disk before believing it.
- The dev client boots into **DevLauncherActivity**, not your bundle.
  `am start` alone leaves it parked on the launcher screen. Deep-link it:
  `adb shell am start -a android.intent.action.VIEW -d "pleiad://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081"`
  — the scheme is **`pleiad`** (app.json), *not* the bundle id
  `app.pleiad.mobile`.
- `adb` is not on PATH:
  `/opt/homebrew/share/android-commandlinetools/platform-tools/adb`.
  Use `adb reverse tcp:8081 tcp:8081`, not a LAN IP.
- `adb shell input tap` takes **device** coords (1080×2400). Screenshots
  render scaled — multiply by 1.2 or you'll tap nothing.
- RN 0.86: `StyleSheet.absoluteFillObject` is gone from the types — use
  `StyleSheet.absoluteFill`.
- Chrome extension for Claude-in-Chrome was **not connected**, so authed
  web pages could not be screenshotted. Verified via a temporary
  unauthenticated preview route + scratchpad Playwright (route deleted).

---

## 5. Known, deliberately NOT fixed

- **Your 4 test people all have `birth_date = 1990-01-01`** (all read
  `KIN 143 · BLUE COSMIC NIGHT`). That's the date wheel's default. The
  **current code is correct** — `capture-sheet.tsx:230` blocks save when
  `birthDate === null`, the default is display-only, and
  `onboarding.tsx:221` documents this exact bug being fixed. These are
  **legacy rows created before that guard**. Delete and re-add them to get
  real readings.
- `packages/mobile/src/components/person/kabbalah-page.tsx`,
  `metro.config.js`, `package.json` carry **another session's**
  uncommitted changes. Untouched by this work.
- Mural opacity balance (0.28 / 0.55) and bodygraph tap-target sizes are
  bundle-proven but not design-reviewed on a real screen.

---

## 6. Next actions

1. **COMMIT.** ~56 files across two themes, in a tree where another
   session is also working (160 dirty total). Commit **by explicit
   paths** — never `git add -A`. Suggested split:
   - `feat(app): rebuild the authed app in the website's language` —
     `src/components/app-kit`, `src/app/app`, `src/components/{dashboard,predictions,billing,relationships}`,
     `docs/redesign/APP_DESIGN_CONTRACT.md`
   - `feat(mobile): draw the bodygraph, close the token gaps` —
     `packages/mobile/{src,assets}`, `specs/mobile/DESIGN_LANGUAGE.md`
     (exclude the three files the other session owns)
2. Human design pass on `/app` in a browser (I could not screenshot
   authed pages) and on the emulator murals.
3. Metro is still running on **:8081** — kill it when done.
