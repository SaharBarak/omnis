# Handoff — board bugs, V2 Phase A+B1, couple map, E2E harness (2026-07-28 → 07-29)

Branch `redesign/knowledge-experience`, all commits UNPUSHED. A parallel
session landed perf commits (3b1ee0c, 7de02bc, 05ba54b) interleaved with
this one — don't be surprised by them in the log.

## 1. SHIPPED (commit → what)

| Commit | What |
|---|---|
| c90768f + **55a9ff1** | #58 bodygraph fits 100svh. TWO commits because the first was silently dead: the chart wrapper's inline `style={{maxWidth:'100%'}}` overrode every `max-w-*` utility — the E2E suite caught it (svg measured 1712px). Lesson: inline styles beat utility classes; the original 400px cap had never worked either. |
| b7dfd31 | #57 typography: IBM Plex Mono OUT of all UI chrome, web (27 files) + mobile (`m3.ts` data\* roles). Labels → Barlow medium micro-caps; ≥xl numerals → Space Grotesk; small numerals inherit Barlow; tabular-nums kept everywhere. Mono survives ONLY: `<kbd>` (2×), split-flap board, bodygraph SVG gate numerals. APP_DESIGN_CONTRACT.md §type + specs/mobile/DESIGN_LANGUAGE.md §2 rewritten to match — they are the law now. |
| 669025e | #67/#68/#69: `engine/calculations/calendars.ts` — Hijri/Persian (Intl, en-GB), Chinese sexagenary year (Intl relatedYear part; CNY boundary correct), sidereal sun (Lahiri linear approx), Panchang (tithi/paksha/nakshatra/yoga/karana/vara at noon UTC). Today board now 11 rows on web + mobile. Test vectors = the PRD's own example Today screen (24 July 2026). |
| 8f9910a | #59 web: /app/calendar Dreamspell month grid (kin/day, seal dots, wavespell panel + 13-kin strip). Sidebar "Calendar" entry. |
| 855e019 + 5bc572b | docs/launch/LAUNCH_RUNBOOK.md + packages/mobile/store.config.json (ASC listing, `eas metadata:push`). Runbook = single source for #63/#64/#60. |
| 686f86f | Couple map: /app/pair/[id1]/[id2] on the engine's FiveSystemCompatibility — both oracles seat-by-seat with partner-occupied seats LIT, bonds list, synastry discriminators, HD types+counts, natal moons, name match, create-board CTA. /api/boards: NEW people-on-board cap by plan profiles limit (on top of board-count cap). Landing §4b "The couple map" Zone (server-computed demo pair). Relationships row menu → "Open couple map". |
| 3e0a42b | #70: `engine/calculations/hebrew-calendar.ts` (date parts + 11 holidays by (month,day) scan) + reusable `CalendarDetail` template + /app/calendars/hebrew (live hero, exact converter, holidays, real educational prose). FlapBoard rows take `href` — Hebrew/Kin/Moon rows tap through (#69 slice). |

GitHub: #57 #58 #67 #68 #70 CLOSED (board auto-Done). #59 #66 #69 In Progress.
V2 breakdown = issues #67–#80 (phases A–E), map comment on #66.

## 2. E2E HARNESS (the big new capability)

PRESERVED in two places: scripts (no secrets) in repo `scripts/e2e/`
(+README), full harness incl. `.e2e-password`/`state.json` at
`~/Desktop/pleiad-v2-testing/e2e-harness/`. Original scratchpad copy dies
with the session. Contents:
- `signup.mjs` — signs in/up the E2E account through the real /login UI.
  Account: `sahar.h.barak+e2e@gmail.com` (Gmail plus-alias), password in
  `e2e/.e2e-password`, Playwright state in `e2e/state.json`. Supabase email
  confirmations are OFF → signup auto-signs-in, no email step needed.
- `run-e2e.mjs` — 17 checks, last run 17/17: landing+couples zone, today
  board 11 systems, typography DOM audit (zero mono leaks), Dreamspell
  calendar grid+wavespell, bodygraph ≤ viewport, couple map (lit analog
  seats: E2E Maya × E2E Noam are mutual analogs by construction), boards
  tier gate (free plan blocked = PASS), Hebrew page ×4.
- Screenshots → `~/Desktop/pleiad-v2-testing/<topic>/` + README mapping
  folder→feature→commit. `_failures/` = fixing-phase shots.
- Needs dev server on **:3100** (`npx next dev -p 3100`). Port 3000 is the
  user's OTHER project (taro) — never kill it.

**Classifier note:** service-role user minting (admin.createUser) is
BLOCKED by the permission classifier. Front-door signup UI is the
sanctioned path — keep using it.

## 3. GOTCHAS RE-CONFIRMED THIS SESSION

- Turbopack phantom: after adding new module trees, dev server can 500 with
  "global-error.tsx not in React Client Manifest". Fix: kill, `rm -rf .next`,
  restart. Not your bug.
- `.prod.vars`: STORE_PRODUCT_* + RC secrets sit DEEP in the file — a
  head-of-file grep lies about staging state.
- Board typography test: long-count-display.test.tsx no longer queries
  `.font-mono` (rewritten to content assertion).
- Tailwind arbitrary `max-w-[min(400px,calc((100svh-8rem)*0.625))]`
  compiles fine (v3.4) — check the ELEMENT for competing inline styles
  before blaming the class.

## 4. OPEN THREADS, in priority order

1. **#63/#64 store launch — USER dashboard steps** (LAUNCH_RUNBOOK.md):
   ① 4 IAP products in ASC (fix group Arabic→English first; tiers
   $4.99/$8.99/$28.99/$78.99) ② RC entitlements (explorer/complete/
   practitioner/lifetime) + offering ③ Play Console app record. Then ME:
   `scripts/set-prod-secrets.sh` + deploy; Circles 5th store shot; review
   store.config.json copy → `eas metadata:push`. EU trader status owed.
2. **#71** — five more calendar pages on the CalendarDetail template
   (Hijri, Persian, Chinese, Panchang, Long Count). Mostly content;
   engine already computes everything except per-calendar holiday tables.
3. **#69 rest** — tap-through for Sun/Sidereal/Hijri/Persian/Chinese/
   Panchang/Long Count rows (blocked on #71 pages) + mobile board taps.
4. **#59 rest** — 13-Moon (13×28) year view + mobile calendar port.
5. **#66 phases C–E** — #72–#80 as broken down.
6. Couple-map polish: oracle seat partner label uses `name.split(' ')[0]`
   ("E2E Maya" → "E2E") — fine for real names, silly for prefixed ones.
7. Pre-existing test-infra failure: `src/lib/auth/jwt.test.ts` wants
   missing `packages/mobile/src/test/setup.ts`. Not from this session.
8. E2E account cleanup someday: delete Supabase user
   `sahar.h.barak+e2e@gmail.com` (its E2E Maya/Noam people go with it).

## 5. VERIFY-FIRST COMMANDS

```bash
npx next dev -p 3100                      # then /app/calendar, /app/calendars/hebrew, /app/pair/<a>/<b>
npx vitest run packages/engine            # 683+ tests
node <scratchpad>/e2e/run-e2e.mjs         # 17 checks, needs :3100 + e2e/state.json
```
