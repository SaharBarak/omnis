# Pleiad Mobile — Verification Runbook

How to take the built app from this repo to a verified, production-connected
run. Written 2026-07-10 after M0–M3 landed. Companion: VERIFICATION.md
(gates), README.md (open questions).

## 0. State as of writing

- All build milestones committed on `redesign/knowledge-experience`:
  engine extraction + goldens, api-client, AUTH-M1/PUSH-M1/API-M3 backend,
  mobile M1–M3 (auth, onboarding, people, person detail, map, compare,
  circles, push client, share, library, paywall, settings).
- Static verification green: root typecheck + 1007 tests, mobile tsc,
  iOS Metro export (Hermes bundle).
- NOT yet verified: live login (needs Auth0 native app), prod API from
  mobile (needs deploy + audience secret), on-device visual/E2E runs.

## 1. User-blocking prerequisites (tasks #9, #10)

1. Auth0 (tenant `dev-kaipd4klyg48p0ai.us`):
   - APIs → Create API: name "Pleiad API", identifier
     `https://api.pleiad.app`, RS256.
   - Applications → Create Application → Native: "Pleiad Mobile".
     Connections: google-oauth2, apple (when configured), 
     Username-Password-Authentication.
     Allowed Callback + Logout URLs (comma-join):
     `pleiad://dev-kaipd4klyg48p0ai.us.auth0.com/ios/app.pleiad.mobile/callback,
      pleiad://dev-kaipd4klyg48p0ai.us.auth0.com/android/app.pleiad.mobile/callback,
      exp://127.0.0.1:8081` (Expo Go dev; add LAN exp:// URL shown by
     `expo start` if testing on device).
2. Server env: `npx wrangler secret put AUTH0_API_AUDIENCE` →
   `https://api.pleiad.app`; add the same to `.env.local`.
3. Prod DB: `set -a; source .env.local; set +a; npm run db:migrate`
   (adds `device_push_tokens`, additive).
4. Deploy: `npm run deploy` (ships bearer auth, push routes, birth_place
   fix, GATE board cell).
5. Mobile env: `cp packages/mobile/.env.example packages/mobile/.env` and
   fill `EXPO_PUBLIC_AUTH0_DOMAIN=dev-kaipd4klyg48p0ai.us.auth0.com`,
   `EXPO_PUBLIC_AUTH0_CLIENT_ID=<native app client id>`,
   `EXPO_PUBLIC_AUTH0_AUDIENCE=https://api.pleiad.app`,
   `EXPO_PUBLIC_API_URL=https://omnisx.sahar-h-barak.workers.dev`.

## 2. Local run (Expo Go)

```
cd packages/mobile
npx expo start            # press i for iOS simulator, a for Android
```
Everything used is Expo Go–compatible in SDK 57 (verified: skia bundled,
expo-auth-session PKCE, secure-store, notifications register degrades
silently without an EAS projectId).

Smoke without Auth0: app boots to login (S2). With Auth0 configured:
email login → onboarding ritual → tabs.

## 3. Maestro E2E

```
brew install maestro           # once
cd packages/mobile
maestro test .maestro/01-boot-login.yaml
TEST_EMAIL=... TEST_PASSWORD=... maestro test .maestro/02-login-google.yaml
maestro test .maestro/03-add-person.yaml .maestro/04-reading-pager.yaml
```
Flows 02–04 need the Auth0 prerequisites. Text selectors are used; if
copy changes, flows change (deliberate — copy is part of the spec).
TODO as screens stabilize: add testIDs for the FAB + pager pages and
extend to F5–F12 per VERIFICATION.md §3.

## 4. Engine parity on Hermes

Golden vectors live in `packages/engine/src/goldens.test.ts`. Node run is
in CI (`npm run test`). Hermes run: create a tiny dev screen or use
`npx expo start` console — planned as a jest-hermes CI job (VERIFICATION
§2); until then the iOS export bundling the engine plus on-device manual
spot-checks (Kin on Today vs web /today) cover the practical risk.

## 5. Prod smoke (already run, 2026-07-10, read-only)

Live deploy healthy pre-deploy-of-today's-work: all public pages 200,
/app → 307 login, people/profile/billing APIs 401 anonymous, bearer
rejected (expected until deploy), knowledge search returns [] (corpus
dormant). Post-deploy re-run checklist:
- `curl -H "Authorization: Bearer <token from mobile login>" $B/api/people`
  → 200 `{people:[...]}` (AUTH-M1 live).
- Landing board shows GATE cell.
- POST /api/notifications/devices with bearer → 201.

## 6. Store/build track (M4, not started)

EAS project init (`eas init` — sets the projectId push registration needs),
dev-build profiles, app icons/splash from brand assets, TestFlight/internal
track, store screenshots from golden screens. RevenueCat IAP decision
(BILL-M2) before public iOS release.
