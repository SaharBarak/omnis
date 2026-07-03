# Omnis — User Flows (current state)

Source of truth for the redesign. Every flow below exists in code today
(branch base: `feat/cloudflare-foundation`). Each flow lists steps, pages,
and the redesign touchpoints it implies.

Auth model: Better Auth (Google OAuth + magic-link email, no passwords).
Middleware gates `/app`, `/dashboard`, `/people`, `/profile`; real
enforcement is `requireUserId()` in route handlers.

---

## 1. Discover → Signup → Onboarding

| Step | Page / API | Notes |
|---|---|---|
| Land | `/` | Hero, systems showcase, pricing, FAQ |
| Try without account | `/calculate`, `/today`, `/compatibility`, `/learn/*` | Free, no auth — the top of funnel |
| Sign in | `/login` | Google or magic link, `redirectTo` param |
| Bootstrap | `api/auth/[...all]` → `Profile` created (`onboarding_completed:false`) | server hook |
| Onboard | `/onboarding` | steps: displayName → birthDate → birthTime → birthPlace (LocationPicker) → hebrewName |
| Arrive | `/app` | dashboard: stats, today's kin, people preview, quick actions |

Redesign touchpoints: landing is the Railway-style long-scroll centerpiece;
onboarding should feel like a ritual (each step visually keyed to the system
it unlocks — birthdate→Dreamspell, birth time/place→HD+Astrology,
hebrew name→Gematria).

## 2. Anonymous instant value (top of funnel)

- `/today` — SSR daily kin reading (SEO/voice, Speakable schema)
- `/calculate` — birthdate → kin/seal/tone/oracle/mantra
- `/compatibility` — two birthdates → five-system score
- `/learn/{dreamspell,tzolkin,human-design,astrology,gematria,integration}` — docs hub

Redesign touchpoints: these are the "knowledge source" pages. Each `/learn/*`
gets its folklore flavor (see DESIGN_LANGUAGE.md). CTA path: reading → save
it → signup.

## 3. Create person / chart

`/app/people` → create dialog (BirthTimeInput + LocationPicker) →
`POST /api/people` → `/app/people/[id]` (SSR, owner-scoped) →
`PersonDetailView` tabs: Dreamspell · Tzolkin · Human Design · Astrology ·
Gematria · Cross-system insights.

Redesign touchpoints: person detail is the core dashboard artifact —
tabbed system views should carry the same per-system flavor tokens as docs.

## 4. Compatibility & relationships

- `/compatibility` (public, two birthdates)
- `/app/relationships` CRUD → `/app/graph` force-directed map
  (`GET /api/relationships/graph`)

## 5. Groups → analysis → share

`/app/groups` → `POST /api/groups` → `/app/groups/[id]/analysis`
(five-system group fusion) → ShareDialog → public `/share/[token]`.

Redesign touchpoints: shared page is outward-facing — must look
best-in-class; it's free marketing.

## 6. Boards (canvas)

`/app/boards` (templates, duplicate) → `/app/boards/[id]` @xyflow canvas →
export (html2canvas/jspdf) → share `boards/shared/[token]`.

## 7. Predictions & notifications

`/app/predictions` tabs (forecast / timeline / settings) →
`api/predictions/{daily,weekly,monthly,range,timeline/[personId]}`;
AI text `POST /api/ai/interpret` (Gemini, rate-limited, cached);
notification settings → `api/notifications/*`; cron workers refresh daily.

## 8. Billing / upgrade

`/app/settings/billing` → `GET /api/billing/subscription`
(SubscriptionStatus + UsageDisplay) → `POST /api/billing/checkout`
(Paddle hosted) → webhook sync. Plans: Free / $9 Complete / $29
Practitioner (`src/lib/plans.ts`). Upsells via `upgrade-cta.tsx`.

## 9. Knowledge search

`services/knowledge-search.ts` — Workers AI embeddings + Atlas Vector
Search over `content_chunks`. Surfaced in docs QuickAnswer + ⌘K command
palette. **Gap: no dedicated public search page** — redesign adds one
(`/learn` hero search), turning docs into "the source of knowledge."

## 10. Cards (print)

`/app/cards` — printable A5 person cards. **Gap: hardcoded TEST_PEOPLE**;
redesign wires real people.

---

## Funnel summary

```
SEO/docs (/learn, /today)                     ┐
free tools (/calculate, /compatibility)       ├→ signup → onboarding ritual
shared artifacts (/share/[token], boards)     ┘        ↓
                                            dashboard (/app)
                                              ↓ people → readings → AI
                                              ↓ groups/boards → shares (loop back to top)
                                              ↓ usage limits → Paddle upgrade
```

## Known gaps to fix during redesign

1. No `og-image.png` (metadata references it) — generate.
2. No public knowledge-search page — add to `/learn`.
3. `/app/cards` demo data — wire real people.
4. Stray `dreamspell-page.png` in repo root — remove.
