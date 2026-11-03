# App Performance Prompt

A reusable prompt for performance phases, and where Pleiad stands against
it. Run the prompt at the start of each performance phase; update the
standing table when a phase lands.

## Source

An Instagram reel by breakingbreach (2026) shows a 31-point checklist for
making an app fast. The author sends the full prompt only by direct message
in exchange for a comment, so it is not public. The prompt below is
reconstructed from the checklist on screen; words cut off in the video are
completed from context and marked in the item list with brackets.

## Constraints this prompt runs under

- The database stays in Supabase's Sydney region. This is the owner's
  decision and is not reopened. Latency to it is handled by Hyperdrive,
  Smart Placement, parallel queries and client caches.
- Hyperdrive query caching stays off. The app reads as the database owner
  and bypasses row-level security, so no cache may sit between tenants. A
  cache of shared data must be keyed so that one user's rows never answer
  another's request.
- The web app runs on Cloudflare Workers through OpenNext. Anything that
  assumes a long-lived Node server (an in-process Redis client, a local
  queue) is replaced by the Workers equivalent: KV or the Cache API for
  caching, Queues or Cron Triggers for background work.
- Zero added monthly spend unless the owner approves it.

## The prompt

```text
You are a performance engineer auditing this app. Work through the 31
practices below in order. For each one: find where the app stands, with
file:line evidence; mark it Done, Partial, Gap or N/A; and for a Gap or
Partial, name the smallest change that closes it in the layer that owns
the concern. Respect the constraints in docs/perf/APP_PERFORMANCE_PROMPT.md.
Measure before and after every change (server timing, Web Vitals, bundle
size), and record the numbers in that file's standing table. Do not move
the database.

1.  Show skeleton screens while content loads.
2.  Serve images as WebP or AVIF.
3.  Stop duplicate API calls for the same data.
4.  Debounce search and autocomplete inputs.
5.  Paginate API results.
6.  Serve static files from a CDN.
7.  Move slow work to a background [queue or worker].
8.  Fix N+1 queries.
9.  Compress responses with Brotli or Gzip.
10. Cache frequently read data (Redis, or KV and the Cache API here).
11. Remove unused dependencies.
12. Put a timeout on every external API call.
13. Stream AI responses token by token.
14. Update the UI before the server [answers] (optimistic updates).
15. Lazy-load images below [the fold].
16. Run independent requests in [parallel].
17. Index the database for the common [queries].
18. Trace slow backend requests.
19. Run servers close to the database.
20. Render pages on the server or at build time.
21. Load third-party scripts after the page.
22. Split JavaScript by page.
23. Virtualize long lists.
24. Select only the columns you need.
25. Pool database connections.
26. Prevent unnecessary re-renders.
27. Let browsers cache static files.
28. Balance traffic across app instances.
29. Self-host fonts and limit the weights.
30. Track real users' speed with a monitoring tool.
31. Test on slow phones and slow networks.
```

## Where Pleiad stands

Audited 2026-11-02 against the working tree; phase 2 rows updated 2026-11-03. Paths are relative to `src/`
unless they start at the repository root.

| # | Practice | Status | Evidence | Next step |
|---|---|---|---|---|
| 1 | Skeletons | Done | `components/ui/skeleton.tsx` in about 20 app pages; the bento kit's `Skeleton` | — |
| 2 | WebP/AVIF | Done | `public/images` is WebP and SVG; the 150 dreamspell glyphs (2.3 MB in all) stay GIF and PNG, cached by `public/_headers` | — |
| 3 | No duplicate calls | Done | Every server read goes through a query: the list hooks, `useSubscription` with its store sync, `useResonanceMatrix`, `useNotificationSettings`; one `fetchJson` in `lib/http/json.ts` | — |
| 4 | Debounced search | Done | `ui/location-picker.tsx` (300 ms); knowledge search runs on submit | — |
| 5 | Pagination | Gap | `app/api/people/route.ts` and the boards, groups and relationships routes return whole lists | Cursor on (`updated_at`, `id`) |
| 6 | Static via CDN | Done | Workers Static Assets (`wrangler.jsonc` `assets`) | — |
| 7 | Background work | Partial | Cron worker exists; `daily-kin` sends mail one by one inside the request | Cloudflare Queues for the fan-out |
| 8 | N+1 queries | Partial | `daily-predictions` is batched; `daily-kin` still logs each send separately | Batch the send log |
| 9 | Compression | Done | Cloudflare edge compression; `compress: true` | — |
| 10 | Hot-data cache | Partial | KV for rate limits only; R2 incremental cache; persisted client cache | Edge-cache public reads (daily kin, today, knowledge, shares) |
| 11 | Unused dependencies | Gap | No imports of `@react-three/fiber`, `@react-three/drei`, `cheerio`, `jose`, `node-fetch`, `node-addon-api`; `@types/three` is a runtime dependency | Remove after a build check |
| 12 | External timeouts | Done | One deadline table, `lib/http/deadline.ts`, read by Turnstile, RevenueCat, Expo push, the briefing collectors and both LLM clients | — |
| 13 | Streamed AI | Gap | `services/llm.ts` and `api/ai/interpret` return whole responses | Stream the quick reading |
| 14 | Optimistic UI | Done | `lib/query/cache-mutation.ts` behind the people, boards, groups, relationships and shares hooks: guesses with their own undo, the server's row settled in, background refetch | Measure save-to-close on the deployed worker |
| 15 | Lazy images | Done | Every `<img>` states `loading`; ESLint `no-restricted-syntax` fails one that does not | — |
| 16 | Parallel requests | Partial | The share route takes its owner from the atomic view count, and `api/people` reads plan and usage together; the password path still reads the share twice | Fold the password check into the share read |
| 17 | Indexes | Partial | Owner indexes exist; no vector index on `content_chunks.embedding`; no (owner, `updated_at`) on boards or (owner, `start_date`) on predictions | One migration, applied by the owner |
| 18 | Tracing | Partial | `observability.enabled` gives logs only | Turn on Workers traces |
| 19 | Near the database | Done | Smart Placement and Hyperdrive; the database stays in Sydney | — |
| 20 | Server or build rendering | Partial | Public pages use ISR; the signed-in app renders in the browser | — |
| 21 | Third-party scripts late | Partial | Analytics load after hydration; one beacon is a raw deferred script in the root layout | Load it `lazyOnload` |
| 22 | Code split | Done | No heavy library in shared shells; graphs and 3D load dynamically | Load the canvas export (html2canvas, jspdf) on demand |
| 23 | Virtual lists | Partial | Mobile uses FlashList; the web people list renders every row | When lists grow |
| 24 | Needed columns | Partial | The board list leaves out the drawing (`BoardSummary`), and plan caps and usage count rows (`countBoards`, `countTrackedPeople`) instead of loading every board and person with tags; other bare `.select()` calls remain | Audit the remaining list reads |
| 25 | Pooling | Done | Hyperdrive plus postgres-js `max: 4` | — |
| 26 | Re-renders | Partial | React Compiler on mobile only | Try it on web |
| 27 | Browser caching | Done | `public/_headers`: hashed build output and icons for a year, immutable; hand-placed images, videos, dreamspell art and textures for a day, refreshed in the background for a week | — |
| 28 | Load balancing | N/A | Workers scale across isolates and locations | — |
| 29 | Fonts | Partial | `next/font` self-hosts; the unused Barlow 300 and the stale Google preconnects are gone; four families and 14 weights remain | Measure which weights each surface renders |
| 30 | Real-user speed | Done | PostHog pageviews and `$web_vitals` (LCP, CLS, FCP, INP) from `initPostHog` | Read the Web Vitals tab after a day of traffic |
| 31 | Slow devices | Gap | CI typechecks, lints, tests and builds only | Lighthouse CI with mobile throttling |

The browser also calls `supabase.auth.getUser()` on every app load
(`lib/hooks/use-auth.ts`), a network trip to Supabase Auth. It is not on the
critical path: `onAuthStateChange` delivers the stored session first and
the UI renders from it, while `getUser` confirms the session with the
server. It stays.

## Phases

Ordered by user-visible payoff for effort. Each phase is measured before
and after, and committed on its own.

1. **Quick wins.** Landed 2026-11-02: caching for public media (27), the
   board list without its drawing and counted caps (24), the share and
   people routes folded and parallel (16), deadlines on outbound calls
   (12), the unused font weight and preconnects (29). Still in this phase:
   unused dependencies (11), removed in a commit of their own after a full
   web build and a mobile bundle, since a root uninstall re-hoists the
   workspaces. The beacon (21) already loads deferred after parsing, so
   moving it to `lazyOnload` would trade lost pageviews for no measured
   gain; it stays.
2. **Felt speed.** Landed 2026-11-03, designed under "Phase 2: felt
   speed" below: mutations answer from the cache (14), Web Vitals in
   PostHog (30), every image states how it loads (2, 15), every server
   read goes through a query (3).
3. **Server load.** Cursor pagination (5). The index migration (17), applied
   by the owner. Edge cache for public reads, keyed so no user's rows
   answer another's request (10). Mail fan-out on Queues with a batched send
   log (7, 8). Workers traces (18).
4. **Guards.** Streamed AI readings (13). Lighthouse CI on a throttled
   mobile profile (31). React Compiler on web (26). Virtual lists once they
   grow (23).

## Phase 2: felt speed

Four practices, each solved once for its whole population rather than per
call site.

### Mutations answer from the cache (14)

Every mutation of a cached list waits for its request and then for a full
refetch of the list before the caller's promise resolves: two round trips
to Sydney, about 1.2 s, before a dialog closes or a row disappears. The
population is the five list hooks in `lib/hooks/` (people, boards, groups,
relationships, shares) and the group membership writes.

**One factory.** `lib/query/cache-mutation.ts` turns a declaration into
TanStack `useMutation` options. A declaration names the query key it
changes, the request, and up to three pure functions: `optimistic`, a
guess applied before the request leaves; `settle`, an edit of the loaded
value with the server's answer; `replace`, the server's answer as the
whole value. It may also name `also`, other keys whose data embeds what
changed, and ask to run `serial`, in order with the other mutations of its
key. The factory owns the protocol, in TanStack's own callbacks:

1. `onMutate` cancels the key's in-flight fetch, then applies the guess.
   The guess keeps the cached value's timestamp, so it never counts as
   fresher than what the server last said.
2. `onError` undoes the guess, and only the guess (below).
3. `onSuccess` applies `settle` or `replace`.
4. `onSettled` refetches the key, every key beneath it and each `also` key
   in the background, each once no mutation under it is still running. The
   check runs on the next task, when this mutation no longer counts, so two
   that finish together cannot both leave the refetch to the other. It is
   not awaited: the caller's promise resolves on the server's answer.

**Guesses undo themselves.** A guess is the edited value plus its own
undo, so a failed mutation never restores a whole-list snapshot over
another mutation's work. Undo is compare-and-swap: a patched row goes back
only while the list still holds the exact row the guess wrote; a removed
row comes back at its old place only while no row with its id is listed; a
replaced record goes back only while the cache still holds the guess.
Whatever the undo leaves is corrected by the refetch that follows the last
mutation. The edits (`patchRow`, `dropRow`, `upsertRow`, `swap`, and
`within` to aim an edit at one field of a larger value) are pure and live
in `lib/query/list-ops.ts`.

**What each operation declares.**

| Operation | Guess | With the answer | Why |
|---|---|---|---|
| Update | patch the row | the server's row in place of the listed one | the row is known; a row deleted meanwhile stays gone |
| Delete | drop the row | — | nothing to add |
| Create, duplicate | — | add the server's row | a temporary id would leak into links and child requests before the server names the row |
| Restore | — | — | no caller; the refetch brings the row |
| Save a settings record, save a board | swap in the merged record; patch the row | replace with the server's record; the server's row | saves run serial so the last edit lands last |

Every answer that becomes a row carries the row the list shows: a person
with its tags, a board without its drawing, a relationship with both
people (the create route returns the joined row from the ownership check
it already runs), a share as the client's `ShareLink`. A create never
seeds a list that has not loaded.

**Order is presentation.** Each list hook sorts with one comparator in its
query's `select`, for fetched and settled rows alike, with the id as tie
breaker: people and groups by name, boards by `updated_at` newest first,
relationships and shares by `created_at` newest first. An edit that
changes a sort field moves the row at once.

**Keys are one registry.** `lib/query/keys.ts` holds every key. A query
that derives from another lives beneath it (the compatibility matrix is
`people/matrix`), so the parent's refetch refreshes it. A person's change
also refreshes relationships and groups, whose rows embed people. Group
membership writes run under the groups key, so the list's refetch waits
for them and each group's member list beneath the key refreshes after
them.

**Persistence holds no guesses.** The persisted cache skips any query with
a mutation running under its key and never stores mutations; a reload
mid-mutation restores the last confirmed data or nothing. List queries
pass the query's `signal` to `fetch`, so a cancelled read stops on the
network too.

**Readings leave the critical path.** Adding a person, or changing a birth
date, recomputes the person's readings and stores them. The mutator now
resolves when the person is saved; the readings are computed and stored
after it, and a failure there costs nothing durable, since the person's
page computes and stores whatever is missing on its first visit
(`getOrCompute`, an upsert).

The hooks' public signatures do not change. Mutators still return the
server's row and still reject on failure; the shares hook still reports
failure through its `error` slot and a null or false return. A page that
only adds or saves a board uses `useCreateBoard` or `useUpdateBoard`,
which do not load the list, and the editor reads its board with
`fetchBoard`.

Every route that adds a board, by creating or by duplicating, asks
`lib/api/board-entitlement.ts` first, so the plan's board cap holds
whichever way the board arrives.

### Real-user Web Vitals (30)

posthog-js measures LCP, CLS, FCP and INP with Google's `web-vitals`
library and sends them as `$web_vitals` events, which PostHog's Web
Analytics reads. `initPostHog` turns it on with
`capture_performance: { web_vitals: true }`, attribution off (the lighter
build) and network timing off (it serves session replay, which is not
used). It sits behind the same gate as pageviews: a key, production, and
Do Not Track respected. PostHog is the only reporter; a second one through
Next's `useReportWebVitals` would double-count.

### Server reads go through queries (3)

The population is every effect that fetches server state into component
state outside the query layer: the billing page's subscription, the
compatibility matrix, and notification settings, read by three
components. Each becomes one hook over one key, so every reader shares one
cache entry, repeat visits paint from the persisted cache, and failures
retry.

**Subscription.** One key, `billing/subscription`, read by `usePlan` and
the billing page. Because a purchase on the phone can race the store's
webhook, the billing page also runs a sync: a read of `refresh=1` whose
answer replaces the canonical entry after cancelling any plain read in
flight, so a slower plain read cannot overwrite the synced plan. The sync
is a query of its own (deduplicated, refreshed when the window regains
focus once the app's default freshness has passed, never persisted), not
an effect.

**Notification settings.** One key, `notifications/settings`, holding the
full record. `useNotificationSettings().save(patch)` merges the patch
into the cached record and sends the whole of it, serially, so a field a
screen does not show keeps its stored value; a change whose own save
failed goes up again with the next save, so the stored record ends as the
screen does. The predictions panel edits a
local draft seeded from the cache and saves it through the same call.

### Every image states how it loads (2, 15)

`public/images` is already WebP and SVG. The remaining cost is twenty raw
`<img>` elements with no loading hint, so images under the fold load with
the page. The rule: every `<img>` states `loading`, lazy under the fold
and eager in the first view; the one image that is the page's largest
paint also takes `fetchPriority="high"`. ESLint enforces it with
`no-restricted-syntax` on the JSX element, with the server-rendered Open
Graph card exempt, so the next image follows the rule without review.
`next/image` is not required: the assets are already compressed. The
dreamspell glyphs (150 small GIF and PNG files, 2.3 MB in all, cached by
`public/_headers`) stay as they are.

### Measured

Before and after, on the deployed worker: time from a person's save to
the dialog closing, and from a delete to the row leaving; Web Vitals once
a day of traffic has reported.

### Second opinion

Codex (`gpt-6-astra`), 2026-11-02: the mutation protocol, rollback,
persistence, list order, the relationship join, Web Vitals, the
subscription sync and the image rule. Incorporated.

Architect review, 2026-11-03: refetch gating, settlement of updates,
list-free board hooks, serial board saves, the sync's freshness, the
board cap on duplicate. Incorporated.
