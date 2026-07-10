# Pleiad Mobile — User Flows & Scenarios

Status: PROPOSED (v1). Screen IDs (S1–S19) refer to MOBILE_APP_SPEC.md §5.
Every flow lists steps, API calls, failure branches, and the acceptance
scenario used in VERIFICATION.md.

---

## F1. First launch → anonymous value → signup

```
S1 splash → S2 welcome
  ├─ "Try one reading" → S3: birthdate wheel → engine computes on-device
  │    → full Dreamspell reading + teaser rows for other 4 systems
  │    → CTA "Save this reading" → Auth0 login → reading carried into
  │      onboarding (birthdate pre-filled)
  └─ Sign in (Apple / Google / email) → Auth0 Universal Login (PKCE)
       → tokens stored → GET /api/profile (bootstraps rows)
       → onboarding_completed? no → F2 · yes → S5 Today
```

Failures: Auth0 cancel → stay on S2, no error toast. Network down at
profile fetch → retry screen with cached-token session kept.

**Scenario A (cold, curious):** Noa installs from a friend's share link,
taps Try, enters 1994-03-21, sees "Kin 172 · Yellow Electric Human" with
oracle in under 2 seconds, no account. Taps save, signs in with Apple,
lands in onboarding with her date already filled. Total ≤ 90s.

## F2. Onboarding ritual

```
S4 steps (each on its system mural, centered — sanctioned exception):
 1 name*            → 2 birth date* (Dreamspell backdrop)
 → 3 birth time (skippable, HD backdrop, "unknown" honest state)
 → 4 birth place (skippable, Astrology backdrop; place search → lat/lng/tz)
 → 5 Hebrew name (skippable, Kabbalah backdrop)
 → PATCH /api/profile {…, onboarding_completed:true}
 → server mirrors self person → engine computes all six
 → REVEAL: your reading assembles system-by-system (stagger + haptics)
 → S5 Today
```

Skips recorded; Today checklist later nudges "add birth time → unlock your
bodygraph". Back navigation allowed; draft persisted (zustand + MMKV) so
app kill mid-ritual resumes at the same step.

**Scenario B (skipper):** Ori skips time/place/Hebrew name. Reveal shows
Dreamspell+Tzolkin+Gematria(name)+sun-sign astrology, HD slot shows calm
partial state with "add birth time" chip. Nothing errors.

## F3. Add a person (the 30-second capture)

```
Any screen → "+" (FAB / Map long-press) → S7 sheet
 → type name (contact autocomplete optional) → birthdate wheel
 → live preview chip updates kin/seal/sun-sign per keystroke (on-device)
 → optional time/place/Hebrew name/notes
 → Save: optimistic insert into ['people'] → POST /api/people
    → engine computeAll → POST /api/computed-results (batch)
    → haptic success → sheet closes → person card visible
 ├─ 403 limit_exceeded → rollback optimistic → S18 paywall
 │   ("Your map holds 3 people on Free — Explorer keeps 5.")
 └─ offline → inline "You're offline — saving needs a connection.
     The reading below is live." (reading still computed + shown)
```

**Scenario C (dinner party):** Friend says "17 Aug 1988, around 7pm,
Haifa." Amit adds her in 25s, preview chip already showed Kin before
saving, then opens compare against himself from the success toast.

## F4. Read a person (five systems)

```
S6 tap person → S8 (shared-element avatar transition)
 → pager: Dreamspell · Tzolkin+LC · Astrology · HD · Gematria · Insights
 → flavor accent + banner crossfade per page; engine data from cache
 → version check: stored result version < engine version → silent recompute
Free tier: pages 2–5 render blurred flavored preview + lock pill → S18.
Missing data: honest partial states with "add birth time/place" chips → S7.
```

**Scenario D (offline flight):** Airplane mode. Maya opens 12 saved people,
swipes all six pages each — everything renders from persisted cache +
on-device engine. AI button disabled with "back online" note.

## F5. Compare two people / relationship

```
Entry: S8 "Compare" · S10 tap edge · S6 long-press → pick second
 → S9: five-system score stack counts up (DS/TZ/Astro/HD/Gematria weights
   from engine) → per-system detail rows expand
 → "Keep this bond" → type/strength sheet → POST /api/relationships
    → edge appears on Map with type color
 ├─ plan < complete → compare view shows dreamspell-only score + locked
 │   stack rows → S18
 └─ duplicate edge → 409 → toast "Already on your map" + navigate to edge
```

**Scenario E:** Couple test — Dana compares herself and partner, gets
composite + five bars, saves as romantic/4, sees the edge pulse once on
the Map tab badge.

## F6. The Map

```
S10: force layout settles (spring) → pinch/pan (Skia, 60fps)
 → tap node → bottom card (name, kin chip, top connections, Compare CTA)
 → long-press node A then node B → F5 compare/create
 → filter chips: relationship type · circle · system lens
   (system lens recolors edges by that system's compatibility score)
Empty (<2 people): asterism illustration + "Your map needs two stars." CTA.
```

**Scenario F (scale):** 40 people, 65 edges — pan/zoom stays smooth,
tapping any node responds < 100ms, filter to "family" re-layouts with
spring, no dropped frames (Maestro perf assertion).

## F7. Circles & group analysis

```
S11 create → name + member picker → POST /api/groups
 → S12 analysis (on-device analyzeGroup): seal/tone/color rings,
   avg compatibility, insight lines
 ├─ plan < practitioner → composition renders, insight section locked → S18
 └─ share → F8
```

**Scenario G:** "Founding team" circle of 5 → analysis shows color balance
skew red/white, avg compatibility 61.4, insight "no yellow — completion
energy missing"; practitioner sees it, complete-tier sees rings + lock.

## F8. Share (growth loop)

```
S8/S12 share → S16 composer: expiry / max views / password (optional)
 → POST /api/shares → link + rendered story card (1080×1920 flavored)
 → native share sheet
Receiver: taps link → universal link → app installed? S15 in-app viewer
 : web /share/[token] (existing) with smart-app banner
S15 states: password prompt (401 requiresPassword) · expired (410) ·
view-capped (410) · revoked (404) — each a designed calm state, never raw.
Revoke: S16 list shows active links + view counts → PATCH active:false.
```

**Scenario H (viral loop):** Practitioner sends a family map to a client;
client opens on phone without the app → web viewer → installs → F1
Scenario A. share_opened → signup attribution tracked.

## F9. Today & push

```
Morning push (opt-in, after first person added — never on first launch):
 "Kin 113 · Red Solar Skywalker · two of your people resonate today"
 → deep link S5 → split-flap board flips through today's values
 → your daily reading → prediction peaks (personal, intensity-badged)
 → galactic-birthday rows when a person's kin recurs
Quiet failure: cron/API unreachable → board renders from on-device engine
(kin/moon/long-count computable locally; gate/Hebrew date show "—").
```

**Scenario I:** Push at 08:00 → open → board flip animation ≤ 1.2s →
taps person with galactic birthday → S8. Reduced-motion user: board
renders static, no flips.

## F10. Library & knowledge search

```
S14: search field → POST /api/knowledge/search (public, debounced 400ms)
 → snippet results w/ similarity → doc reader anchored to source
 → six flavored portals → doc reader (flavored banner, offline-cached)
Empty corpus (known state: content_chunks may be empty) → search returns []
 → "The library is being written." + doc portals still work.
```

## F11. Upgrade / billing

```
Trigger points: profile cap (F3), locked systems (F4), locked stack (F5),
timeline (S13), AI quota, group insights (F7)
 → S18 paywall (trigger-specific headline)
 → iOS: plan ladder + "Manage your plan on the web" (no external checkout
   button if App Review requires; feature-flagged)
 → Android: "Continue to checkout" → expo-web-browser Paddle hosted
 → return → poll GET /api/billing/subscription?refresh=1 until plan flips
 → celebrate quietly (toast + unlocked surfaces animate in)
Cancel/reactivate: settings → existing DELETE/PATCH subscription routes.
```

**Scenario J:** Free user hits 4th person → paywall → buys Explorer on
Android → back in app within 60s, people cap now 5, add succeeds without
re-entry of the form data (draft retained).

## F12. Settings & account

Profile edit (PATCH /api/profile, mirrors self person) · system toggles
(preferences.systems — hides pager pages) · notification prefs (existing
notification_settings shape + push token registration) · Face ID lock
toggle · sign out (token wipe + query-cache purge, people data cleared) ·
delete account (v1: web link).

---

## Cross-flow rules

- Every 401 → one silent token refresh → else logout to S2 with "signed
  out" notice (never mid-flow data loss; drafts persist).
- Every 403 limit_exceeded → paywall with correct trigger copy, never a
  toast error.
- Every 429 → calm inline "a lot of requests — try in a minute".
- All destructive actions (delete person, revoke link, cancel plan) →
  native confirm sheet; person delete is soft with 5s undo toast.
- Deep links always resolve: unauthenticated hits of authed screens park
  the target, run F1, then continue to the target.
