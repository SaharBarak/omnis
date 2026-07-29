# Handoff — V2 board cleared: phases C–E, digest fix, board closes (2026-07-29, /loop session)

Branch `redesign/knowledge-experience`, all commits UNPUSHED. Follows
HANDOFF_2026-07-29_BUGS_V2_COUPLES_E2E.md (same day, earlier session) — read
that one for the E2E harness and typography law. This session ran as a /loop
and closed **every remaining V2 issue**: #59 #69 #71 #72 #73 #74 #75 #76 #77
#78 #79 #80 #65 + the #66 meta-issue. Two perf commits (7702291, fe3f54f)
from the parallel session are interleaved — not mine.

## 1. SHIPPED (commit → what)

| Commit | What |
|---|---|
| 38b7fb6 | #71 five calendar pages on the #70 template (`/app/calendars/{hijri,persian,chinese,panchang,long-count}`). Engine `world-calendars.ts`: Intl date parts + holiday tables scanned forward like hebrew-calendar.ts. Real-date test anchors: CNY 2026-02-17, Nowruz 2027-03-21, Eid al-Fitr 2026-03-20. Chinese leap months arrive from Intl as "Sixth Monthbis" → can never false-match festival tables. Template grew optional `holidaysEyebrow` ("Festivals"/"Observances"/"Notable dates"). |
| e19dda6 | #69 web: every Today-board row taps through (Sun→/learn/astrology, Sidereal+Panchang→panchang page, rest→their pages). Gate row stays inert — no target page exists. |
| d0a659c | #69 mobile: `BoardRow` gained `system` (→ /learn/[system]) and `href` (wins, → any route). Six calendar docs added to the bundled library (`lib/library/content.ts`) with `webPath` pointing the codex handoff at /app/calendars/* instead of /learn/*. Moon row inert — no mobile destination. |
| 750358d | #59 web: engine `thirteen-moon.ts` — 13×28 ring from each July 26; July 25 = Day Out of Time, Feb 29 = 0.0 Hunab Ku, both OUTSIDE the count (same skipped leap day as dateToKin, so kin and moon-day stay phase-locked; test proves Feb 28→Mar 1 consecutive). `/app/calendar` gained Month \| 13 Moons toggle. |
| 426571c | #59 mobile: `/calendar` screen (month grid + 13-Moon ring in 7-col radial weeks, shared detail card). Kin board row → /calendar. Engine imports on mobile MUST be deep paths (`@pleiad/engine/calculations/dreamspell`) — the package exports map has no `./calculations` barrel entry. |
| 6550809 + 87c731f | #72 numerology: engine `numerology.ts` (Life Path master-preserving, Y-as-vowel only in vowelless words, pinnacles first-window = 36 − Life Path, challenges fully reduced, personal Y/M/D on the universal year, compatibility via element triads). Non-Latin names → null name-numbers, never garbage. Web `/app/numerology` (person chips + pair reading) + mobile person-pager tab (7th, emerald). |
| 20ad33e | #73 BaZi: sexagenary day is pure JDN arithmetic — stem = 1+(JDN−1) mod 10, branch = 1+(JDN+1) mod 12, anchor 2019-01-27 = jiǎzǐ @ JDN 2458511 **verified against ytliu0.github.io** plus its 1781 worked example. Solar year flips at Li Chun (sun 315°), NOT the lunisolar new year. Five Tigers (month stems), Five Rats (hour stems; late-zi keeps the civil day — documented convention choice). Luck decades need a gender people don't carry → UI toggle. Web page + mobile tab. |
| fc2111d | #74 oracles: data libraries (78-card RWS deck, 64 King Wen hexagrams + 8 trigrams, 24-rune Elder Futhark by aett) + `oracles.ts` deterministic draws — FNV-1a over `date:userId`, salted per oracle. Same reading all day/devices, differs per user. Web `/app/oracles` + mobile Today's-oracles card. |
| 3fe776b | #75a Gene Keys: 64-key spectrum table + `geneKeysProfile()` riding the bodygraph's `ActivationSet`. Sphere↔planet per genekeys.com official doc (Venus: design Moon / natal Venus / natal Mars / design Venus / design Mars; Pearl: design Mars / design Jupiter / natal Jupiter). No birth time → no activations → honest notice. |
| 3d89c30 | #75b personality frameworks: **`people.personality` jsonb — migration `0004_people_personality.sql` APPLIED to the live DB** (drizzle-kit numbered it 0003, colliding with the hand-written RLS file; renamed to 0004 + journal tag fixed — the journal never knew about the RLS migration). Enum-strict zod on PATCH. Engine `personality.ts`: MBTI Grant stacks derived (not tabled), Enneagram/DISC/attachment/love-languages/Big Five/VIA, `comparePersonalities()` reads only what both carry. Personality tab on person detail (selects + Big Five sliders), Personality section on the couple map. Round-tripped through the real UI: INTJ × ENFP renders. |
| 560e4a9 | #76 Tree of Life: 10 sefirot + 22 paths (Kircher letters; page states GRA/Ari draw differently), interactive SVG (tap node/path → panel), letters carry gematria values from existing data. |
| 83c90b7 | #77 ⌘K search: `src/lib/search/search-index.ts` — pages + live people + ~300 generated reference entries (cards/hexagrams/runes/gene keys/sefirot/letters/seals/holidays/articles). Reference joins at ≥2 typed chars so empty palette stays a navigator. |
| 734ed5e | #78 favorites: `profile.preferences.favorites` via existing PATCH (no table). Route-aware star lives in PageHeader → every authed page bookmarkable for free; sidebar Favorites group. |
| 480415b | #79 Learning Library: 12 Q&A articles as typed TS data (`src/lib/library/articles.ts`), hub + [slug] template, ⌘K integration. **Deliberately not MDX** — next.config.mjs carries the OTHER session's uncommitted work; article shape maps 1:1 to MDX later. |
| 6fcce1c | #80 gating: PLANS paid tiers += numerology/bazi/genekeys (free stays dreamspell-only); new `usePlan()` hook; LockedPage on those 3 pages (no-flash: waits for plan). Educational layer (calendars, tree, oracles, library) free ON PURPOSE — PRD's "articles" tier. Mobile already locks all non-dreamspell tabs → new tabs gated by construction. |
| f82c93c | #65 digest FIX — see §3. Plus `/app/settings/notifications` (the page every digest email footer already linked to; it 404'd until now). |

GitHub: #59 #65 #66 #69 #71–#80 all CLOSED with detailed comments.
Board remaining: #60/#63/#64 (launch — user's) and #61 (BLOCKED — body is
one Instagram reel link behind a login wall; asked user on the issue for
screenshots / a one-line style description).

## 2. VERIFICATION STATE

- Engine + lib + api: **1096/1096 vitest green** (was 683 at session start;
  +11 world-calendars, +10 thirteen-moon, +17 numerology, +16 bazi, +6
  oracles, +5 gene-keys, +9 personality, +5 tree, +3 digest, route tests
  rewritten).
- Every web surface walked authed via Playwright against :3100. Screenshots →
  `~/Desktop/pleiad-v2-testing/{calendar-pages,numerology,bazi,oracles,
  gene-keys,tree-of-life,personality,favorites,library,notifications}/`.
- Playwright is now INSTALLED in `~/Desktop/pleiad-v2-testing/e2e-harness/`
  (`package.json` copied from harness-package.json, `npm install` done) —
  earlier sessions' scratchpad install died with them.
- Mobile: tsc clean + `npx expo export --platform android` bundles (run it
  from `packages/mobile/`, NOT repo root — root resolves the wrong entry).
  **No emulator walk this session** — calendar screen, numerology/BaZi tabs,
  and oracle card are static-verified only. Owed on the next mobile QA pass.
- Migration 0004 verified live: `people.personality` column EXISTS (queried
  information_schema via the `postgres` package — `pg` is not installed).

## 3. THE #65 DIGEST BUG (worth reading — it looked done and wasn't)

The whole pipeline existed (cron worker → route → processor → Resend email +
Expo push, settings UI on mobile) and could not deliver as designed:

1. Worker fired send-notifications ONCE at 08:00 UTC; the route was written
   for hourly invocation.
2. The route hard-limited to 6–9 UTC.
3. The route's "hour gate" (`listAllEnabledSettingsForHour`) only decided
   WHETHER to run — the processor then sent to EVERY enabled user. One 08:xx
   subscriber → everyone gets mail at 08:00; a 14:00 subscriber → never.
4. `daily_digest_time` was matched as UTC while the mobile picker shows local.

Now: worker cron `0 * * * *`; route delegates selection to
`processDailyDigestNotifications(now)`, which matches each recipient's
chosen hour **in their profile timezone** (Intl h23; invalid tz → UTC
fallback, user kept). `DigestRecipient` carries `digestTime` + `timezone`.
Test vector: Jerusalem "11:00" fires at 08:00 UTC in July.
`listAllEnabledSettingsForHour` is now unused by the route (still exported).

## 4. GOTCHAS RE-CONFIRMED / NEW

- Dev server on :3100 died silently twice mid-session (wrangler log line in
  the tail both times). `lsof -ti :3100 || restart` before any Playwright run;
  second death needed `rm -rf .next`.
- First-compile latency on `next dev` breaks naive Playwright waits — a
  route's first hit can take >2s to commit navigation, and `/api/profile`
  took 3.8s cold. Use `waitForURL`/`waitForFunction`, not fixed timeouts;
  two "bugs" this session (palette navigation, favorites persistence) were
  only impatient tests.
- `sendTransactionalEmail` returns `{ok, id}` — NOT `{success}`. Mocks that
  return the wrong shape make sends count as failures silently.
- drizzle-kit numbers migrations from its journal, which does NOT know about
  the hand-written `0003_enable_rls_deny_all.sql` — it generated a colliding
  0003. If you generate again: rename + fix `drizzle/meta/_journal.json` tag.
- `PLANS.free.limits.systems` is `as string[]` but the paid tiers are literal
  tuples — `.includes(string)` needs an `as readonly string[]` cast.
- Engine deep imports on mobile: `@pleiad/engine/calculations` (barrel) does
  NOT resolve under the package's `./*` exports map; per-module paths do.
- The IG reel in #61 is unfetchable (login wall) — don't burn time on it.

## 5. OPEN THREADS, in priority order

1. **Deploy steps (user-gated):** ① `cd workers/cron && npx wrangler deploy`
   — the hourly digest trigger is config-only until deployed (wrangler auth
   EXPIRED). ② Web deploy via `./scripts/deploy-prod.sh` when the branch
   ships. ③ Push the branch — 19 commits local-only.
2. **#63/#64 store launch** — unchanged, LAUNCH_RUNBOOK.md is the source.
3. **#61 mobile mockups** — blocked on user (reel context asked on issue).
4. Mobile QA pass: emulator walk of /calendar screen, numerology/BaZi tabs,
   oracles card, board tap-through. All static-verified only.
5. Mobile parity backlog (deliberately deferred): web-only pages (oracles
   browser, tree of life, library, gene keys, favorites, ⌘K), personality
   display on mobile person pager.
6. Timezone note: digest correctness now depends on `profiles.timezone`
   being real. Web/mobile onboarding should set it (check — default 'UTC').
7. `jwt.test.ts` pre-existing failure (missing mobile test setup) — still
   not from these sessions; excluded from the 1096 sweep (`src/lib` scope).
8. E2E account cleanup someday: `sahar.h.barak+e2e@gmail.com` now also
   carries personality data (INTJ/ENFP on Maya/Noam) and a favorites
   round-trip footprint (cleaned).

## 6. VERIFY-FIRST COMMANDS

```bash
npx next dev -p 3100                              # :3000 is taro — never touch
npx vitest run packages/engine src/lib src/app/api  # 1096 green
# authed smoke (Playwright lives in the harness dir now):
cd ~/Desktop/pleiad-v2-testing/e2e-harness && node run-e2e.mjs
# fire the digest cron locally:
source .env.local && curl -H "authorization: Bearer $CRON_SECRET" \
  http://localhost:3100/api/cron/send-notifications
```

New routes to eyeball: /app/calendars/{hijri,persian,chinese,panchang,long-count},
/app/{numerology,bazi,oracles,gene-keys,tree-of-life,library},
/app/settings/notifications, and the Month|13-Moons toggle on /app/calendar.
