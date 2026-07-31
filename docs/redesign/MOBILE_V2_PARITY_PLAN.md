# Mobile V2 Parity Plan — mirror the web V2 into the native app

**Branch:** `redesign/knowledge-experience` (unpushed).
**Scope:** everything shipped in the web V2 sprint (issues #57–#59, #65,
#67–#80 + commits `74b81c8`, `d53dde9`) must exist on `packages/mobile`,
in the mobile grammar, verified on a real emulator.

**Authorities (read before touching a phase):**
- `docs/redesign/APP_DESIGN_CONTRACT.md` — §type is law (no mono in UI chrome).
- `specs/mobile/DESIGN_LANGUAGE.md` — mobile M3 grammar.
- `docs/redesign/HANDOFF_2026-07-29_V2_BOARD_CLEAR.md` — what web shipped.
- `packages/mobile/AGENTS.md` — **Expo 57 docs are mandatory reading**
  (`https://docs.expo.dev/versions/v57.0.0/`) before writing RN code.

**Non-goals:** no new engine math (all of it exists), no web changes except
the one shared-module move in P0, no store/launch work (#60/#63/#64).

---

## 0. Parity matrix (source of truth for "done")

| # | Web V2 feature | Web location | Mobile today | Gap |
|---|---|---|---|---|
| 1 | Preferred systems (17 keys) drive tabs + board + brief | `src/lib/system-preferences.ts`, `/app/settings` | settings has **6** toggles; tabs + board **ignore** prefs | **P1** |
| 2 | Today board 11 rows | `/app`, `today-board.ts` | 11 rows ✅, taps ✅ | filter by prefs (P1) |
| 3 | Calendar detail pages ×6 | `/app/calendars/{hebrew,hijri,persian,chinese,panchang,long-count}` | bundled **text docs** only, no live converter | **P2** |
| 4 | Dreamspell calendar (month + 13 Moons) | `/app/calendar` | `/calendar` ✅ static-verified only | emulator walk (P9) |
| 5 | Numerology suite + pair reading | `/app/numerology` | person tab ✅, **no pair reading** | **P3** |
| 6 | BaZi four pillars | `/app/bazi` | person tab ✅ (gender toggle ✅) | verify only |
| 7 | Gene Keys Golden Path | `/app/gene-keys` | — | **P3** |
| 8 | Personality frameworks (entry + compare) | person tab + couple map | — | **P3** |
| 9 | Oracles: 78 tarot / 64 hexagrams / 24 runes | `/app/oracles` | daily card on Today only, **no browser** | **P4** |
| 10 | Tree of Life (10 sefirot, 22 paths) | `/app/tree-of-life` | — | **P5** |
| 11 | Learning Library — 12 Q&A articles | `/app/library`, `/app/library/[slug]` | 12 system+calendar docs, **no articles** | **P6** |
| 12 | Global search (⌘K) over pages/people/reference | `src/lib/search/search-index.ts` | — | **P7** |
| 13 | Favorites (star any page, pinned list) | `profile.preferences.favorites` | — | **P7** |
| 14 | Couple map full sections | `/app/pair/[id1]/[id2]` | pair screen missing Born-under / Names / Personality | **P3** |
| 15 | Gating alignment (#80) | `usePlan()` + LockedPage | locks non-dreamspell tabs by construction | audit new surfaces (**P8**) |
| 16 | Typography (#57) | 27 files + `m3.ts` | ✅ done | grep guard (P9) |
| 17 | Digest opt-out + every-system brief | `d53dde9` | settings toggle exists; brief is server-side | verify copy (P1) |

Educational surfaces (calendars, tree, oracles, library) are **free on
purpose** — PRD's "articles" tier. Do not gate them.

---

## Phase P0 — shared foundations (no user-visible change)

1. Move the preference resolver to the shared package:
   `packages/engine/src/services/system-preferences.ts` holding
   `SystemKey`, `ReadingSystemKey`, `CalendarSystemKey`,
   `DEFAULT_SYSTEM_PREFERENCES`, `resolveSystemPreferences`.
   `src/lib/system-preferences.ts` becomes a re-export (web imports
   unchanged, zero churn). Mobile imports
   `@pleiad/engine/services/system-preferences` — **deep path, the
   `./*` exports map has no barrel for subdirs.**
2. Mobile kit gaps needed downstream, added to
   `packages/mobile/src/components/person/scaffold.tsx` or `components/ui`:
   `Pill`, `Hairline`, `SkeletonRows` (reuse the settings shimmer),
   and a `DetailSheet` built on the existing `m3/bottom-sheet.tsx`.
3. `packages/api-client`: expose `people.patch({ personality })` if the
   client doesn't already carry it (type exists in `types.ts`).

**Accept:** `npx tsc --noEmit` clean in repo root **and**
`packages/mobile`; `npx vitest run packages/engine src/lib` still green.

## Phase P1 — preferred systems everywhere on mobile

- `packages/mobile/src/app/settings/index.tsx`: replace the 6-key local
  `SYSTEM_TOGGLES` with the shared 17-key map, grouped
  **Reading systems** / **Calendars & sky**, same labels as web.
- Person pager (`src/app/person/[id].tsx`): build `TABS` from resolved
  prefs (order fixed, hidden systems dropped, never zero tabs —
  fall back to dreamspell).
- Today screen (`src/app/(tabs)/index.tsx`): filter board rows and the
  oracles card by the same map.
- Settings notifications copy matches web opt-out semantics (`d53dde9`).

**Accept:** toggling a system in mobile settings removes its person tab
and its board row without a reload; web settings and mobile settings
write the identical `preferences.systems` shape (round-trip one profile).

## Phase P2 — calendar detail screens ×6

- New route `packages/mobile/src/app/calendars/[key].tsx` — the mobile
  twin of the web `CalendarDetail` template: live hero (today in that
  calendar), exact converter (date picker → converted parts), holidays
  list with the right eyebrow ("Festivals"/"Observances"/"Notable
  dates"), then the prose already bundled in `lib/library/content.ts`.
- Engine: `@pleiad/engine/calculations/world-calendars` +
  `.../hebrew-calendar` (deep paths).
- Rewire: Today board rows and library docs push
  `/calendars/[key]` instead of `/learn/[system]`; drop the `webPath`
  hand-off for these six.

**Accept:** all six screens render today's date correctly; converter
matches the web page for the handoff's anchors (CNY 2026-02-17,
Nowruz 2027-03-21, Eid al-Fitr 2026-03-20).

## Phase P3 — reading systems: Gene Keys, Personality, pair parity

- **Gene Keys tab** on the person pager from
  `@pleiad/engine/calculations/gene-keys`, riding the bodygraph
  `ActivationSet`. No birth time → `AddDataChip`, never zeros.
- **Personality**: a tab with M3 selects (MBTI, Enneagram, DISC,
  attachment, love languages) + Big Five sliders + VIA, persisted via
  `PATCH /api/people/[id] { personality }` (enum-strict zod already
  server-side — invalid values must never leave the client).
- **Couple map** (`src/app/pair/[id1]/[id2].tsx`) gains the web's
  missing sections: Born under (natal moons), Names (gematria match),
  Personality comparison (`comparePersonalities`, only what both carry).
- **Numerology pair reading** — either on the couple map or a partner
  picker on the numerology tab; match the web's compatibility verdict.

**Accept:** INTJ × ENFP renders a comparison on the mobile couple map;
person with no birth time shows the honest Gene Keys notice.

## Phase P4 — oracles browser

- `src/app/oracles.tsx`: today's three draws (already computed on the
  Today screen — share the memo) **plus** browsable libraries: 78 RWS
  cards, 64 King Wen hexagrams (by trigram), 24 Elder Futhark runes
  (by aett). Tap → detail sheet.
- Today's oracles card links here.
- Data comes from the engine libraries (`calculations/oracles` + the
  card/hexagram/rune data modules) — no duplicated content.

**Accept:** the same date+user yields the identical draw as web
(FNV-1a over `date:userId` is deterministic across platforms).

## Phase P5 — Tree of Life

- `src/app/tree-of-life.tsx` — `react-native-svg` (already a dep, glyph
  system uses it): 10 sefirot + 22 paths, Kircher letters, tap a node
  or path → panel with gematria value. Page states GRA/Ari draw
  differently, same as web.

**Accept:** every node and path is tappable; letter values match the
web page.

## Phase P6 — learning library articles

- Port `src/lib/library/articles.ts` (12 typed Q&A articles) into
  `packages/mobile/src/lib/library/articles.ts` (same shape, condensed
  the way `content.ts` condenses the docs — no invented claims).
- Library tab gains an **Articles** section; route
  `src/app/learn/article/[slug].tsx`.

**Accept:** all 12 articles open and scroll; no truncated bodies.

## Phase P7 — search + favorites

- **Search**: `src/app/search.tsx` — a mobile screen (top-app-bar search
  field, not a modal palette), over pages + live people + the generated
  reference entries. Reference joins at ≥2 chars, same rule as web.
  Entry point: search icon in the Today top app bar.
- **Favorites**: `profile.preferences.favorites` via the existing
  profile PATCH. A star action in the screen headers of every
  favouritable route + a pinned section on the Library tab.

**Accept:** starring on mobile shows up in the web sidebar and vice
versa (same preference key).

## Phase P8 — gating audit

- Mirror `usePlan()`: free = dreamspell only for **readings**
  (numerology, bazi, genekeys, personality tabs gated);
  calendars / tree / oracles / library / search / favorites stay free.
- No flash: treat subscription-loading as locked.

**Accept:** a free account sees locked previews (never blank, never
open-then-snap-shut) on the three paid reading tabs.

## Phase P9 — verification (owed from the last session too)

1. `cd packages/mobile && npx tsc --noEmit`
2. `cd packages/mobile && npx expo export --platform android`
   (**from `packages/mobile`, never repo root** — root resolves the
   wrong entry).
3. Emulator walk on AVD `pleiad` (SDK at
   `/opt/homebrew/share/android-commandlinetools`, `adb reverse` for the
   API): Today board taps ×11, calendar screen (month + 13 Moons), all
   six calendar screens, numerology/BaZi/GeneKeys/Personality tabs,
   oracles browser, tree of life, library articles, search, favorites,
   settings system toggles.
4. Typography guard: grep mobile for `font-mono`/mono roles outside the
   split-flap board.
5. Screenshots → `~/Desktop/pleiad-v2-testing/mobile-v2/<phase>/`.

---

## Gotchas (re-confirmed; do not rediscover)

- Engine imports on mobile **must be per-module deep paths**;
  `@pleiad/engine/calculations` does not resolve.
- React Compiler is **on**: no shared-value writes in JS callbacks, no
  theme closures inside worklets.
- A red screen can be a stale Metro bundle — check the error's source
  line against disk, then `expo start -c`.
- `npm i -w` breaks `react/compiler-runtime` — don't.
- Web dev server for cross-checks runs on **:3100**; `:3000` is another
  project (taro) — never touch it.
- Text glyph buttons are banned; icons are `phosphor-react-native` on
  mobile (lucide is web-only).

## Commit discipline

One semantic commit per phase (`feat(mobile): …`), body naming the web
commit it mirrors. No Claude/Anthropic co-authors. Nothing pushed
without the user asking.
