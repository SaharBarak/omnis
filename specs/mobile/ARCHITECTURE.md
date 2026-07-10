# Pleiad Mobile — Architecture

Status: PROPOSED (v1 spec) · Targets iOS 16+ and Android 9+ (API 28+).

---

## 1. Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Expo SDK (latest) + React Native**, TypeScript strict | One codebase, OTA updates (EAS Update), managed native modules |
| Navigation | **expo-router** (typed file routes) + native stack | Deep links for free (share tokens, universal links), same mental model as Next.js App Router |
| Animation | **react-native-reanimated 3** (+ shared element transitions) | UI-thread worklets; matches motion spec physics |
| Canvas/graph | **@shopify/react-native-skia** | Bodygraph stroke-draw, natal wheel, force-graph map, split-flap |
| SVG | react-native-svg | BrandMark, seal/tone glyphs |
| Server state | **TanStack Query v5** | Cache, retries, optimistic mutations, offline persistence via `@tanstack/query-async-storage-persister` |
| Local state | zustand (UI-only stores: sheet state, onboarding draft) | Minimal; no server data in stores |
| Auth | **react-native-auth0** (Auth0 native PKCE) + expo-secure-store for tokens | See §3 |
| Storage | expo-secure-store (tokens) · MMKV (query cache, prefs) | |
| Video | expo-video (poster, muted, pause on blur) | AmbientVideo equivalent |
| Haptics | expo-haptics | |
| Push | expo-notifications (+ backend work item, §6) | |
| Payments | **Paddle hosted checkout via in-app browser** (`expo-web-browser`) — v1 | See §7 store-policy note |
| Analytics | posthog-react-native (same funnel events as web) | |
| Errors | sentry-expo | |
| i18n | i18next (en first; he later — RTL ready from day 1) | |

Forms: react-hook-form + zod (reuse web zod shapes). Dates: date-fns (already in engine deps).

## 2. Repo layout — monorepo extraction

The engines and static data are pure TS and MUST be shared, not copied:

```
packages/
  engine/            ← extracted from src/lib/calculations + src/lib/data
                       + src/lib/services/{compatibility,synastry,hd-compatibility,
                         predictions,group-analysis,moon}.ts + types
                       deps: circular-natal-horoscope-js, date-fns (both RN-safe)
  api-client/        ← typed fetch client + zod schemas shared web/mobile
  mobile/            ← Expo app (this spec)
  scraper/           ← existing
src/                 ← web app imports engine + api-client from packages
```

Extraction rule: engines keep zero imports from `src/` (no Next, no db). Web
`use-computed-results.ts` re-exports from `@pleiad/engine`. One npm workspace;
tsconfig path aliases; engines get their own vitest run in CI (must stay at
current coverage — they are the product's correctness core).

`packages/mobile` layout:

```
app/                 expo-router routes (see MOBILE_APP_SPEC screen inventory)
  (auth)/            login, onboarding
  (tabs)/            home, people, map, today, library
  person/[id]        modals/, sheets/
src/
  components/        design-system primitives (Panel, Pill, StatNumber, …)
  features/          people/, readings/, map/, circles/, today/, billing/…
  lib/               query hooks, auth, storage, haptics, deep-links
  theme/             tokens.ts (transcribed from DESIGN_LANGUAGE.md)
assets/              fonts, murals, glyphs, videos
```

## 3. Auth — the one required backend change

Today every `/api/*` route authenticates ONLY via the Auth0 encrypted session
cookie (`requireUserId()` → `auth0.getSession()`). A native app cannot use
that. **Backend work item AUTH-M1 (prerequisite for everything):**

1. Auth0: create a Native application (PKCE) + an API "audience"
   (`https://api.pleiad.app`). Enable the same connections (google-oauth2,
   apple, Username-Password-Authentication).
2. Server: extend `requireUserId()` to accept `Authorization: Bearer <JWT>` —
   verify Auth0-issued RS256 access token (issuer + audience + exp) via JWKS
   (cached), map `sub` → user id. Cookie path unchanged; bearer path is
   additive. Same `sub` values → zero data migration.
3. Rate limiting: `authenticatedApi` limiter keys on user id — works as-is.

Mobile flow: `react-native-auth0` Universal Login (system browser, PKCE) →
access token (audience-scoped, ~1h) + refresh token (rotating) in
expo-secure-store → api-client attaches bearer, auto-refreshes on 401 once,
then logs out. Apple Sign-In button mandatory on iOS (App Store rule —
already an Auth0 connection).

## 4. Data flow — compute on device, persist via API

The web already computes all six systems client-side; mobile does the same
with `@pleiad/engine`:

```
birth input ──► engine.computeAll(person)      (on-device, instant, offline)
        │                │
        │                ├──► render readings immediately
        │                └──► POST /api/computed-results (persist, versioned)
        └──► POST /api/people (create person)
```

- **Instant reading**: `computeImmediate` pattern — never wait on network to
  show a chart.
- **Version reconciliation**: on person load, if stored `computed_results`
  version < engine version → recompute + upsert.
- Compatibility, group analysis, predictions, moon: computed on-device from
  cached people (pure functions). Only AI interpretation and knowledge search
  hit the server for content.

### Query layer

- `useQuery` keys: `['profile']`, `['people']`, `['person', id]`,
  `['relationships']`, `['groups']`, `['boards']`, `['subscription']`,
  `['shares']`.
- Mutations optimistic (add person appears instantly; rollback on error +
  toast).
- **Offline-first read**: persisted query cache (MMKV) → the whole people
  library, relationships, groups, and their computed readings are readable
  with no connection. Mutations queue is v1.1 (v1: mutations require
  connectivity, clear inline error otherwise).

## 5. Deep links & universal links

- Scheme `pleiad://` + universal links `https://<domain>/…` (when custom
  domain lands).
- Routes: `/share/[token]` and `/shared/[token]` open native share viewers
  (public API, no auth). `/app/people/[id]` etc. map to native screens.
- Auth0 callback via app scheme.

## 6. Push notifications (backend work item PUSH-M1)

Existing `notification_settings` + cron workers cover email/in-app only.
Add: `device_push_tokens` table (user_id, expo_push_token, platform,
created_at), `POST /api/notifications/devices` register/unregister, and the
`send-notifications` cron fans out to Expo Push API alongside existing
channels. Client: permission prompt AFTER first value moment (never on
launch), settings screen maps to existing `notification_settings` shape.

## 7. Billing on mobile

v1: subscription state is read-only display + Paddle hosted checkout opened
in `expo-web-browser` (external purchase). **Store policy risk**: Apple
requires IAP for digital goods purchased in-app; opening external checkout
for subscriptions can be rejected. v1 mitigation: iOS shows plan status +
"manage on the web" (reader-app pattern); Android may link out (Google's
alternative-billing rules permitting). Native IAP (RevenueCat + StoreKit/
Play Billing mapped onto the `subscriptions` table) is a v2 epic — spec'd as
BILL-M2, not in v1 scope. Entitlements always read from
`GET /api/billing/subscription` — server stays the only truth.

## 8. Performance budget

- Cold start → interactive < 2.5s mid-tier Android; Hermes + inline requires.
- 60fps on all listed animations (Reanimated worklets only; no JS-thread
  animation). Graph: Skia, ≤ 150 nodes before clustering.
- App size: murals served at 3 densities, videos H.264 ≤ 2.5MB × 2; target
  ≤ 60MB iOS / ≤ 40MB Android download.
- Images: expo-image (memory+disk cache, blurhash placeholders from mural
  dominant colors).

## 9. Quality gates

TypeScript strict, eslint (same flat config family), vitest for engine +
lib, React Native Testing Library for components, **Maestro** E2E on both
platforms (see VERIFICATION.md), EAS Build + EAS Submit, GitHub Actions CI.
