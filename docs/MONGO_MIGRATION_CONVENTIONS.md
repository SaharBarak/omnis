# Mongo Migration Conventions (Phase 1c)

The **people domain is the reference implementation**. Every other domain mirrors
it exactly. Files to study:
- `src/lib/db/repositories/people-repo.ts`
- `src/app/api/people/route.ts`, `src/app/api/people/[id]/route.ts`
- `src/app/api/tags/route.ts`, `src/app/api/tags/[id]/route.ts`
- `src/lib/hooks/use-people.ts`

## The rules

1. **Tenant scoping is mandatory and lives in the repository.** Postgres RLS is
   gone. Every query filters by the owner field (`owner_id`/`user_id`) equal to
   the `userId` passed in from `requireUserId()`. NEVER trust an owner id from
   the request body or query string. A query without an owner filter is a
   security bug.

2. **Browser cannot touch Mongo.** Client hooks become thin `fetch` clients.
   All DB access happens in server route handlers that call repositories.

3. **Layering:**
   - `src/lib/db/repositories/<domain>-repo.ts` — pure data functions, first arg
     always `userId: string`. Calls `connectMongo()` first. Returns serialized
     plain objects (never raw Mongoose docs).
   - `src/app/api/<domain>/...route.ts` — `requireUserId()`, Zod-validate input,
     call repo, return `NextResponse.json`. Wrap errors with
     `handleApiError(error, 'METHOD /path')`.
   - `src/lib/hooks/use-<domain>.ts` — `fetch` the routes; keep the existing
     public API (exported function names + signatures) identical.

4. **Serialization:** return `serialize(doc)` / `serializeMany(docs)` from
   `@/lib/db/serialize`. It maps `_id`→`id` (string), ObjectId→string,
   Date→ISO string, drops `__v`. Client types mirror the OLD Supabase row shape
   (`string | null`, never `undefined`).

5. **Ids from clients:** convert with `toObjectId(id)` (throws `BadIdError`,
   handled as 400). Validate before querying.

6. **Auth:** `requireUserId()` / `getCurrentUserId()` from `@/lib/auth-server`.
   `UnauthorizedError` → 401 via `handleApiError`.

7. **Ownership checks on mutate:** update/delete use
   `findOneAndUpdate({ _id, owner_id: userId }, ...)` /
   `deleteOne({ _id, owner_id: userId })`. If `matchedCount`/`deletedCount` is 0,
   the route returns 404 (could be missing or not owned — same response, no leak).

8. **Shared/public access** (share tokens) is the only path that reads without an
   owner filter, and it must filter by the unguessable token plus an `is_active`
   flag, and only return the minimum needed.

9. **Port SQL RPCs** as Mongoose aggregations / atomic ops inside the relevant
   repository (e.g. `increment_usage` → atomic `$inc` upsert; relationship graph
   → aggregation). Document which RPC each function replaces.

10. **Do not** delete `src/lib/supabase/*` yet — it is removed in Phase 4 once
    every consumer is migrated. Keeping it lets the project typecheck during the
    transition.
