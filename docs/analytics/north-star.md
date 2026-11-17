# Pleiad analytics: north star, events and how they are sent

Pleiad reports product analytics to PostHog. This document is the spec the
code is held to: what is measured, which events exist, how identity and consent
work, and how to check a deployment. The shared rules every studio site follows
are in `skills-and-workflows/playbooks/posthog-analytics-contract.md`; this
file is Pleiad's part.

| | |
|---|---|
| Site slug (`site`) | `pleiad` |
| Class | `app` (accounts, consent gate, identify after login) |
| PostHog project | Shared studio project, US cloud (`https://us.i.posthog.com`) |
| Environments (`env`) | `production`, `preview`, `development` |
| Layer | `src/lib/analytics/` |

## North star: Weekly Active Mappers (WAM)

The number of users who, in a rolling 7-day window, took a core map action:
added a person (`person_created`) or created or opened a group reading.
Creating one is measured by `group_created`; opening one has no event yet (see
Open questions), so WAM today counts `person_created` and `group_created`.

It sits on the product's value, the map filling in and being read, and not on
a proxy such as registrations. It leads both retention (people come back to
map more) and revenue (mappers convert; the paywall gates depth and group
features), and it rewards the lead feature, fused group readings.

### Input metrics

| Driver | Definition | Source |
|---|---|---|
| Activation rate | `user_signed_up` to first `person_created` | funnel |
| Map depth | average people per active user | `person_created` |
| Group-reading rate | share of mappers who create a group | `group_created` |
| Virality | `share_created` per active user | `share_created` |
| Retention | WAM week N over week N-1 | derived |
| Paid conversion | `checkout_completed` per active user | `checkout_completed` |

### Activation funnel

`landing_cta_clicked` → `calculate_completed` → `signup_started` →
`onboarding_completed` → `person_created` → `share_created`

Build it in PostHog as a funnel filtered on `site = pleiad`.

### Guardrail

A signup that never maps a person is not value. Watch WAM over signups, never
signups alone.

## Events

The typed map in `src/lib/analytics/events.ts` is the source of this table. An
event that is not declared there does not compile, and every declared event has
the call site listed here. Every event also carries `site` and `env`; callers
cannot pass those keys and the layer applies them last.

### Sent from the browser (`track`)

| Event | Meaning | Fires in | Properties |
|---|---|---|---|
| `landing_cta_clicked` | The hero call to action was clicked | `src/components/landing-v2/hero-v2.tsx` | none |
| `calculate_completed` | The free calculator produced a result | `src/app/calculate/page.tsx` | `kin` (number) |
| `signup_started` | The login form was submitted, by Google button or by email in sign-up or sign-in mode | `src/app/login/page.tsx` | `method`: `google`, `email_signup`, `email_password` |
| `onboarding_completed` | The profile was saved at the last onboarding step | `src/app/onboarding/page.tsx` | none |
| `person_created` | A person was added to the map | `src/lib/hooks/use-people.ts` | `is_self` (boolean) |
| `group_created` | A group was created | `src/lib/hooks/use-groups.ts` | `members` (number) |
| `share_created` | A share link was created | `src/lib/hooks/use-shares.ts` | `share_type` (string) |
| `user_logged_in` | A password sign-in succeeded | `src/lib/hooks/use-auth.ts` | `method`: `email` |
| `lead_submitted` | The contact form was sent | `src/app/contact/page.tsx` | `channel`: `contact_form`; `placement`: `contact_page` |

### Sent from the server (`trackServer`)

| Event | Meaning | Fires in | Properties |
|---|---|---|---|
| `user_signed_up` | An account first exists to the app: its profile row was created | `src/app/api/profile/route.ts` | `method`: the Supabase auth provider (`email`, `google`), or `unknown` |
| `user_logged_in` | A session was started through an email link or OAuth return | `src/app/auth/callback/route.ts` | `method`: the Supabase auth provider |
| `newsletter_subscribed` | An address confirmed its subscription (double opt-in, on the transition to active) | `src/app/api/newsletter/confirm/route.ts` | `placement`: `landing_download_cta` |
| `checkout_completed` | The billing provider confirmed the first payment for a product (RevenueCat `INITIAL_PURCHASE` or `NON_RENEWING_PURCHASE` outside a free trial, or the `RENEWAL` that converts a trial), after the entitlement sync succeeded | `src/app/api/billing/webhook/route.ts` | `plan`, `product_id`, `value` (amount as charged), `currency` (ISO 4217) |

`user_signed_up`, `user_logged_in`, `newsletter_subscribed`, `lead_submitted`
and `checkout_completed` are shared names with the same meaning on every
studio site. `checkout_started` is not sent: purchases happen in the App Store
and Google Play, and the web app has no checkout to open.

Notes on meaning:

- `user_logged_in` fires on every session start through `/auth/callback`,
  including the first one after a sign-up, so a new Google account produces
  both `user_signed_up` and `user_logged_in`.
- `newsletter_subscribed` carries no person: the distinct id is a one-off
  random id with `$process_person_profile: false`. The address is never sent.
- `checkout_completed` carries a `uuid` derived from the RevenueCat event id,
  so a redelivered webhook is the same event. A free-trial start and ordinary
  renewals are not counted.
- A newsletter form declares its placement in `NEWSLETTER_PLACEMENTS`; the
  value travels on the confirmation link and is accepted only if it is listed.

Pageviews (first load and in-app navigations), pageleaves, autocapture, web
vitals and uncaught exceptions come from the SDK defaults. Nothing fires
`$pageview` by hand.

## The layer

Application code imports the layer and never `posthog-js` or `posthog-node`.
ESLint (`no-restricted-imports` in `eslint.config.mjs`) fails any other import.

| Module | Role |
|---|---|
| `config.ts` | `SITE`, `env` derivation, `distinctIdFor`, reserved properties, the missing-configuration message |
| `events.ts` | The typed event maps |
| `posthog.ts` | Browser: `initAnalytics`, `track`, `identify`, `reset`, `captureException`, `applyConsent` |
| `server.ts` | Route handlers: `trackServer`, `captureServerException` |
| `consent.ts`, `consent-store.ts` | The consent rules and the shared answer |
| `redact.ts` | Token redaction for URLs and properties |

Initialisation happens once, in `src/instrumentation-client.ts`, with
`defaults: '2026-08-30'`, `cookieless_mode: 'on_reject'`,
`person_profiles: 'identified_only'`, `capture_exceptions: true`, masked
session-replay inputs, and tracing headers on same-origin requests so server
events can join the browser session.

`site` and `env` are registered as super properties at init and stamped again
on every outgoing event in `before_send`, because `reset()` and a consent
change clear registered properties. The same hook redacts one-time codes,
signed link parameters and share tokens (`/share/<token>`, `/shared/<token>`,
`?code=`, `?sig=`, `?email=`, `#access_token=` and the rest of
`SENSITIVE_PARAMS`), and replaces properties named as credentials
(`SECRET_KEYS`). Server exception context passes through the same redaction.

`env` is decided at build time: `NEXT_PUBLIC_POSTHOG_ENV` if it is one of the
three values, else `NEXT_PUBLIC_VERCEL_ENV`, else `development` for a dev
build and `production` otherwise. `npm run preview` and `npm run upload` set
`preview`; `npm run deploy` sets nothing and reports `production`.

## Identity

- The identified id is `pleiad:user:<Supabase user id>`, built by
  `distinctIdFor` in `config.ts`. The browser `identify` and every server
  capture call that one function. Email and name are person properties.
- `identify` runs when a session exists (`use-auth.ts`) and takes effect only
  once analytics cookies are allowed. `reset` runs on sign-out.
- Anonymous visitors have no person profile (`identified_only`).
- Feature flag keys are prefixed `pleiad-` and carry a `site` condition.

## Consent

The decision governs every non-essential tracker on the site.

| State | When | PostHog | Google Analytics, studio beacon |
|---|---|---|---|
| Pending | Until the visitor answers, in the EEA, UK and Switzerland, or anywhere the country is unknown | No events, no storage | Not loaded |
| Allowed | The visitor accepted, or is outside those regions and sends no privacy signal | Cookies and local storage, identify, session replay | Loaded |
| Refused | The visitor declined, or the browser sends Global Privacy Control or Do Not Track | Cookieless events with no identifier kept in the browser; no identify, no replay | Not loaded |

- The region comes from Cloudflare's `cf-ipcountry` header through
  `GET /api/consent`, which returns only whether to ask.
- The answer is kept in `localStorage` (`pleiad.consent.analytics`). It can be
  changed at any time on `/privacy`.
- Business events raised while the answer is pending are held (at most 20) and
  sent once it is known, with their original timestamps.
- While pending, the SDK still fetches its own configuration and flag
  definitions from PostHog; it sends no events and stores nothing.
- Cloudflare Web Analytics stores nothing in the browser and is outside the
  gate.
- Server events describe account actions (sign-up, sign-in, payment) and are
  sent regardless of the browser's answer.

## Configuration

| Variable | Purpose | Where it is set |
|---|---|---|
| `NEXT_PUBLIC_POSTHOG_KEY` | Project token. Optional: without it the layer is a no-op | Build environment |
| `NEXT_PUBLIC_POSTHOG_HOST` | Ingestion host. Defaults to `https://us.i.posthog.com` | Build environment |
| `NEXT_PUBLIC_POSTHOG_ENV` | `production`, `preview` or `development`. Leave unset for production | Set to `preview` by the preview scripts |
| `NEXT_PUBLIC_POSTHOG_DEV` | `1` reports from `next dev`, tagged `development`. Off by default | Local `.env.local` only |

All four are `NEXT_PUBLIC_*`, so Next inlines them into the browser and server
bundles when `opennextjs-cloudflare build` runs. They must be present in the
environment of the machine or CI job that builds (`.env.production.local`,
`.env.local`, or exported variables); a Worker secret set afterwards does not
reach them. `scripts/set-prod-secrets.sh` copies the key and host from
`.prod.vars` to GitHub Actions secrets; `.github/workflows/ci.yml` does not
read them, so CI builds run without analytics. The key is never written into
tracked files.

Missing configuration: a build and a boot succeed with no PostHog variable set.
Without the key, production is a silent no-op; a development build raises one
browser error, and server code logs one warning, reading
`NEXT_PUBLIC_POSTHOG_KEY variable required by PostHog is missing or
un-configured, this causes events to be silently missed. This error stops
appearing once NEXT_PUBLIC_POSTHOG_KEY is configured`.

Server delivery: one `posthog-node` client per isolate, sending with
`ctx.waitUntil(client.captureImmediate(...))`. A send error is logged and never
changes the route's response.

Shared-project settings this site relies on: cookieless tracking enabled
(otherwise refused visitors are dropped), exception autocapture enabled, and a
test-account filter excluding `env` of `development` and `preview`.

## Acceptance

Checked on a deployed preview, then with one production smoke event.

| # | Check | Status |
|---|---|---|
| 1 | With no key, build and boot succeed; development shows the one warning | Verified locally |
| 2 | Exactly one SDK initialisation | Verified locally |
| 3 | A pageview arrives on first load and on an in-app navigation, once each | Verified locally against a local capture endpoint |
| 4 | A named business event arrives once with the right `site`, `env`, `$host` and URL | Verified locally (`landing_cta_clicked`, `env=development`); needs deployed preview for `env=preview` |
| 5 | A preview event is found when queried and is absent from production dashboards | Needs deployed preview |
| 6 | Nothing is sent while consent is pending; acceptance enables storage; refusal yields cookieless events with no persistent id | Verified locally; needs deployed preview for the region header and cookieless ingestion |
| 7 | Login produces the namespaced id; logout resets and the next event has a new anonymous id | Unit-tested; needs deployed preview with a real session |
| 8 | One server event arrives before its handler ends | Verified on the local Workers runtime (`opennextjs-cloudflare preview`); needs deployed preview |
| 9 | One deliberate client exception is grouped once and carries no secret | Needs deployed preview |
| 10 | A replay appears under `site = pleiad` with inputs masked | Needs deployed preview |

## Open questions

- Server events are sent for accounts whose browser refused analytics cookies.
  Recording the answer server-side, as Beneath does, would let them honour it.
- The mobile app (`packages/mobile`) sends nothing to PostHog. Its purchases
  reach `checkout_completed` through the RevenueCat webhook; its screens do
  not.
- `group_reading_viewed` would let WAM count opening a group reading as well
  as creating one.
- A reverse proxy on a Worker route is the next step for ad-blocked visitors.

## Second opinions

| Reviewer | Scope | Date | Status |
|---|---|---|---|
| codex-cli 0.154.0 | Shared contract: tenancy, layer shape, consent model, proxy, sequencing, acceptance | 2026-11-17 | Incorporated |
| codex-cli 0.154.0 | This repo's layer, consent gate, redaction and server call sites | 2026-11-17 | Incorporated |
