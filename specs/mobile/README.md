# Pleiad Mobile — Spec Set

React Native app (iOS + Android) specification, written 2026-07-10 against
branch `redesign/knowledge-experience`. Spec-first: no mobile code exists
yet; implementation starts only after these are reviewed.

## Reading order

1. **MOBILE_APP_SPEC.md** — thesis, scope (v1 vs deferred), navigation,
   screen inventory S1–S19, entitlement matrix, mobile-native moments,
   release plan M0–M4.
2. **USER_FLOWS.md** — flows F1–F12 with API calls, failure branches, and
   acceptance scenarios A–J.
3. **ARCHITECTURE.md** — Expo/Reanimated/Skia/TanStack stack, monorepo
   engine extraction (`@pleiad/engine`), auth design, offline model,
   billing posture, perf budget.
4. **DESIGN_LANGUAGE.md** — locked brand transcribed to RN: colors, type
   ramp, system flavors, motion inventory, component states, asset bundle.
5. **DATA_MODEL.md** — client entities, consumed API contracts, compute-vs-
   fetch matrix, caching/persistence, privacy, backend work items.
6. **VERIFICATION.md** — test pyramid, engine parity goldens, acceptance
   criteria per flow, perf/design/security gates, milestone gates.

## Decisions locked by this spec set

- On-device computation: all six engines are pure TS and ship in the app
  (extracted to `packages/engine`, shared with web). Readings work offline.
- Map is the center tab; add-person capture sheet is the global action.
- Dark only; exact web brand tokens (ground #0B0D16, brand #7D5BC9, Space
  Grotesk / Barlow / IBM Plex Mono); five system flavors unchanged.
- Boards editing, PDF cards, native IAP, offline writes, Hebrew/RTL: v2.

## Hard prerequisites (backend, small)

- **AUTH-M1**: bearer-token (Auth0 JWT) path added to `requireUserId()` —
  the API is currently session-cookie-only; without this no native client
  can call it.
- **PUSH-M1**: device push-token registration + Expo Push fan-out in the
  existing notifications cron.
- **API-M3**: widen `people/[id]` PATCH `birth_place` zod (currently strips
  city/country/timezone).

## Open questions for review

1. iOS billing posture: reader-app pattern (no in-app checkout) acceptable
   for v1, or invest in RevenueCat IAP immediately? (Spec assumes reader
   pattern, feature-flagged.)
2. Anonymous mode depth: full dreamspell reading pre-signup (as web
   /calculate) — confirmed, or gate earlier?
3. Custom domain timing — universal links need it; workers.dev domain works
   for scheme links only.
