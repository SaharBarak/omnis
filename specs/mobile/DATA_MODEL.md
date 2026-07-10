# Pleiad Mobile — Data Model & API Contracts

Status: PROPOSED (v1). Server truth: `src/lib/db/schema.ts` (21 tables),
route handlers under `src/app/api/**`. This doc defines what the mobile
client consumes, caches, and computes — not new server schema (backend
additions are the two work items in §6).

---

## 1. Client entity model (TypeScript, `@pleiad/api-client`)

Mirrors server rows post-serialization (timestamps = ISO strings, ids =
uuid strings, user ids = Auth0 sub strings). Zod-validated at the client
edge; shared with web.

```ts
BirthPlace   { lat?, lng?, name?, city?, country?, timezone? } | null
Profile      { user_id, display_name, birth_date, birth_time, birth_place,
               hebrew_name, avatar_url, locale:'he'|'en', timezone,
               preferences:{ systems?: SystemKey[] }, onboarding_completed }
Person       { id, name, hebrew_name?, birth_date, birth_time?, birth_place?,
               avatar_url?, notes?, is_self, deleted_at?, created_at, updated_at }
ComputedResult{ person_id, system: 'dreamspell'|'tzolkin'|'longcount'|
               'humandesign'|'astrology'|'gematria', version, data }
Relationship { id, person1_id, person2_id,
               type:'family'|'romantic'|'friend'|'professional'|'other',
               subtype?, bidirectional, strength:1|2|3|4|5,
               start_date?, end_date?, notes? }
Group        { id, name, description?, members: Person[] }
SharedView   { id, share_type:'person'|'relationship'|'group'|'graph',
               options, url_token, expires_at?, max_views?, view_count, active }
Subscription { plan:'free'|'explorer'|'complete'|'practitioner'|'lifetime',
               planName, status, currentPeriodEnd?, cancelAtPeriodEnd,
               usage: UsageSummary, features: PlanLimits }
Board        { id, name, description?, template?, thumbnail?, updated_at }  // v1 read-only
NotificationSettings { enabled, channels, dailyDigest, dailyDigestTime,
               weeklyDigest, weeklyDigestDay, advanceNotice, systems,
               minIntensity }
```

Engine output types come from `@pleiad/engine` verbatim
(`DreamspellComputedData` … `GematriaComputedData`, `NatalChart`,
`Bodygraph`/`PartialBodygraph`, five-system compatibility, group analysis,
predictions, moon). Engine versions: dreamspell 1.1.0, others 1.0.0 —
client recomputes when cached `ComputedResult.version` < engine version.

### Birth-place gotcha (server bug to respect)

`PATCH /api/people/[id]` currently strips `city/country/timezone` from
`birth_place` (narrower zod than POST). Until fixed server-side (work item
API-M3), the mobile client sends birth-place edits by resending the FULL
shape through POST-compatible fields and treats PATCH birth_place as
lat/lng/name only. Never rely on PATCH to persist timezone.

## 2. API surface consumed (bearer auth once AUTH-M1 lands)

| Use | Endpoint | Notes |
|---|---|---|
| Bootstrap | `GET /api/profile` | creates users+profiles rows on first call |
| Profile | `PATCH /api/profile` | onboarding completion mirrors self person |
| People | `GET/POST /api/people`, `PATCH/DELETE /api/people/[id]` | POST 403 `limit_exceeded` at plan cap; DELETE soft by default, `?permanent=true` hard; PATCH `action:'restore'` |
| Readings persist | `GET/POST/DELETE /api/computed-results` | `?personIds=a,b` batch read; POST upserts per (person, system, version) |
| Relationships | `GET/POST /api/relationships`, `PATCH/DELETE /api/relationships/[id]`, `GET /api/relationships/person/[id]` | 409 duplicate pair+type |
| Groups | `GET/POST /api/groups`, `GET/PATCH/DELETE /api/groups/[id]`, `POST/DELETE /api/groups/[id]/members` | `{personIds}` replaces member set |
| Shares | `GET/POST /api/shares`, `PATCH/DELETE /api/shares/[id]` | token + password hash server-minted |
| Public share | `GET/POST /api/share/[token]` | no auth; 404/410/401 `{requiresPassword}`; POST `{password}` |
| Boards (RO) | `GET /api/boards`, `GET /api/boards/recent` | v1 read-only |
| AI | `POST /api/ai/interpret` | 10/min/user rate limit; 403 quota; 503 no key; returns `{interpretation, themes, cachedAt}` |
| Knowledge | `POST /api/knowledge/search` | public, 60/min/IP, `{query 2–200, limit ≤10}` |
| Billing | `GET /api/billing/subscription` (`?refresh=1`), `POST /api/billing/checkout`, `POST /api/billing/portal`, `DELETE/PATCH subscription` | checkout URL opened in browser |
| Notifications | `GET/PUT /api/notifications/settings` | + PUSH-M1 device registration |

Error contract (uniform): 400 `{error:'Invalid input', details}` · 401
`{error}` · 403 `{error, code:'limit_exceeded'}` · 404 · 409 · 410 · 429
(+ `X-RateLimit-*`) · 500 `{error:'Internal error'}`.

## 3. Compute-vs-fetch matrix

| Data | Source | Offline? |
|---|---|---|
| Six system readings | on-device `@pleiad/engine` | ✓ |
| Pair compatibility (5-system) | on-device | ✓ |
| Group analysis | on-device from cached members | ✓ |
| Predictions / timeline / moon | on-device | ✓ |
| Today board (kin, moon, long count) | on-device | ✓ (gate + Hebrew date need server/table — render "—" offline) |
| People / relationships / groups / shares | API, cached | read ✓ / write ✗ (v1) |
| AI interpretation | API only (Gemini) | ✗ |
| Knowledge search | API only (pgvector) | ✗ (doc texts bundled/cached ✓) |
| Entitlements | API (`subscription`), cached with 15min staleTime | last-known ✓ |

## 4. Caching & persistence (TanStack Query + MMKV)

- Persisted cache: `['people']`, `['computed', personId]`,
  `['relationships']`, `['groups']`, `['profile']`, `['subscription']`,
  `['docs']`. maxAge 30 days; cache busted on sign-out or user-id change.
- staleTime: people/relationships/groups 60s (refetch on focus),
  subscription 15min, profile 5min, docs 24h.
- Optimistic mutations: person create/edit/delete, relationship CRUD, group
  membership. Rollback + toast on failure; 403 → paywall (no toast).
- Computed results: write-behind — engine output rendered immediately,
  POST fire-and-forget with retry (exponential ×3); reconciliation on next
  person read.
- Secure storage: Auth0 refresh/access tokens ONLY in expo-secure-store.
  Nothing user-identifying in plain AsyncStorage. MMKV instance encrypted
  with a secure-store-held key (people birth data is sensitive).

## 5. Local-only state

- Onboarding draft (zustand + MMKV): step, entered fields — survives kill.
- Add-person draft: retained across paywall interruption (F3/Scenario J).
- UI prefs: reduced-motion override, Face ID lock flag, last active tab,
  dismissed checklist items.
- Push token + permission status.

## 6. Backend work items (prerequisites, tracked here once)

| ID | Item | Shape |
|---|---|---|
| AUTH-M1 | Bearer-token auth path | Auth0 API audience + JWT verify in `requireUserId()`; additive to cookie path |
| PUSH-M1 | Push devices | `device_push_tokens(user_id, expo_push_token, platform, created_at)` + `POST/DELETE /api/notifications/devices`; cron fans out via Expo Push |
| API-M3 | Fix `people/[id]` PATCH birth_place schema | widen to full BirthPlace (city/country/timezone currently stripped) |
| API-M4 (nice) | `GET /api/bootstrap` | one round-trip: profile + people + relationships + groups + computed versions — cold-start saver; v1 can ship without |

No other server change required: contracts above are consumed as-is.

## 7. Privacy & retention

- Birth data of third parties lives on device (encrypted MMKV) + server
  rows owned by the user; share projections already strip birth data,
  owner_id, password_hash (server-verified — keep it that way).
- Sign-out wipes tokens + query cache + MMKV user instance.
- Contact autocomplete (F3) reads the contact book in-memory only; nothing
  uploaded without explicit save; permission requested lazily at first use.
- Analytics carry no birth data — ids and event names only.
