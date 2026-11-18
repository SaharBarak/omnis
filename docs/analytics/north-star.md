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
| `user_signed_up` | An account first exists to the app: its profile row was created | `ensureUserAndProfile` in `src/lib/services/profile.ts`, reached from `GET` and `PATCH /api/profile` and the dashboard's keep action | `method`: the Supabase auth provider (`email`, `google`), or `unknown` |
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
- Whether a server event names its account is decided by the visitor's
  consent, not by the call site. See "Server events and consent" below.
- `newsletter_subscribed` carries no person: the distinct id is a one-off
  random id with `$process_person_profile: false`. The address is never sent.
- `checkout_completed` carries a `uuid` derived from the RevenueCat event id,
  so a redelivered webhook is the same event. A free-trial start and ordinary
  renewals are not counted. The webhook is RevenueCat's request, not the
  buyer's, so it carries no answer and the purchase is sent unattributed.
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
| `server.ts` | Route handlers: `trackServer`, `captureServerException`, and `attributionFor`, which decides what a server event may name |
| `consent.ts`, `consent-store.ts` | The consent rules, the shared answer, the cookie that carries it to the server, and the gate for a request |
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
- The answer is kept in `localStorage` (`pleiad.consent.analytics`) and
  mirrored into the `pleiad-consent` cookie for the server. It can be changed
  at any time on `/privacy`.
- Business events raised while the answer is pending are held (at most 20) and
  sent once it is known, with their original timestamps.
- While pending, the SDK still fetches its own configuration and flag
  definitions from PostHog; it sends no events and stores nothing.
- Cloudflare Web Analytics stores nothing in the browser and is outside the
  gate.
- Server events follow the same decision; see the next section.

## Server events and consent

A server event names its account only when the browser's rule, `gateFor` in
`consent.ts`, returns `allowed` for the request that caused it. Every other
event is sent unattributed.

| The request that caused the event | What the server sends |
|---|---|
| Its gate is `allowed` | Attributed: `pleiad:user:<id>`, a person profile, and the request's `$current_url` and `$session_id` |
| Its gate is `refused`, `asking` or `deciding` | Unattributed |
| It carries no consent cookie, or one that does not parse | Unattributed: no browser of ours has spoken for it |
| It is not the visitor's (a webhook), or there is none (a server action) | Unattributed |

Unattributed means: a distinct id drawn at random for that one event,
`$process_person_profile: false`, and no request properties (no URL, no
session id). The event name, `site`, `env` and the event's own properties
still go.

The rule lives in `attributionFor` in `src/lib/analytics/server.ts`, which
both `trackServer` and `captureServerException` call, so no call site can
skip it. A call site states the actor it would name and passes the visitor's
request where it has one; the layer decides whether the event may name
anyone. Request properties are built only inside that decision.

### The gate, evaluated on the server

The browser's gate has three inputs. The server reads each from the request:

| Input | Browser | Server |
|---|---|---|
| The visitor's answer | `localStorage` (`pleiad.consent.analytics`) | The consent cookie, which mirrors it |
| Whether the region asks first | `cf-ipcountry`, through `GET /api/consent` | `cf-ipcountry` on the request itself (`COUNTRY_HEADER`) |
| A privacy signal | `navigator.globalPrivacyControl`, `navigator.doNotTrack` | The `Sec-GPC` and `DNT` request headers |

Both sides then call `gateFor`, with the same precedence: an explicit answer
first (a `granted` outranks a privacy signal, a `denied` outranks the region),
then a privacy signal, then the region. The region and the header signal are
read on every request, so travelling into a region that asks or turning on
Global Privacy Control takes effect on the next request, before any script
runs. Only the answer, which the server cannot otherwise see, crosses in the
cookie.

The two sides read equivalent signals, not identical ones, and where they
differ the server is the stricter:

- A signal only script can see (an extension that sets
  `navigator.globalPrivacyControl` without the header) is written into the
  cookie as `denied`.
- A signal only the header carries makes the server refuse while the
  browser allows.
- Outside the regions that ask, the server applies the region from the first
  request, while the browser is still waiting for `/api/consent`; both read
  the same header, so the server only reaches early the gate the browser is
  about to reach. If that fetch fails, the browser asks while the server
  allows.

A request without the cookie is never given the region default. Outside the
regions that ask, a webhook from a provider's servers, a request from
another browser, or a visit whose cookie lapsed would otherwise be read as
`allowed`. The cookie's presence is the evidence that this browser ran our
consent layer.

### Unattributed, not dropped

On refusal the browser keeps counting: PostHog's `on_reject` mode sends
cookieless events with nothing kept on the device and no person profile, and
PostHog derives their id on its side from a salt that rotates daily. An
unattributed server event follows the same contract with less in it: the
analytics layer assigns no id shared between events, sends no URL or session,
and does not forward the visitor's IP address or user agent (the request to
PostHog comes from the Worker, and `disableGeoip` is set). Event time and
properties are all that remain.

The same holds while the visitor has not answered. The browser holds its
business events until the answer and then sends them, attributed or
cookieless, so either way they are counted. The server cannot hold an event
across requests, so it sends at once what both outcomes share. The policy
this rests on: counting without attribution is permitted for a visitor who
refused, so it is permitted for one who has not yet answered. It keeps
sign-up, sign-in, newsletter and purchase totals complete. Per-person funnels
contain only visitors who allowed analytics, as in the browser.

What an unattributed event carries beyond its name:

- The event's own properties. Server event properties are categorical or
  numeric by rule (`events.ts`): a provider, a placement, a plan, a product,
  an amount, a currency. They never hold a person's id, an address or free
  text, because they leave with unattributed events too.
- For `checkout_completed`, its `uuid`: a SHA-256 digest of the site, the
  event and RevenueCat's event id, so a redelivered webhook is the same event.
  PostHog is never given RevenueCat's event id; the digest is stable only
  across redeliveries of one purchase.
- For `$exception`, the error itself. Its message and stack are the server's
  own failure report and go as the SDK builds them; the context passes
  through `redact.ts`. The only server exception today is the billing
  webhook's.

Nothing in a server event is stored on or read from the visitor's device,
apart from the consent cookie that decides it.

### The answer crosses in a cookie

The browser keeps the answer in `localStorage`, which the server cannot read,
and some server events come from top-level navigations: the OAuth and
email-link returns to `/auth/callback` and the newsletter confirmation link.
No script runs on those, so no header set by script can carry the answer. A
cookie travels on every request the browser makes to the site, navigations
included.

The cookie holds what the browser settles without the network
(`ConsentRecord`):

| Value | Meaning | `choice` the server passes to `gateFor` |
|---|---|---|
| `granted` | The visitor allowed analytics | `granted` |
| `denied` | The visitor declined, or has not answered and this browser shows a privacy signal | `denied` |
| `unanswered` | No answer and no signal; the region decides | none |

| Attribute | Value | Reason |
|---|---|---|
| Name | `pleiad-consent` (`CONSENT_COOKIE`) | |
| `Path` | `/` | Server events come from `/auth/*` and `/api/*` |
| `SameSite` | `Lax` | Sent on the top-level `GET` that returns from Google, Supabase or a mailed link; `Strict` would withhold it there. Not sent on cross-site subrequests |
| `Secure` | On HTTPS pages | A local `http://` build still works |
| `Domain` | Not set | Host-only: the site that asked is the site that reads |
| `HttpOnly` | Not set | Written by the browser's consent layer; it holds no secret |
| `Max-Age` | 400 days (`CONSENT_COOKIE_MAX_AGE_S`) | The cookie carries an answer that has no expiry, so it should not lapse while the answer stands; 400 days is the ceiling RFC 6265bis lets a browser honour. Some browsers keep script-written cookies for less (Safari: seven days); a lapsed cookie only makes the next navigation unattributed until a page load writes it again |

When it is written (`syncConsentCookie`):

- Before the app hydrates, on every page load, from
  `src/instrumentation-client.ts`. It needs nothing from the network, so it is
  on the first request any component makes, whatever order they mount in.
- With the answer itself: `writeChoice` stores the answer and the cookie in
  one call, so a withdrawal reaches the server with the next request.
- On the `storage` event, when another tab answered. Cookies are shared
  between tabs, so this only repairs a cookie that went missing.
- Signing out leaves it alone. The answer belongs to the browser, as the
  stored answer does, not to the account.

Where `localStorage` cannot be read, the cookie is the record: `readChoice`
falls back to its `granted` or `denied`, so a refusal given in a browser that
blocks storage is kept, on both sides, for as long as the cookie lives.

A cookie that is absent, lapsed, present more than once in the header, or
holds any other value reads as no answer from any browser, and the event is
unattributed.

The cookie serves only the consent mechanism: it holds one of three words
that every visitor in the same state shares, is set by the visitor's own
browser, and decides only how that visitor's own events are attributed. It
is never read for authorisation. It relies on the exemption for trackers
that record the visitor's choice about trackers (CNIL lists them as exempt
from consent), so it is set without asking, for every state, and is
disclosed in the privacy policy.

### Call sites

| Event | Call site | Request it reads | Result |
|---|---|---|---|
| `user_signed_up` | `ensureUserAndProfile` via `GET /api/profile` | The app's own fetch | Attributed when the gate is `allowed` |
| `user_signed_up` | `ensureUserAndProfile` via `PATCH /api/profile` (`updateOwnProfile` forwards the request) | The app's own fetch | Attributed when the gate is `allowed` |
| `user_signed_up` | `ensureUserAndProfile` via the dashboard keep action | None (server action) | Unattributed |
| `user_logged_in` | `src/app/auth/callback/route.ts` | The OAuth or email-link navigation | Attributed when the gate is `allowed` |
| `newsletter_subscribed` | `src/app/api/newsletter/confirm/route.ts` | The confirmation-link navigation | Unattributed, since its actor is anonymous; request properties only when the gate is `allowed` |
| `checkout_completed` | `src/app/api/billing/webhook/route.ts` | None; the request is RevenueCat's | Unattributed |
| `$exception` | `captureServerException` in the billing webhook | None | Unattributed |

The keep action creates the profile only if it runs before the app's first
`GET /api/profile`, which the signed-in shell sends on mount.

### Options weighed

| Option | Reaches the OAuth return | A request without the visitor's cookie | Verdict |
|---|---|---|---|
| Mirror the answer into a cookie; the server runs `gateFor` with the request's own region and signal | Yes | Unattributed | Chosen |
| Mirror the browser's settled gate (`allowed`/`refused`) into the cookie | Yes | Unattributed | Rejected: a region default stays in the cookie after the visitor travels into a region that asks or turns on a signal, until script runs again |
| A request header set by script | No: navigations carry no script headers | Unattributed | Rejected |
| The server applying the region default to any request | Yes | Allowed outside the asking regions, a webhook included | Rejected |
| A per-account record in the database | Only once signed in | Depends on the record | Not now: needs a table and a write path, cannot answer for the visit that creates the account, and is the only option that reaches events with no browser at all (see Open questions) |
| Drop server events while the visitor has not answered | Yes | Dropped | Rejected: loses totals that refusal itself keeps |
| The cookie as the only store, `localStorage` dropped | Yes | Unattributed | Rejected: the store's cross-tab `storage` event needs `localStorage` |

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
| 11 | A server event is attributed only when its request's gate is `allowed`; refused, unanswered, a missing or duplicated cookie, a webhook and a server action send an unattributed event, including on the OAuth return | Unit-tested; needs deployed preview with a real Google sign-in and the `cf-ipcountry` header |

## Open questions

- Events with no browser behind them, today only `checkout_completed` from the
  RevenueCat webhook, are unattributed for everyone. Naming the buyer needs
  the account's own answer recorded server-side (a per-account consent
  record, as Beneath keeps), written by the consent store when signed in.
- Unattributed server events for visitors in the asking regions who have not
  yet answered rest on the policy stated in "Unattributed, not dropped". It
  is a legal judgement as well as a product one; dropping them instead is a
  one-line change in `attributionFor`.
- The stored answer has no expiry, so neither does the cookie that mirrors
  it. CNIL's guidance treats about six months as good practice before asking
  again, for a refusal as for an acceptance; adopting it means dating the
  stored answer, and the cookie's lifetime then follows it.
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
| codex-cli 0.154.0 | Server events and consent: mechanism, cookie, unattributed events, call sites, layer boundaries, spec claims | 2026-11-18 | Incorporated |
