# Pleiad Mobile — Verification & Testing

Status: PROPOSED (v1). Scenario letters (A–J) refer to USER_FLOWS.md;
screens S1–S19 to MOBILE_APP_SPEC.md. Nothing ships a milestone without its
gate below going green in CI + on-device.

---

## 1. Test pyramid

| Layer | Tool | Scope | Budget |
|---|---|---|---|
| Engine unit | vitest (`packages/engine`) | ALL existing calculation tests move with the extraction and must pass unchanged (currently the repo's correctness core, ~900+ tests incl. engines) | < 60s |
| Client unit | vitest | api-client (zod contracts, error mapping, token refresh), stores, utils | < 30s |
| Component | RN Testing Library + jest | design-system primitives, forms, states (loading/empty/error per S-spec) | < 2min |
| Contract | vitest against dev server | recorded fixtures for every endpoint in DATA_MODEL §2, incl. 401/403/409/410/429 branches | < 2min |
| E2E | **Maestro** (iOS sim + Android emu in CI; real devices pre-release) | flows F1–F12 | < 20min suite |
| Visual | Maestro screenshots → diff on golden screens | S2, S5, S8 (×6 pages), S10, S12, S18 in light of dark-only theme; both platforms, small (SE/compact) + large devices | per PR |
| Perf | Maestro + Flashlight (Android) / Instruments trace (iOS) | see §4 | pre-release |

## 2. Engine parity gate (the trust anchor)

The mobile app must produce IDENTICAL readings to the web.

- Golden-vector suite: 50 fixed birth inputs (edge cases: leap days —
  Dreamspell skips Feb 29 — timezone edges, missing time, missing place,
  pre-1900 + future dates, Hebrew names with finals) → snapshot of all six
  systems' outputs, committed to `packages/engine/goldens/`.
- CI job runs goldens in three contexts: node (web), Hermes (RN runtime via
  jest-hermes or on-device Maestro hook), and against stored
  `computed_results` fixtures from prod version tags.
- Any golden diff = failed build; version bump required to change goldens.
- Kin spot-truths asserted explicitly (e.g. 2000-01-01 → its known kin;
  Jul-26-1987 epoch = Kin 34; the verified "Kin 17 Self-Existing Earth"
  fixture from web smoke tests).

## 3. Acceptance criteria per flow (E2E, Maestro)

| Flow | Pass condition |
|---|---|
| F1/A | Fresh install → anonymous reading ≤ 2s after date entry → Apple sign-in → onboarding with date pre-filled. No network during compute step (airplane-mode variant renders reading, blocks save with designed state). |
| F2/B | Full ritual + all-skips variant both land on Today; partial HD state renders; kill app at step 3 → relaunch resumes step 3. |
| F3/C | Add person ≤ 30s script; live preview chip correct vs golden; optimistic row appears < 100ms; 403 stub → paywall with draft retained; offline → designed inline state. |
| F4/D | Airplane mode, 12 cached people: all six pages render, swipe fps ≥ 55, AI disabled state shown. Free-tier account: pages 2–5 locked+blurred, tap → paywall. |
| F5/E | Compare shows five bars matching engine goldens; save → edge on map; duplicate save → 409 toast + navigation, no crash. |
| F6/F | Seeded 40 people/65 edges: pan+zoom ≥ 55fps (Flashlight), node tap → card < 100ms, filter re-layout completes < 1.5s. |
| F7/G | Analysis numbers match on-device analyzeGroup goldens; complete-tier sees lock on insights; practitioner stub sees full. |
| F8/H | Create link → open token URL on second (logged-out) sim → viewer renders; password/expired/capped/revoked each show designed state (stubbed server states); revoke updates list + kills link. |
| F9/I | Scheduled local push (stub) deep-links to Today; split-flap completes ≤ 1.2s; reduced-motion device setting → static board (assert no flip animation nodes). |
| F10 | Search stub returns results → tap lands in doc anchored; empty corpus → designed empty state; offline → cached docs readable. |
| F11/J | Paywall from each trigger shows trigger-specific copy; Android checkout browser round-trip stub flips plan within one refresh poll; iOS build shows no external checkout button when flag off (App Review compliance assert). |
| F12 | Sign-out wipes: relaunch shows S2, MMKV user instance empty (hook assertion), tokens gone. |

Cross-flow asserts (run in every E2E): no raw error strings ever visible
(scan screen text for "Internal error", "undefined", "NaN"); every screen
reachable in ≤ 3 taps from a tab; deep link while logged-out parks target
and resumes after login.

## 4. Performance gates (pre-release, real devices: iPhone 12, Pixel 6a)

| Metric | Budget |
|---|---|
| Cold start → Today interactive | ≤ 2.5s (Android mid-tier), ≤ 1.8s (iOS) |
| Add-person sheet open | ≤ 250ms |
| Reading compute (all six) | ≤ 400ms on-device |
| Map 40 nodes | ≥ 55fps sustained pan |
| JS thread stalls | no frame > 250ms during E2E suite |
| App size | ≤ 60MB iOS / ≤ 40MB Android |
| Memory | ≤ 350MB during map + video screens |
| Battery/ambient | hero video pauses when tab blurred (assert via player state) |

## 5. Design-conformance checklist (manual + snapshot, per milestone)

- Colors sampled from goldens match DESIGN_LANGUAGE §1 hexes exactly
  (automated: pixel-probe on visual snapshots at token swatch screen).
- Text emphasis only at 90/70/50/35 white alphas (lint rule on theme usage;
  raw `rgba(255,255,255,…)` outside tokens = lint error).
- Numerals mono everywhere (component test: StatNumber font assertion).
- No emojis in UI strings (lint rule).
- Reduced-motion audit: toggle OS setting → walk S5, S8, S10, S18 — zero
  decorative animation (recorded once per release).
- Haptics fire on: primary save, reading reveal, destructive confirm — and
  nowhere else (device checklist).
- Safe areas on notch + home-indicator devices; RTL smoke (I18N-M2 gate).
- Accessibility: VoiceOver/TalkBack pass on F1–F4 (labels on all
  touchables, reading pages announce system name), contrast AA for all
  text-on-flavor pairs, touch targets ≥ 44pt.

## 6. Security verification

- Tokens only in secure-store (static scan + runtime assert).
- MMKV encrypted; key in secure-store (unit test on storage bootstrap).
- No birth data in analytics payloads (contract test on track() wrapper).
- Cert pinning decision documented (v1: no pinning, rely on TLS; revisit).
- Share viewer never renders owner_id/password_hash even if server
  regresses (client projection test with poisoned fixture).
- Bearer tokens never logged (Sentry scrubber test).

## 7. Milestone gates (maps to MOBILE_APP_SPEC §9)

| Milestone | Gate |
|---|---|
| M0 | Engine extraction: web build green + all existing tests pass from `@pleiad/engine`; golden vectors committed; AUTH-M1 verified with a curl bearer call against dev |
| M1 | F1–F4 E2E green both platforms; engine parity gate green on Hermes; design checklist pass on S2/S5/S8 |
| M2 | F5–F7, F9 green; perf gate on map + cold start |
| M3 | F8, F10–F12 green; security checklist; store-compliance review (IAP posture) |
| M4 | Full suite on real devices; visual goldens signed off; crash-free ≥ 99.5% across 1-week beta; store metadata + screenshots from golden screens |

## 8. CI

GitHub Actions: lint + typecheck + unit/component on every PR; contract
tests against ephemeral dev server; Maestro cloud (or macOS runner + emu)
nightly and on release branches; EAS Build per milestone tag; goldens job
blocks merge on engine diff.
