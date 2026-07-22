# Handoff — Mobile system glyphs (done) + map/boards decision (2026-07-15)

Continues the Material-3 mobile work in `HANDOFF_2026-07-14_MOBILE_M3.md`. Two
things this session: (1) the website's **system glyphs** are now rendered in the
mobile app — shipped and verified live on the emulator; (2) scoped the "people
map / group boards" request and the user chose the **"fix the map first"** path —
NOT started yet. Everything is **UNCOMMITTED** on `redesign/knowledge-experience`.

---

## 1. System glyphs — DONE, verified live

**Problem:** the M3 rebuild shipped every reading page as text only. The site's
glyph art (Dreamspell seals/tones, Tzolkin nawales, HD centres/types, zodiac
signs/planets, Hebrew letters) was never wired into mobile — no glyph import
existed anywhere in the app.

**Fix, in order:**

- **svg-transformer** added the safe way — hand-edited `packages/mobile/package.json`
  devDeps (`react-native-svg-transformer@^1.5.3`), then **root `npm install`**
  (never `npm i -w` — that drops nested `react@19` onto root `react@18` and the app
  dies at bundle on `react/compiler-runtime`; confirmed nested react@19 intact after).
  metro.config.js: `babelTransformerPath` → `react-native-svg-transformer/expo`, svg
  moved from `assetExts` to `sourceExts`. `packages/mobile/svg.d.ts` declares `*.svg`.
- **Assets:** all 124 SVGs copied `public/images/{dreamspell,human-design,tzolkin,astrology,gematria}`
  → `packages/mobile/assets/glyphs/**`. They are potrace/inkscape monochrome; every
  one normalized to `fill="currentColor"` so it tints to any M3 flavour. Two fixups
  baked in (already applied to the copies): the 18 HD centres were `#E94E77`/`#FAF8F5`
  → sed'd to currentColor; `01-aleph.svg` (inkscape, no fill) got `fill="currentColor"`
  on its root. **If you ever re-copy from web, re-apply those.**
- **Generated registry:** `packages/mobile/scripts/generate-glyphs.mjs`
  (`npm run gen:glyphs`) scans the folders → `assets/glyphs/glyphs.gen.ts` typed maps.
  Same "generated, not authored" contract as the M3 palette — **don't hand-edit the
  .gen file.** Numbered sets keyed by number; nawales keyed by Kʼicheʼ slug; HD
  centres keyed by slug + `{base, defined}`.
- **Component:** `packages/mobile/src/components/glyph.tsx` — one `<Glyph>` with a
  typed union: `seal|tone|sign|letter|tzolkin|planet|element|hdType|center` + `size`
  `color` `opacity`. Renders via `createElement` **not JSX** (the `react-hooks/static-components`
  lint rule bans rendering a component held in a local var — this trips an *error*, not
  a warning; keep the createElement form). The one non-obvious mapping: `tzolkin` takes
  the Yucatec day-sign **number** (1-20, Imix-first) and routes through `NAWAL_BY_TZOLKIN`
  to the Kʼicheʼ nawal slug, because the nawal set starts at Batz, not Imix — indexing
  the file number directly would show the wrong glyph. Source of that mapping:
  `src/lib/docs/content.ts` `nawales.dayNames`.

**Wired into (11 files):**
- 5 reading pages — `person/{dreamspell,tzolkin,human-design,astrology,kabbalah}-page.tsx`.
  Dreamspell: header seal (in the seal's own colour) + tone mark + a seal in every
  oracle-cross cell. Tzolkin: the day-sign nawal. HD: type glyph in header + the nine
  centre glyphs **replacing the old dots** (defined→flavour accent, open→outline). Astro:
  sign glyphs over the big-three + planet-glyph & sign-glyph per ephemeris row. Kabbalah:
  the Hebrew letter glyph per breakdown cell (`letterId`→1-22, finals fold to base).
- 4 surfaces — `app/(tabs)/people.tsx` (seal badge on every avatar), `app/(tabs)/index.tsx`
  (seal on the "your kin today" card, uses `prediction.seal`), `components/map/node-card.tsx`
  (seal beside the tapped person), `components/circles/circle-sheet.tsx` (seal badge on
  member avatars). Identity marks tint `FLAVORS.dreamspell.accent` for legibility on both
  themes; the shape differs per person so colour can stay uniform.

**Verified:** typecheck 0 · lint 0 errors (same 6 pre-existing warnings — the
`circle-sheet:154` one is pre-existing, just shifted by added lines) · 1117/1117 tests ·
**Metro bundled 5830 modules, 0 errors** (proves all 124 svg imports compile). Then
**walked it live on the emulator** — Dreamspell/Tzolkin/HD/Astrology reading pages,
people-list badges, map node-card all render and tint correctly. Kabbalah letters not
eyeballed only because the test person has no Hebrew name (honest empty state); same
`<Glyph>` path, high confidence. Screenshots dropped in `/tmp/glyph-*.png` (transient)
and a private artifact gallery was published for the user.

**Memory written:** `[[mobile-glyph-system]]` in the auto-memory index.

---

## 2. Map / "boards for groups" — RESEARCHED, decision made, NOT started

User: "the map is still not good. look at the web people map, we can also create
boards for groups. copy this implementation to the mobile app?" Then chose scope
**"Fix the map first"** and asked for this handoff before continuing.

**What the web "boards" actually is** (Explore-mapped, don't re-research):
- A Figma/Miro-style infinite canvas built entirely on **`@xyflow/react` (React Flow)
  v12** — DOM + SVG + CSS transforms, **no RN equivalent**. Route `/app/boards` (list)
  + `/app/boards/[id]` (editor) + `/shared/[token]` (public viewer).
- **Two parts are dead scaffolding:** the custom node components (`canvas/nodes/*`) are
  NOT registered as `nodeTypes`, so every node renders as a generic React-Flow default
  box; and `board-templates.ts` `generateCanvasFromTemplate` (people→nodes auto-layout)
  is fully implemented + unit-tested but **only ever called from its test** — the create
  flow writes an empty `DEFAULT_CANVAS`. So there is no live web path for a person to
  appear as a node. "Copy it" would mean copying a half-wired feature.
- **Portable bits:** the domain types (`src/lib/types/board.ts` — `CanvasNode` union,
  `CanvasConnection`, `CanvasState`, `Layer`) and the `canvas-context.tsx` state engine
  (undo/redo, CRUD, no library) are library-agnostic. Only `canvas-editor.tsx` + the
  `<Handle>`/edge internals are React-Flow-bound.
- **Persistence:** `boards` + `board_shares` Postgres tables, owner-scoped, `canvas`/`layers`
  as jsonb. API `/api/boards` (GET/POST), `/api/boards/[id]` (GET/PATCH/DELETE — PATCH is
  the auto-save), duplicate/recent/shares. **`boards` has NO `group_id`** — boards and
  groups are unlinked on the backend, so "boards for groups" needs either a migration or
  a groupId stored inside the canvas JSON.

**What mobile already has** (the hard RN part is solved):
- `app/(tabs)/map.tsx` + `components/map/relationship-graph.tsx` — a real **Skia canvas**
  (`@shopify/react-native-skia`) force-settled constellation: pinch/pan/tap via
  `react-native-gesture-handler`, node positions in Reanimated shared values
  (`components/map/use-force-layout.ts`), typed edges, seal-star nodes, node card, compare
  flow, filter chips. Self is pinned; **no drag, no persisted layout** — pure simulation.
- `api-client` has a `Board` type + `client.boards` but it's **list/recent only
  ("v1 read-only on mobile")** — no create/save. `useGroups`/`useGroup`/`useSetGroupMembers`
  exist (circles).

**The chosen next step ("fix the map first"):** upgrade the existing Skia map so you can
**drag a star and it stays** (persist one layout), and tighten pan/zoom/select. Boards-for-
groups is deferred to a follow-up. Suggested approach (not yet built):
- Add a drag gesture per node that writes into the same Reanimated position and, on release,
  freezes that node (pin it, like self) so the force sim stops moving it.
- Persist the pinned positions. Cheapest path with zero backend work: a single board row
  via the boards API used as the user's "map layout" (store `{personId: {x,y}}` in
  `canvas`), OR local persistence (expo-secure-store/AsyncStorage) if you want to avoid
  adding board-write methods to the api-client. **Decide this first.**
- The user's "not good" was never pinned to a specific defect — worth asking what bugs them
  (too sparse? interactions? no agency?) before polishing blind. My read: it's that the map
  is a fixed auto-constellation with no user control — drag+save is the fix.

---

## 3. Tree / commit guidance

Still the shared dirty tree with the site session. **This session's files only:**
- Modified: `packages/mobile/{metro.config.js, package.json, package-lock at root}`,
  `packages/mobile/src/app/(tabs)/{index,people}.tsx`,
  `packages/mobile/src/components/{map/node-card,circles/circle-sheet}.tsx`,
  `packages/mobile/src/components/person/{dreamspell,tzolkin,human-design,astrology,kabbalah}-page.tsx`.
- New: `packages/mobile/assets/glyphs/**` (124 svgs + `glyphs.gen.ts`),
  `packages/mobile/scripts/generate-glyphs.mjs`, `packages/mobile/src/components/glyph.tsx`,
  `packages/mobile/svg.d.ts`. Plus root `package-lock.json`.
- **NOT mine** (pre-existing from the M3 session, don't sweep into a glyph commit):
  `person/{flavor-tabs,insights,scaffold}.tsx` (M), `person/{bodygraph,bodygraph-layout}.{tsx,ts}` (??),
  and everything the earlier handoffs list. Commit by explicit path, never `git add -A`.
- Per user's global rule: **no Claude/Anthropic co-author trailers** on commits.

## 4. Environment state

- **Emulator:** I cold-rebooted the `pleiad` AVD with `-dns-server 8.8.8.8` because its
  DNS was dead this session (raw IP ping worked, hostname resolution timed out → app hung
  on "Preparing your sky" waiting on `pleiad.io/api`). It's up as `emulator-5554`, DNS
  resolves, app is authed and past the gate. SDK lives at
  `/opt/homebrew/share/android-commandlinetools` (AVD `pleiad`) — **never conclude "no SDK"
  from `~/Library/Android`**.
- **Metro:** running on :8081 in **CI mode** (`CI=1 npx expo start -c`, reloads disabled).
  For watch mode, kill it and restart without `CI=1`. Config changed this session, so any
  restart must be `-c` (clean) once.
- Dev build `app.pleiad.mobile` installed; connect the dev client to `http://localhost:8081`
  (adb reverse tcp:8081 is set) — it forgets the URL across force-stop.
