# Pleiad Platform Migration Plan

Four concurrent migrations off the Supabase/Stripe/Anthropic/Vercel stack onto a
MongoDB / Paddle / Gemini / Cloudflare stack.

## Locked decisions

| Concern | From | To |
|---|---|---|
| Database | Supabase Postgres | MongoDB Atlas (Mongoose ODM) |
| Auth | Supabase Auth | Better Auth (Mongo adapter) |
| Authorization | Postgres RLS | App-layer tenant scoping |
| Vector search | pgvector (384d) | Atlas Vector Search (384d) |
| Query embeddings | @xenova/transformers (local) | Workers AI `@cf/baai/bge-small-en-v1.5` (384d) |
| Billing | Stripe | Paddle (merchant of record) |
| Inference | Anthropic Claude | Gemini via `@google/genai` |
| Hosting | Vercel | Cloudflare Workers (OpenNext adapter) |
| Cron | Vercel cron | Cloudflare Cron Triggers |
| Observability | Vercel Analytics + Sentry | Cloudflare-native (Web Analytics + Workers logs) |
| 5-system group fusion | — | **Deferred** to follow-up pass |

## Dependency order

```
Phase 0  Cloudflare runtime foundation   (substrate — unblocks all)
Phase 1  Supabase → Mongo + Better Auth  (biggest; depends on 0)
Phase 2  Anthropic → Gemini             (small; parallel after 0)
Phase 3  Stripe → Paddle                (medium; depends on 1 for subs collection)
Phase 4  Cleanup, cutover, decommission
```

---

## Phase 0 — Cloudflare runtime foundation

**Why first:** Workers runtime (V8 isolates, not Node) decides which libraries
survive. Everything else builds on this substrate.

- Adopt `@opennextjs/cloudflare` (OpenNext) for Next.js 16 on Workers. Add
  `wrangler.toml` / `wrangler.jsonc`, enable `nodejs_compat` flag.
- Bind Workers AI (`AI`) and secrets (Mongo URI, Better Auth secret, Paddle,
  Gemini) via wrangler vars / `.dev.vars`.
- Move `vercel.json` crons → Cloudflare **Cron Triggers** (3 jobs: daily-kin
  `0 6 * * *`, daily-predictions `0 4 * * *`, send-notifications `0 8 * * *`).
  Cron handler calls existing route logic guarded by `CRON_SECRET`.
- Drop Vercel deps: `@vercel/analytics`, `@vercel/speed-insights`,
  `@sentry/nextjs`. Wire Cloudflare Web Analytics (script tag) + Workers logs.
- Port `next.config.mjs` headers → OpenNext / Workers (or keep; OpenNext honors
  most). Image optimization: switch to Cloudflare Images or `unoptimized`.
- Scraper (`render.yaml`, `Dockerfile.scraper`) stays a Node container (Render or
  CF Container) — runs offline, no Workers constraint. Update its env to Mongo.

**Runtime landmines to verify (build-test each):**
- `@xenova/transformers` — request-path usage removed in Phase 1 (→ Workers AI).
  Remains only in offline scraper (`packages/scraper/embed-knowledge.ts`), fine.
- `circular-natal-horoscope-js`, gematria/HD/tzolkin calc libs — pure JS, should
  run in Workers; confirm no `fs`/Node built-ins.
- `three`, `@react-three/*`, `jspdf`, `html2canvas` — client-only, unaffected.
- `cheerio`, `node-fetch` — scraper only (offline Node), unaffected.

**Exit:** app builds + deploys to a Workers preview; crons fire; no Vercel deps.

---

## Phase 1 — Supabase → MongoDB + Better Auth

Biggest phase. Supabase bundled DB + Auth + RLS; all three replaced.

### 1a. Mongoose models (20 collections)

Port `supabase/migrations/0000{1..7}` to schemas under `src/lib/db/models/`:

`profiles, people, tags, person_tags, computed_results, relationships, groups,
group_members, shared_views, boards, board_shares, predictions,
notification_settings, calendar_events, newsletter_subscribers, email_send_log,
subscriptions, usage, knowledgeBase, contentChunks`

- `person_tags`/`group_members`/`board_shares` join tables → embedded arrays or
  ref arrays where it simplifies (Mongo modeling, not 1:1 SQL port).
- `contentChunks.embedding` → `[Number]` (384) with an **Atlas Vector Search
  index** (cosine), replacing the pgvector HNSW index.
- Indexes: port btree/composite/text indexes to Mongoose `schema.index()`
  (people text search on name/hebrew_name, predictions date range, usage
  `{user_id, period}`).

### 1b. Better Auth

- Install Better Auth + MongoDB adapter; mount handler at `/api/auth/[...all]`.
- Configure OAuth provider(s) currently behind Supabase + email. Replace
  `src/app/auth/callback/route.ts` (`exchangeCodeForSession`) with Better Auth
  callback.
- Replace `middleware.ts` → `updateSession` (Supabase) with Better Auth session
  check. Keep the same protected matcher (`/app`, `/dashboard`, `/people`,
  `/profile` → `/login`).
- Replace `src/lib/hooks/use-auth.ts` (`getSession`) with Better Auth client
  hook. On sign-up, create the `profiles` doc (today done in callback).

### 1c. Replace data clients (RLS → app-layer scoping) — SECURITY CRITICAL

Delete `src/lib/supabase/{client,server,middleware}.ts`. Add a Mongoose
connection helper + a **session-scoped repository layer**. RLS is gone, so
**every read/write must filter by the authenticated `userId`/`ownerId`** — this
is now enforced in code, not the DB. One missed filter = cross-tenant leak.

Rewrite `.from(...)` call sites (every query gets an explicit owner filter):

| File | Collections |
|---|---|
| `src/lib/hooks/use-people.ts` | people, tags, person_tags |
| `src/lib/hooks/use-relationships.ts` | relationships, people |
| `src/lib/hooks/use-groups.ts` | groups, group_members |
| `src/lib/hooks/use-boards.ts` | boards, board_shares |
| `src/lib/hooks/use-shares.ts` | shared_views |
| `src/lib/hooks/use-computed-results.ts` | computed_results |
| `src/lib/services/usage.ts` | subscriptions, usage |
| `src/lib/services/notifications.ts` | notification_settings, profiles |
| `src/lib/services/email.ts` | newsletter_subscribers |
| `src/lib/services/ai-interpretations.ts` | predictions |
| `src/lib/services/knowledge-search.ts` | knowledgeBase, contentChunks |
| `src/app/api/cron/*` | people, predictions, newsletter, email_send_log |
| `src/app/api/billing/*` | subscriptions (Phase 3) |
| `src/app/api/newsletter/*` | newsletter_subscribers |
| `src/app/share/[token]/page.tsx`, `src/app/app/people/[id]/page.tsx` | shared_views, people, tags |

> Client-side hooks currently query Supabase directly from the browser (RLS made
> that safe). With Mongo + no RLS, **browser cannot hold DB creds** — these hooks
> must call new Next API routes (server) that enforce session + owner scope.
> This is a structural shift: hooks become fetch wrappers, logic moves server-side.

### 1d. Port 9 SQL RPCs → aggregation pipelines / server functions

`get_person_with_tags`, `get_person_relationships`, `get_relationship_graph`,
`get_group_with_members`, `increment_shared_view_count`,
`get_board_by_share_token`, `duplicate_board`, `get_recent_boards`,
`get_predictions_for_range`, `search_knowledge`, `increment_usage`,
`get_user_plan` → Mongoose aggregations / atomic `$inc` updates. `search_knowledge`
becomes Atlas `$vectorSearch`.

### 1e. Knowledge search rewrite

`src/lib/services/knowledge-search.ts`: drop Xenova; embed query via **Workers
AI bge-small** (`env.AI.run('@cf/baai/bge-small-en-v1.5')`), run Atlas
`$vectorSearch`. **Re-embed the corpus** with bge-small (update
`packages/scraper/embed-knowledge.ts`) so corpus + query share one 384d space.

**Exit:** auth works; all CRUD on Mongo; every query owner-scoped; vector search
returns; no `@supabase/*` imports remain.

---

## Phase 2 — Anthropic → Gemini

Smallest. One file, two calls, one route. Parallelizable after Phase 0.

- `src/lib/services/ai-interpretations.ts`: replace `@anthropic-ai/sdk` +
  `getAnthropicClient()` with `@google/genai` (`GoogleGenAI`,
  `models.generateContent`). Map `messages.create` → `generateContent`.
- Two prompts (`generateInterpretation` full JSON, `generateQuickInterpretation`
  text): move Anthropic system prompt → Gemini `systemInstruction`; use
  `responseMimeType: 'application/json'` + a response schema for the JSON path
  (replaces manual `JSON.parse`).
- `src/app/api/ai/interpret/route.ts`: swap the `ANTHROPIC_API_KEY` 503 guard →
  `GEMINI_API_KEY`. Keep auth + rate-limit (`rateLimiters.ai`, 10/min) + DB cache.
- Model: `gemini-2.5-flash` (was `claude-3-haiku`) via `GEMINI_MODEL` env.
- UI: `src/components/predictions/AIInterpretation.tsx` "Powered by Claude AI" →
  "Powered by Gemini".
- `@google/genai` is fetch-based → Workers-safe.

**Exit:** interpretations generate via Gemini; JSON parses; no Anthropic imports.

---

## Phase 3 — Stripe → Paddle

Depends on Phase 1 (subscriptions collection). Paddle = merchant of record,
simpler tax/invoicing.

- Delete dead `src/app/api/stripe/webhook/route.ts` (all TODOs, no writes).
- `src/lib/stripe.ts` + `src/lib/services/billing.ts`: replace Stripe SDK with
  `@paddle/paddle-node-sdk`. Keep the `PLANS` tier table + entitlements
  (free/complete/practitioner, limits, `isPlanFeatureAvailable`) — that logic is
  billing-agnostic and stays.
- Checkout: `src/app/api/billing/checkout/route.ts` → Paddle transaction /
  hosted checkout (or `@paddle/paddle-js` overlay client-side). Price IDs →
  Paddle **price IDs** (`PADDLE_PRICE_COMPLETE`, `PADDLE_PRICE_PRACTITIONER`).
- Portal: `src/app/api/billing/portal/route.ts` → Paddle customer portal URL.
- Subscription GET/DELETE/PATCH (`subscription/route.ts`) → Paddle cancel /
  resume APIs; keep `cancel_at_period_end` semantics.
- Webhook `src/app/api/billing/webhook/route.ts`: replace Stripe event handlers
  with Paddle, verify via Paddle signature (`paddle-signature` header):
  | Stripe | Paddle |
  |---|---|
  | checkout.session.completed | transaction.completed / subscription.created |
  | invoice.paid | subscription.updated (active) |
  | invoice.payment_failed | subscription.past_due |
  | customer.subscription.updated | subscription.updated |
  | customer.subscription.deleted | subscription.canceled |
  Same writes to `subscriptions` collection (plan, status, period dates,
  `paddle_customer_id`, `paddle_subscription_id`).
- `subscriptions` schema: rename `stripe_customer_id`/`stripe_subscription_id`
  → `paddle_*`.
- Frontend `src/components/billing/*` + `src/app/app/settings/billing/page.tsx`:
  point at Paddle checkout; swap publishable key.
- Env: drop `STRIPE_*`; add `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET`,
  `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`, `PADDLE_ENV`, price IDs.

**Exit:** checkout → Paddle; webhooks update subs; entitlement gating intact.

---

## Phase 4 — Cutover & decommission

- Delete `supabase/`, `src/lib/supabase/`, `@supabase/*`, `stripe`,
  `@stripe/stripe-js`, `@anthropic-ai/sdk`, `@vercel/*`, `@sentry/nextjs` from
  `package.json`.
- Rewrite `.env.example`: remove Supabase/Stripe/Anthropic/Vercel; add Mongo,
  Better Auth, Paddle, Gemini, Cloudflare bindings.
- Data migration script: export Supabase tables → transform → load Mongo
  (one-off Node script; map UUID PKs → `_id`, FK refs → ObjectId/string).
- Update `README.md`, `AGENTS.md`, `RELEASE.md`, `docker-compose.yml`,
  `Dockerfile*` for the new stack.
- Update tests (vitest): `src/test/mocks.tsx` + service tests currently mock
  Supabase/Stripe/Anthropic → mock Mongoose/Paddle/Gemini.

---

## Cross-cutting risks

1. **RLS removal (P1c)** — highest. Tenant isolation moves from DB to code.
   Need a single choke-point repo layer + an audit that every query is
   owner-scoped. Add integration tests asserting cross-tenant reads return empty.
2. **Browser→server data shift (P1c)** — client hooks can't talk to Mongo
   directly. Real work: new API routes + hooks become fetch clients. Largest
   line-count change.
3. **Embedding space (P1e)** — corpus + query must use bge-small; stale Xenova
   vectors must be fully re-embedded or search silently degrades.
4. **Workers runtime (P0)** — any Node-only dep in the request path breaks at
   deploy, not build. Test each on a preview Worker early.
5. **Paddle approval** — Paddle vets sellers; account/product setup may gate
   Phase 3 go-live independent of code.

## Suggested PR sequence

`P0 cloudflare-foundation` → `P1a-b mongo-models-auth` →
`P1c-e data-layer-cutover` → `P2 gemini` (parallel) → `P3 paddle` →
`P4 decommission`. Each its own PR, background solution-architect review per
your workflow.
