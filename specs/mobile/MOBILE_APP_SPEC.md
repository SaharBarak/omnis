# Pleiad Mobile — Product Specification

Status: PROPOSED (v1) · Companion docs: ARCHITECTURE.md, DESIGN_LANGUAGE.md,
USER_FLOWS.md, DATA_MODEL.md, VERIFICATION.md.

## 1. Thesis (unchanged from MAIN_PURPOSE.md)

Pleiad is a living, persistent map of your people read through five wisdom
systems. Mobile is the **primary daily surface**: your people in your
pocket, today's sky at a glance, a reading at a dinner table the moment
someone tells you their birthday. The phone beats the website at exactly the
moments Pleiad lives for — spontaneous, social, daily.

Surface hierarchy (locked): 1. the map/dynamics · 2. five-system reading ·
3. persistence · 4. sharing · 5. knowledge.

## 2. Why the app must beat mobile web

| Mobile-web weakness | Native answer |
|---|---|
| Redirect-cookie auth, no session persistence feel | Native Auth0 PKCE, Face ID re-entry, always signed in |
| Heavy landing-page scroll on small screens | App opens directly into YOUR map + today |
| No offline | Whole people library + readings readable offline (on-device engines) |
| No notifications | Daily kin push, prediction peaks, "galactic birthday" moments |
| Force-graph sluggish in mobile browser | 60fps Skia graph with pinch/pan/tap physics |
| Adding a person = form on a page | 30-second capture sheet from anywhere (+ contact import assist) |
| Sharing = copy a URL | Native share sheet: link + rendered card image |

## 3. Scope

### v1 (this spec)

- Auth: Google, Apple, email (Auth0 native) · onboarding ritual
- Home ("Today"): today board, your kin, setup checklist, recent people
- People: library, search, add/edit/delete (soft), tags read-only, self entry
- Person detail: six readings (Dreamspell, Tzolkin+Long Count, Astrology,
  Human Design, Gematria) + cross-system insights, per-system flavor
- Map: relationship graph (Skia), relationship CRUD, pair compatibility
- Circles (groups): CRUD, members, group analysis (plan-gated)
- Predictions: daily/weekly/monthly + personal timeline (plan-gated) + AI
  interpretation (metered)
- Moon: current lunation view (inside Today)
- Sharing: create/revoke share links, native share sheet, public share
  viewer via deep link
- Library (learn): six knowledge docs + semantic search (public API)
- Settings: profile, system toggles, notifications, billing status, legal
- Push: daily kin digest, prediction alerts (opt-in)
- Free-tier anonymous mode: calculate + today + compatibility before signup
  (top-of-funnel parity)

### Not in v1 (explicit)

- Boards canvas editing (xyflow has no RN equivalent; boards are listed
  read-only with "edit on web" handoff) — BRD-M2
- Printable cards/PDF export — CRD-M2
- Native IAP (BILL-M2), offline mutation queue (SYNC-M2), widgets/watch
  (WID-M2), Hebrew locale + RTL polish (I18N-M2)

## 4. Navigation

Bottom tab bar (5), asterism-centered:

```
 Today      People      ● Map       Circles     Library
 (home)     (library)   (center,    (groups)    (learn+search)
                         raised)
```

- **Map is the center tab** — the hero feature gets the hero position.
- Global "+" action: long-press Map tab or FAB on People → Add Person
  capture sheet (available from anywhere; the single most important action).
- Settings via avatar in Today header. Predictions live inside Today
  (forecast section) + person detail (timeline).
- Stack modals: person detail, group analysis, pair reading, share sheet,
  paywall, onboarding.

## 5. Screen inventory

| # | Screen | Route | Content | States |
|---|---|---|---|---|
| S1 | Splash/Gate | `/` | asterism on ground; routes by auth+onboarding | — |
| S2 | Welcome/Login | `(auth)/login` | mural sky, H1 "Map the people who shape your life.", Apple/Google/email buttons, "Try one reading" anonymous path | loading, error |
| S3 | Anonymous calculate | `(auth)/try` | birthdate → instant five-preview reading (dreamspell full, others teaser) → "Save this reading" → signup | empty, computed |
| S4 | Onboarding ritual | `(auth)/onboarding/[step]` | 5 steps, each on its system's mural: name → birth date (Dreamspell) → time (HD) → place (Astrology) → Hebrew name (Kabbalah, skippable). Skippable steps marked; finishing computes + shows YOUR reading as the reveal | per-step validation |
| S5 | Today (home) | `(tabs)/index` | greeting · **split-flap today board** (kin/moon/sun/gate/Hebrew date) · your daily reading card · setup checklist (until complete) · prediction peaks · recent people row | loading skeleton, offline banner |
| S6 | People | `(tabs)/people` | searchable list (name/kin/sign chips), sectioned alphabetically, swipe actions (share/delete), FAB add | empty (invitation), loading, search-empty |
| S7 | Add/Edit Person | modal sheet | name*, birth date* (wheel), time (+"unknown"), place (search → lat/lng/tz), Hebrew name, notes; **live preview chip updates kin/sign as you type**; save = compute + haptic | validation, limit-reached paywall |
| S8 | Person detail | `person/[id]` | header (avatar, name, kin chip) · swipeable system pager with flavored segments: Dreamspell / Tzolkin+LC / Astrology / HD / Gematria / Insights · missing-data prompts ("add birth time to unlock the bodygraph") · actions: share, compare, edit | partial-data, free-tier lock (non-dreamspell systems blurred + paywall) |
| S9 | Compare (pair) | `pair/[id1]/[id2]` | five-system score stack (count-up), per-system breakdown, oracle relation, relationship save CTA | plan gate (relationships=complete+) |
| S10 | Map | `(tabs)/map` | full-bleed Skia force graph; nodes = people (seal-color ring), edges typed; pinch/pan; tap → bottom card (person summary + compare); long-press node→node = create relationship; filter chips (type, circle) | empty (2-person invitation), loading |
| S11 | Circles | `(tabs)/circles` | group list w/ member avatars stack; create/edit; member picker | empty, limit |
| S12 | Circle analysis | `circle/[id]` | composition rings (seal/tone/color balance), avg compatibility, insights list, member grid; share | plan gate (practitioner) |
| S13 | Predictions/timeline | inside Today + `person/[id]/timeline` | daily/weekly/monthly forecast, intensity badges, personal timeline (plan: explorer+); AI interpretation button (metered, complete+) | quota-reached, 503-no-key |
| S14 | Library | `(tabs)/library` | search field (semantic, public API) · six flavored doc portals · doc reader (flavored banner, calm typography) | offline (cached docs), search-empty |
| S15 | Share viewer | `share/[token]` deep link | public render of shared group/person artifact; password prompt; expired/view-capped states | 404/410/401 |
| S16 | Share composer | sheet | create link (expiry, max views, password), revoke list w/ view counts, native share sheet incl. rendered card image | |
| S17 | Settings | `settings/*` | profile edit, system visibility toggles, notification prefs, plan+usage meters, restore/upgrade (web checkout), sign out, legal | |
| S18 | Paywall | modal | tier ladder (Free/Explorer $5/Complete $9/Practitioner $29/Founding $79), gold accent on recommended, feature ledger, opens hosted checkout | per-trigger copy |
| S19 | Boards (read-only) | `boards` (from Circles overflow) | list + thumbnail, "Open on web" | v1 read-only |

## 6. Feature rules (entitlements — mirror server exactly)

| Capability | free | explorer | complete | practitioner | lifetime |
|---|---|---|---|---|---|
| profiles | 3 | 5 | 10 | ∞ | 10 |
| systems | dreamspell only | all | all | all | all |
| AI/mo | 0 | 0 | 30 | ∞ | 30 |
| timeline | – | ✓ | ✓ | ✓ | ✓ |
| relationships | – | – | basic | advanced | basic |
| group analysis | – | – | – | ✓ | – |
| exports | – | – | ✓ (v2) | ✓ (v2) | ✓ (v2) |

Client checks are UX only (pre-empt with paywall); server 403
`limit_exceeded` is the truth and always handled gracefully (paywall, never
raw error). Free tier still gets the full map view with dreamspell edges —
locked systems render as blurred flavored previews (upsell surface, not a
wall).

## 7. Mobile-native moments (the "better than web" list)

1. **Capture sheet everywhere** — add a person in <30s from any screen;
   live kin preview while typing the date; contact-book name autocomplete
   (name only, no data leaves device without save).
2. **Today push** — morning digest: "Kin 113 · Red Solar Skywalker. Two of
   your people share today's seal." Deep-links to Today.
3. **Galactic birthday alerts** — person's kin recurs (every 260d): push +
   confetti-free, calm highlight on their node.
4. **Face ID gate** (optional) for the people library.
5. **Native share** — share sheet with link + auto-rendered reading card
   (1080×1920 story format, flavored).
6. **Haptic reading reveal** — computing a new chart plays the stagger
   reveal with `impactLight` per system landing.
7. **Offline everything read** — airplane-mode dinner-party test: full
   library + readings + compare work; only AI/search/persist queue.

## 8. Analytics (PostHog, same funnel)

`app_opened, signup_started, signup_completed, onboarding_step,
onboarding_completed, person_created, reading_viewed(system),
pair_compared, relationship_created, group_created, group_analyzed,
share_created, share_opened, paywall_shown(trigger), checkout_opened,
push_optin, ai_interpret_used`.

## 9. Release plan

- M0: AUTH-M1 backend (bearer auth) + engine extraction (`@pleiad/engine`)
- M1: shell + auth + onboarding + people + person detail (TestFlight alpha)
- M2: map + compare + circles + today board + push
- M3: sharing + library + paywall + settings polish
- M4: store assets, review pass, beta → release
Success criteria per milestone in VERIFICATION.md.
