# Promoting bento-v2 to the root

The redesign (the v2 tree: a new home, the "Draw your map" page, and the signed-in
app) moves from `/lab/bento-v2` to the site root and becomes the product served at
pleiad.io. The v1 bento tree supplies the public pages v2 has not rebuilt. The old
hand-built site and app under `src/app` are retired behind redirects.

This is the cutover contract: the physical layout, the single code change that moves
the base, the route-by-route composition, the redirects, the deploy gate, indexing,
and rollback. It sits beside `BENTO_SITE.md` (the route table as the promotion
contract) and `BENTO_V2.md` (the v2 tree).

## The decision

Move the route files to the root and set each tree's base to `''`; do not add
rewrites. The route table (`src/lib/site/routes.ts`) was built for this: `SITE_BASE`
is documented as "becomes '' when the tree is promoted to the root", every row
carries the `live` route it replaces, and `indexed` turns on at promotion. Serving
stays one URL space, so canonicals, the sitemap, the middleware gate prefix
(`V2_GATE.prefix`), the sketch cookie path and the `redirectTo` returns each keep a
single form. Rewrites would hold two URL spaces open and double every one of those.

Precedence at the three shared paths (`/`, `/map`, and the app) is v2's. v1 supplies
the rest. Both bases become `''`; v2's files own the overlapping paths because they
are the files placed at those root segments.

## Composition — who serves each route

Every row of `SITE_ROUTES` is served after promotion; none is dropped. `v2` serves
its own public pages and all signed-in rows; `v1` serves the remaining public pages.

| Route | Served by | Source today |
| --- | --- | --- |
| `/` | v2 | `lab/bento-v2/page.tsx` + `_home` |
| `/map` | v2 | `lab/bento-v2/map` |
| `/app` and all `/app/**` | v2 | `lab/bento-v2/app/**` |
| `/pair`, `/circle`, `/today` | v1 | `lab/bento/(site)/{pair,circle,today}` |
| `/pricing`, `/learn`, `/learn/[slug]` | v1 | `lab/bento/(site)/{pricing,learn}` |
| `/about`, `/contact` | v1 | `lab/bento/(site)/{about,contact}` |
| `/terms`, `/privacy`, `/refund` | v1 | `lab/bento/(site)/{terms,privacy,refund}` |
| `/login` | v1 | `lab/bento/(site)/login` |

Check at cutover: `servedPaths('v2')` ∪ (`SITE_ROUTES` \ `servedPaths('v2')`) must equal
`SITE_ROUTES`, and every v1-served row must have a built page. It does today; a new
unserved row added later would resolve into `/lab` and must be caught by the test
below.

## Physical layout after the move

No two files may own the same URL: Next treats a duplicate route as a build error, so
there is no silent precedence. v2 owns `/`, `/map` and `/app`; v1's pages own distinct
paths, so the trees never collide at root.

The home and map (v2) and the marketing pages (v1) carry different chrome, so they keep
separate wrappers. Route groups give each its own layout without changing the URL:

```
src/app/
  layout.tsx                 root: shared providers only (theme init, motion,
                             design tokens — lifted from lab/layout.tsx), no nav
  (home)/            # v2 public chrome, base ''
    layout.tsx               v2 wrapper (frame.page), no v1 nav/footer, indexed
    page.tsx + _home/        from lab/bento-v2
    map/                     from lab/bento-v2/map
  (marketing)/       # v1 public chrome, base ''
    layout.tsx               from lab/bento/(site)/layout.tsx, nav/footer, indexed
    pair/ circle/ today/     from lab/bento/(site)
    pricing/ learn/          from lab/bento/(site)
    about/ contact/          from lab/bento/(site)
    terms/ privacy/ refund/  from lab/bento/(site)
    login/                   from lab/bento/(site)
  app/               # signed-in tree, base '', app layout keeps noindex
    layout.tsx + **          from lab/bento-v2/app
  api/ auth/ fonts/ icons/ offline/   kept as-is
  error.tsx global-error.tsx not-found.tsx
  manifest.ts robots.ts sitemap.ts globals.css
```

The root `layout.tsx` carries only what every tree shares (what `lab/layout.tsx`
provided: theme bootstrap, motion provider, token stylesheet); it adds no nav, so the
app and the two public wrappers each supply their own. The bodies in
`src/components/bento-lab/**` are untouched.

`lab/` is deleted after the move except `(experiments)`, which keeps its own base and
stays `noindex`. `wireframes` under bento is an internal index; it moves to
`(experiments)` or is dropped.

## The code change

One edit to `src/lib/site/routes.ts`: `SITE_BASE` and `V2_BASE` become `''`. Because
`siteHref`, `resolveSiteHref` and the per-tree `createSiteHref` all read the bases,
every internal link follows. `TREES` keeps both entries so `resolveSiteHref` still
sends an unserved path to v1; with both bases `''` that is now the same root, which is
correct. `indexed` already keys off `auth`/`group`, so promotion needs no per-row
edit; `sitemap.ts` and `robots.ts` read the table and stop excluding the tree.

Tests to add or change: `routes.test.ts` asserts the promoted bases and that every
`SITE_ROUTES` row resolves to a route present in the Next build manifest (not the
tautology that the table covers itself — with base `''` a missing page no longer shows
as a `/lab` link). `v2-routes.test.ts` and `v2-sketch.test.ts` fixtures that hardcode
`/lab/bento-v2` move to root paths. The workerd preview adds signed-out deep links into
`/app/**` and the login return afterwards.

## Redirects — a single map, seeded from `live`

The `live` column is the seed, not the whole map: most rows map to themselves
(identities, which produce no redirect) and `/compatibility` is the `live` of both
`/pair` and `/circle`, so it is ambiguous. One redirect map in `next.config.mjs` is the
source of truth; it is seeded from `live` for the unambiguous changed rows and
completed by hand for the rest. A test asserts every non-identity `live`, every deleted
`/lab` path, and every retired `/app` route has exactly one destination in the map
before any old file is deleted.

Public path changes:

| Old | New | Note |
| --- | --- | --- |
| `/calculate` | `/map` | from `live` |
| `/compatibility` | `/pair` | ambiguous in `live`; chosen |
| `/onboarding` | `/map` | not in table |
| `/today` (old) | `/today` | same path, new page — no redirect |

Retired signed-in routes (authed, `noindex`, so only bookmarks are affected) are listed
explicitly in the map — they are absent from the route table, so `live` cannot generate
them (see Open questions). Auth pages and content written against live paths already
resolve through `siteHrefForLive`.

Redirects ship **temporary** (Next `permanent: false` → 307) through the rollback bake
window. A permanent redirect is a 308 the browser caches: were it to cache
`/calculate → /map` and the deploy then roll back, the prior Worker has no root `/map`
to answer. After the new tree is stable they are promoted to permanent.

## Deploy gate

Promotion ships with the Next 16.4.6 bump; they are one change. 16.2.9 keeps a stale
render after an edit (vercel/next.js#86055), which the v2 app's optimistic edits hit.
The fix is verified under `next start` but not yet on workerd. Before pleiad.io:

1. `npm run build` green; `npm run typecheck` green (two pre-existing lint errors in
   `src/app/error.tsx` and one test are tracked separately, not introduced here).
2. `npm run preview` (OpenNext Cloudflare build + local workerd). On the preview:
   repeated edits to a person, prefetched navigation between app pages, back/forward
   all show fresh renders; and, signed out, a deep link into `/app/**` reaches login and
   returns to the deep link after sign-in.
3. Only then `npm run deploy`. `deploy` rebuilds with the production URL vars
   (`NEXT_PUBLIC_SITE_URL`, `APP_BASE_URL`) that `preview` does not set, so the preview
   is run once more with those vars exported, or the tested artifact is uploaded rather
   than rebuilt, so what ships is what was proven.

Stay on OpenNext 1.19.11 and Wrangler 4.100: OpenNext 1.20.x needs Wrangler ^4.148.
`package-lock.json` is the CI lockfile; `pnpm-lock.yaml` is stale and is regenerated or
removed in this change so the two do not disagree on Next's version.

## Indexing

`noindex` lives in the tree layouts, not only in `robots.ts`, so moving a file keeps the
page out of the index on its own. At promotion the `(home)` and `(marketing)` layouts
drop their `noindex` metadata and set a per-page canonical at the root URL; the `app`
layout and `(experiments)` keep `noindex`. `robots.ts` stops disallowing the promoted
paths and `sitemap.ts` lists every `indexed` row. The two moves — layout metadata and
robots/sitemap — must land together, or the pages are either indexed without a sitemap
or listed while still `noindex`.

## Rollback

The move is one or two commits on top of a known-good state (the committed v2 work).
Revert restores `/lab/bento-v2` and the old root. At the edge, redeploying the prior
Worker version is immediate; the custom domains (`pleiad.io`, `www.pleiad.io`) are
unchanged, so rollback is a redeploy, not a DNS change.

## Sequencing

1. Commit the finished v2 working tree as semantic commits (cleanup), so promotion is
   a reviewable diff on a known state.
2. Move files into the two root groups; delete the old root pages and `/lab` (except
   experiments).
3. Set the bases to `''`; wire the `live`-driven redirects; update tests, sitemap,
   robots.
4. `build` + `typecheck` + `preview` with the workerd checks above.
5. `deploy` to pleiad.io.

Then, in parallel: pentest the deployed app, and bring the mobile app to the v2
design.

## Open questions

- **Retired signed-in routes.** `boards`, `calendars`, `cards`, `graph`,
  `predictions`, `profile`, `relationships` exist under the old `/app` with no v2
  page. Proposed: `calendars → /app/calendar`, `profile → /app/settings`,
  `relationships → /app/groups`, `graph → /app/groups`, and `boards`, `cards`,
  `predictions → /app`. Confirm, since these are product calls, not routing ones.
- **`/onboarding`, `/share`, `/shared`, `/newsletter`, `/unsubscribe`.** Not in the v2
  table. Proposed: `onboarding → /map`; keep `newsletter`, `unsubscribe`, `share`,
  `shared` as standalone flows outside the tree. Confirm.
- **`wireframes`.** Internal design index. Move to `(experiments)` or drop.

## Second opinions

| Reviewer | Scope | Date | Status |
| --- | --- | --- | --- |
| omnis-a3 | Owns the v2 tree; promotion shape, traps, version constraints | 2026-11-10 | Incorporated |
| codex (gpt-6-astra) | Promotion shape and cutover risk | 2026-11-10 | Incorporated |
