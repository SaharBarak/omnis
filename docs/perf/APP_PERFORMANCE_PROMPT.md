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

Audited 2026-11-02 against the working tree. Paths are relative to `src/`
unless they start at the repository root.

| # | Practice | Status | Evidence | Next step |
|---|---|---|---|---|
| 1 | Skeletons | Done | `components/ui/skeleton.tsx` in about 20 app pages; the bento kit's `Skeleton` | — |
| 2 | WebP/AVIF | Partial | `next.config.mjs` allows both, but `next/image` is in 7 files and `public/images` holds 74 PNGs (7.7 MB) | Convert the PNGs |
| 3 | No duplicate calls | Partial | TanStack Query dedupes; raw effect fetches remain in `graph/resonance-matrix.tsx`, `settings/billing/page.tsx` | Move them into `useQuery` |
| 4 | Debounced search | Done | `ui/location-picker.tsx` (300 ms); knowledge search runs on submit | — |
| 5 | Pagination | Gap | `app/api/people/route.ts` and the boards, groups and relationships routes return whole lists | Cursor on (`updated_at`, `id`) |
| 6 | Static via CDN | Done | Workers Static Assets (`wrangler.jsonc` `assets`) | — |
| 7 | Background work | Partial | Cron worker exists; `daily-kin` sends mail one by one inside the request | Cloudflare Queues for the fan-out |
| 8 | N+1 queries | Partial | `daily-predictions` is batched; `daily-kin` still logs each send separately | Batch the send log |
| 9 | Compression | Done | Cloudflare edge compression; `compress: true` | — |
| 10 | Hot-data cache | Partial | KV for rate limits only; R2 incremental cache; persisted client cache | Edge-cache public reads (daily kin, today, knowledge, shares) |
| 11 | Unused dependencies | Gap | No imports of `@react-three/fiber`, `@react-three/drei`, `cheerio`, `jose`, `node-fetch`, `node-addon-api`; `@types/three` is a runtime dependency | Remove after a build check |
| 12 | External timeouts | Partial | `briefing/http.ts` has one; Turnstile, RevenueCat, push and the LLM clients have none | `AbortSignal.timeout` on each |
| 13 | Streamed AI | Gap | `services/llm.ts` and `api/ai/interpret` return whole responses | Stream the quick reading |
| 14 | Optimistic UI | Gap | No `onMutate`; people and boards wait for a refetch, two Sydney round trips | `onMutate` with rollback |
| 15 | Lazy images | Partial | Two `loading="lazy"`; raw `<img>` in `canvas/nodes/person-node.tsx`, `learn/dreamspell/page.tsx` | `next/image` or `loading="lazy"` |
| 16 | Parallel requests | Partial | `api/share/[token]` makes four queries in a row, one a redundant owner lookup; `api/people` reads plan then usage in sequence | Fold and parallelise |
| 17 | Indexes | Partial | Owner indexes exist; no vector index on `content_chunks.embedding`; no (owner, `updated_at`) on boards or (owner, `start_date`) on predictions | One migration, applied by the owner |
| 18 | Tracing | Partial | `observability.enabled` gives logs only | Turn on Workers traces |
| 19 | Near the database | Done | Smart Placement and Hyperdrive; the database stays in Sydney | — |
| 20 | Server or build rendering | Partial | Public pages use ISR; the signed-in app renders in the browser | — |
| 21 | Third-party scripts late | Partial | Analytics load after hydration; one beacon is a raw deferred script in the root layout | Load it `lazyOnload` |
| 22 | Code split | Done | No heavy library in shared shells; graphs and 3D load dynamically | Load the canvas export (html2canvas, jspdf) on demand |
| 23 | Virtual lists | Partial | Mobile uses FlashList; the web people list renders every row | When lists grow |
| 24 | Needed columns | Partial | 32 bare `.select()`; `listBoards` reads each board's canvas, layers and thumbnail | Select list columns |
| 25 | Pooling | Done | Hyperdrive plus postgres-js `max: 4` | — |
| 26 | Re-renders | Partial | React Compiler on mobile only | Try it on web |
| 27 | Browser caching | Partial | `public/_headers` covers `/_next/static` and `/icons` only; `next.config` headers do not reach static assets on Workers | Long-lived rules for images, videos and the dreamspell art |
| 28 | Load balancing | N/A | Workers scale across isolates and locations | — |
| 29 | Fonts | Partial | `next/font` self-hosts, but four families and 15 weights load; Barlow 300 is unused; stale Google preconnects | Cut weights and preconnects |
| 30 | Real-user speed | Partial | PostHog pageviews; no Web Vitals reporting | `useReportWebVitals` to PostHog |
| 31 | Slow devices | Gap | CI typechecks, lints, tests and builds only | Lighthouse CI with mobile throttling |

The browser also calls `supabase.auth.getUser()` on every app load
(`lib/hooks/use-auth.ts`), a network trip to Supabase Auth; `getClaims()`
verifies the token locally.

## Phases

Ordered by user-visible payoff for effort. Each phase is measured before
and after, and committed on its own.

1. **Quick wins.** Long-lived caching for public media (27). The board list
   reads list columns only (24). The share and people routes fold and
   parallelise their queries (16). Auth on load verifies claims locally.
   Timeouts on external calls (12). The beacon loads late (21). Unused font
   weights and preconnects go (29). Unused dependencies go after a build
   check (11).
2. **Felt speed.** Optimistic mutations for people and boards (14). Web
   Vitals reported to PostHog (30). Images converted and lazy (2, 15). The
   remaining raw fetches move into queries (3).
3. **Server load.** Cursor pagination (5). The index migration (17), applied
   by the owner. Edge cache for public reads, keyed so no user's rows
   answer another's request (10). Mail fan-out on Queues with a batched send
   log (7, 8). Workers traces (18).
4. **Guards.** Streamed AI readings (13). Lighthouse CI on a throttled
   mobile profile (31). React Compiler on web (26). Virtual lists once they
   grow (23).
