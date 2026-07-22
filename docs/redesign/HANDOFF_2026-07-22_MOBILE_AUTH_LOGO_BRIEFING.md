# Handoff — mobile auth migration, seal logo, briefing engagement (2026-07-21 → 07-22)

Branch `redesign/knowledge-experience`. Continues
`HANDOFF_2026-07-21_APPSTORE_REVENUECAT_LOGO.md`. Memory:
[[mobile-auth-supabase]], [[appstore-revenuecat-state]], [[android-emulator-driving]].

**3 commits landed this session (local, NOT pushed):** seal logo, mobile
Auth0→Supabase auth, briefing engagement (+ a fault-isolation fix). Deployed to
prod (opennext builds the working tree, so the ~147 uncommitted parallel-session
frontend files also shipped).

---

## 0. TL;DR
- **THE BIG FIX — mobile app now works.** It was authenticating via **Auth0**;
  the backend only accepts **Supabase** tokens → every authed call 401'd
  ("The sky is out of reach / couldn't load your profile"). Migrated
  `packages/mobile` to Supabase. **Verified signed-in end-to-end on the Android
  emulator** — real data loading (Today across six systems, People, Library).
- **Logo → the Six-System Seal everywhere** (web favicon/og/manifest icons, web
  nav mark, mobile nav mark, mobile app icon which had been the default Expo logo).
- **Email fix:** briefing/alert emails to hi@saharbarak.dev had stopped — the
  cron worker `omnisx-cron` had a stale `CRON_SECRET` (deployed 2026-07-05,
  before the rotation). Synced it live. Resumes on the nightly run.
- **Briefing now reports engagement:** People on maps + users-with-readings.
- Usage snapshot (prod, live): **10 users, 21 people on maps, 8/10 built a map,
  3/10 pulled readings**.

---

## 1. Mobile auth: Auth0 → Supabase (DONE, verified)
Root cause: `src/lib/auth-server.ts` `requireUserId` validates only Supabase
(`supabase.auth.getClaims`); mobile sent Auth0 tokens (audience
`https://api.pleiad.app`). Web had migrated; mobile never did. Worker has
Supabase secrets, zero Auth0.

Changes in `packages/mobile`:
- **New** `src/lib/supabase.ts` — client, `flowType:'pkce'`, `persistSession:false`,
  **SecureStore-backed storage** (PKCE verifier survives reloads).
- **New** `src/lib/auth/supabase-auth.ts` (replaces deleted `auth0.ts`):
  `loginAsync` (Google OAuth — unused until provider enabled),
  `requestEmailCodeAsync`, `verifyEmailCodeAsync`, `exchangeCodeAsync`.
- `store.ts`: `signIn` (Google), `requestEmailCode`, `verifyEmailCode` (accepts a
  6-digit OTP **or** a magic-link code/URL → `exchangeCodeForSession`).
- `login.tsx`: **email one-time-code** UI (email → code/link → verify). Email/Apple
  buttons removed per "only gmail"; Google button code kept, dormant.
- `.env`: Auth0 vars → `EXPO_PUBLIC_SUPABASE_URL=https://vgqncswfgetxwujrfavb.supabase.co`
  + `EXPO_PUBLIC_SUPABASE_ANON_KEY` (public, gitignored). `env.ts` updated.
  Added `@supabase/supabase-js` + `react-native-url-polyfill` (via `expo install`).

**Key gotcha:** Supabase's default OTP email sends a **magic LINK to the Site URL
(pleiad.io/?code=UUID), NOT a 6-digit code**. So the verify step
`exchangeCodeForSession(code)` rather than `verifyOtp`. For a real 6-digit code,
add `{{ .Token }}` to the Magic Link email template.

**Login test that works today:** email → app sends a link email → paste the
`?code=` value (or whole URL) into the app → signed in.

---

## 2. Logo → Six-System Seal (DONE)
- Web: `public/favicon.ico`, `apple-touch-icon.png`, `og-image.png`,
  `icons/icon-{192,512,maskable-512}.png`; `src/components/brand-mark.tsx`.
- Mobile: `packages/mobile/assets/images/*` (icon.png opaque-1024, android
  adaptive fg/bg/monochrome, splash, favicon); `app.json` `ios.icon` repointed off
  the Expo `.icon` bundle; `src/components/brand-mark.tsx`.
- **ASC app icon shows the seal only after a new EAS build is uploaded** (ASC
  pulls the icon from the binary — there's no upload field).

Design assets + a picker artifact were generated in scratchpad; the chosen mark is
the plain vector seal (seed-of-life rosette + core star). Icon generators:
`scratchpad/gen-install-seal.mjs` (web), `gen-mobile-icons.mjs` (mobile).

---

## 3. Email: cron fix + briefing engagement (DONE)
- **Cron fix:** `wrangler secret put CRON_SECRET --config workers/cron/wrangler.jsonc`
  (synced to the app's rotated value). The app endpoints themselves were fine
  (`/api/cron/daily-briefing` returns 200/sent). The cron WORKER had the stale
  secret → nightly 401s → silent no-send.
- **Briefing engagement:** `UsersData` (+peopleTotal, activeUsers, usersWithReadings)
  in `src/lib/services/briefing/types.ts`; computed via **raw SQL** in
  `systemUserStats` (`src/lib/db/repositories/briefing-repo.ts`), **fault-isolated
  in its own try/catch** so it can never blank the user section; rendered in
  `src/lib/email/daily-briefing.ts` `usersBlock`.
- ⚠️ **Briefing endpoint is SLOW** — external SEO/GSC/backlinks fetches hang (seen
  a 5-min stream timeout). It's fault-isolated and still sends, but add per-source
  timeouts so a slow API can't stall the email / risk the cron wall-time limit.

---

## 4. Deploy / commit state
- 4 commits, local, **not pushed**: `feat(brand)` seal logo, `feat(mobile)` auth
  migration, `feat(briefing)` engagement, `fix(briefing)` fault-isolation.
- Deployed via `npm run deploy` (opennext → prod). `/api/health` 200.
- The ~147 uncommitted parallel-session frontend files (learn/*, app/*,
  landing-v2/*) are untouched but **did ship** (deploy builds the working tree).
- Cron worker NOT redeployed (only its secret synced, applied live).

---

## 5. Build/run the mobile app
- Emulator AVD `pleiad`; boot `emulator -avd pleiad -no-snapshot-load`.
- `expo run:android` needs `JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home`.
  `android/` is gitignored (prebuild regenerates it — safe to rebuild).
- Dev client connects to Metro at `10.0.2.2:8081` (or `adb reverse tcp:8081 tcp:8081`);
  deep link `exp+pleiad://expo-development-client/?url=http%3A%2F%2F10.0.2.2%3A8081`.
- Login flow captures + the store screenshots are in `scratchpad/shots/store/`.

---

## 6. OPEN THREADS (next session)
1. **Store screenshots + webreels** — 5 real screens captured
   (`scratchpad/shots/store/{today,people,map,circles,library}.png`), but Map &
   Circles are empty states. For polished shots: add a few people so the map draws
   its graph, then device-frame + headlines + cut a reel. A real creative task —
   do it fresh, not at low context.
2. **RevenueCat wiring** — the 4 IAP products exist in ASC (user created them last
   session). Still need `REVENUECAT_SECRET_KEY` (user, from RC dashboard → API
   keys → into `.prod.vars`), then: import products → entitlements
   (`explorer|complete|practitioner|lifetime`) → offering → webhook secret
   (`/api/billing/webhook`) → `STORE_PRODUCT_*` → redeploy. See
   [[appstore-revenuecat-state]].
3. **Enable Google in Supabase** to switch email→Google login: Google Cloud OAuth
   client (redirect `https://vgqncswfgetxwujrfavb.supabase.co/auth/v1/callback`)
   → Supabase Auth → Providers → Google (id+secret) → add redirect
   `pleiad://callback` to allowlist. User only (credentials); the `signIn` (Google)
   path is already coded and dormant.
4. **Push the 4 local commits** when wanted on the remote.
5. **Briefing endpoint timeouts** (§3) — add per-source fetch timeouts.
6. **Copy drift:** mobile says "five wisdom systems / Kabbalah"; web says six
   (adds Long Count). Pick one.
7. **aside browser** unreliable this session: works only with an Aside account
   signed in AND an open Aside browser window with the extension connected for the
   active profile; the CLI can't bootstrap either. Prefer the emulator + adb.
