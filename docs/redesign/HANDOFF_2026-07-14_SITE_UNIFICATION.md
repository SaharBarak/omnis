# Handoff — 2026-07-14 (evening) — Site unification: one design system, three critique rounds (2 completed)

Web session. Continues from `HANDOFF_2026-07-14_CONNECTIONS.md`. Everything below is
**UNCOMMITTED** on `redesign/knowledge-experience` (the tree also carries the previous
sessions' uncommitted work — do not bulk-revert; `packages/mobile/*` belongs to the
parallel session).

## TL;DR

The marketing site was two products wearing one domain: 4 pages on the dark v2 redesign,
11 pages still on the abandoned cream/teal system, and every funnel click crossed the seam.
This session: homepage cut 16→9 sections and put on one type ramp; the hero graph and the
Human Design bodygraph were both structurally broken and got rebuilt from reviewer
diagnoses; then a cron-driven critique loop (designer agent + engineer agent per round,
screenshots + code) ran **2 of the 3 requested rounds** — porting all 11 legacy pages to
dark v2, deleting the old design system, and fixing a stack of real bugs the reviewers
found. Round 3 never ran (session handed off mid-close of round 2).

## Verification state at handoff

- `pnpm typecheck` ✓ (last run: after legacy-component deletion)
- Full `pnpm test`: **1132/1132 ✓ but last complete run predates the learn-content agent
  batch and the `src/components/{landing,docs}` deletion.** Typecheck is clean since, but
  RE-RUN THE FULL SUITE FIRST.
- Round-2 closing screenshot sweep NOT taken; `scratchpad/rounds.txt` (session temp) said "2".
- Dev server was running on :3000 (session-local, will be gone).
- The `/loop` cron job was deleted at handoff — nothing keeps firing.

## What changed (by area)

### Homepage (`src/app/page.tsx` + `src/components/landing-v2/`)
- 16 sections → 9. Cut: SigilBand, PairScores zone, LibraryDemo zone, MapCenterpiece zone
  (duplicate of hero star), ZoneLayers (320vh scroll-hijack), ShareDemo zone, KnowledgeSearch
  zone (component lives on — /learn uses it), SocialProofV2 (testimonials were invented —
  user confirmed), TodayBoard, ThreadOfLight. Files deleted: `zone-layers.tsx`,
  `today-board.tsx`, `thread.tsx`. Dead demo builders removed from `homepage-demo.ts`.
- One funnel: every acquisition CTA → `/calculate` (atlas, callouts, circles, pricing Free,
  portal). Paid CTAs → `/login`. Removed /onboarding + /app/graph dead ends.
- Type canon (`src/lib/design/landing-tokens.ts`): `TYPE.zone` deleted (all h2 = `TYPE.section`),
  `TYPE.h3` added (kills the globals.css Rubik base-rule leak), `TYPE.eyebrow` is the single
  micro-label recipe. Explicit `font-medium` wherever the display face was accidentally 400.
- PLANS on the homepage now derive from `src/components/pricing/plan-data.ts` (they used to
  contradict the FAQ below them); Explorer/Lifetime teaser line links to /pricing.

### Hero graph (`ego-star.tsx`) — full rewrite of the render layer
Root causes (from designer+engineer agent review of a broken mobile screenshot):
1. framer-motion's inline transform silently discarded the `-translate-x-1/2` centering
   classes → every node was pinned by its top-left corner. Fix: plain wrapper div owns
   position+centering; motion.button animates only scale/opacity.
2. `pathLength` animation owns `stroke-dasharray` → arms shredded into floating dashes,
   endpoint dots, and Dana's designed dashes destroyed. Fix: opacity fade only; px dashes.
3. Stretched 100×100 viewBox vs pixel-sized HTML nodes → lines couldn't respect node radii.
   Fix: ResizeObserver measures the canvas; lines/pills/nodes share one pixel geometry; arms
   trim to ring edges (`rCenter/rSpoke + 5px`).
Mobile: square aspect, smaller nodes with `md:` full sizes, pills/kin lines hidden < md.

### Bodygraph (`bodygraph-layout.ts` + `BodygraphChart.tsx`) — rigid template rewrite
Also driven by two-agent review. Geometry re-authored in FINAL coordinates (an earlier
axis-stretch scaled positions but not center sizes — every channel mouth floated off its
center's edge). Now: `GATE_MOUTHS` — one fixed slot per gate ON its center's edge; straight
gate-to-gate channels in three vertical lanes; mirrored spleen/solar; integration channels
fan from shared gate nodes; exactly two bowed channels (34-20, 26-44) via centripetal
Catmull-Rom. Renderer: butt caps (kills midpoint blobs), legible base lanes, r=6 chips that
REPLACE gate numbers in place, tinted center surfaces (no glow filters, no paint-bucket
fills), HTML legend, tooltip clamp fix. Composite/Penta charts inherit the geometry.

### Round 1 (ports — done by 3 parallel agents + core fixes)
- **All 11 legacy pages ported to dark v2**: calculate, compatibility, today, about, contact
  + 6 learn subpages (new shared shell `src/app/learn/_components/doc-shell.tsx` — DocShell/
  GuideStrip/DocSection/DocProse/DocCta/GlyphChip…; DocHero moved in beside it).
- NavV2: mobile hamburger menu added (site had NO mobile nav) + scroll lock + Escape.
- `html, body { overflow-x: clip }` (globals.css) — mobile home had real 171px overflow
  (ReadingCycler tab strip; also fixed directly: scrollable strip).
- Pricing: dead disabled store CTA → routes to /login with honest caption; eyebrow drift
  unified; SSR-invisible money content fixed (`initial: false` on pricing + homepage tiers).

### Round 2 (bug fixes from second agent pass)
- **Contact form actually sends now**: new `src/app/api/contact/route.ts` (Resend, rate-limited
  3/hr, zod). Was a fake setTimeout success. **Needs env: `RESEND_API_KEY`, `CONTACT_EMAIL`**
  (falls back to hello@pleiad.io; returns 503 with honest copy if unset).
- Birth-date off-by-one west of UTC on /calculate (`new Date('YYYY-MM-DD')` is UTC) — fixed.
- liveLine hydration mismatches on the three client pages (tz/ICU-dependent) — computed
  post-mount via useEffect.
- Primary buttons no longer gated-disabled (read as broken); click-validation with inline
  errors instead. Compat ⏳ emoji spinner → SVG.
- Compatibility: copy de-contradicted (five systems, "Kabbalah" naming), 90-line dead rival
  scoring model stripped (`findOracleConnections` keeps only the named ties; score/summary
  come from the fusion engine).
- About: systems list now all six, canonical names. Today: kin + headline date from one tz.
- Homepage placeholder tells: circle insights now three distinct computed tiers (was one
  sentence ×3); callout cards forced to distinct systems (was Dreamspell ×3);
  "Consolidate all five" → "all layers". Login got StarParallax + brand tagline.
- Learn content: `DocProse` renders content.ts bullet runs as real `<ul>` (was dash-soup),
  emoji UI icons → stroke SVGs, tables got min-widths so overflow-x actually scrolls,
  astrology symbols got U+FE0E.
- **Deleted**: `src/components/landing/` (whole old design system), `src/components/docs/`,
  `src/lib/landing-images.ts`. Zero importers remained (verified before delete).

### Other repos touched
- **folklore** (`~/personal/folklore`, uncommitted): hero olede + README lede reworded —
  the swarm's actors are PEOPLE/peers, never "agents". User has corrected this twice; memory
  saved (`folklore-voice-peers-not-agents`).

## Round 3 — NEVER RAN. Known remaining findings (from the round-2 reviews)

Highest value first:
1. `/calculate` under-delivers the funnel promise: every CTA sells "six complete readings",
   the page is a one-system kin calculator. Either show the six-system shell with Dreamspell
   unlocked, or change upstream CTA copy.
2. Pricing card grammar: three different plan-card shapes (Explorer band / two cards /
   Lifetime band) — unify anatomy; comparison table omits Lifetime; mobile table clips
   without affordance.
3. CTA label chaos site-wide (8+ variants, two casing systems). Define one pair
   ("Start with your birthday" / "Create a free account") and enforce sentence case.
4. Native date inputs (calculate, compatibility) — styled dark but still native.
5. Learn: no TOC on 17–28k px pages; prev/next ordering scrambled vs hub order; hub says
   "Six guides" with five filter chips; Kabbalah/Gematria naming split (canonical: Kabbalah,
   keep /gematria as URL); gematria content has bold-boundary spacing bugs IN
   `src/lib/docs/content.ts` ("Ein Sof(literally") — content file was out of scope for agents.
6. Hardcoded palette colors remain in learn pages (integration border hexes, astrology
   chips) + engine `getScoreColor` greens — map to flavor tokens.
7. Home: FAQ duplicated with /pricing; hero double CTA; eyebrow accent variance (kept
   deliberately — flavor coding — revisit); §2 spacing rhythm; bodygraph demo panel right
   column dies after 5 rows.
8. Today page "What does this mean?" is template filler — pull real seal/tone paragraphs
   from the knowledge base.
9. FooterV2 Knowledge column lists 5 links — add Integration (and decide Tzolkin/Long Count).
10. Newsletter capture existed only in the deleted legacy footer — port into FooterV2 if
    email collection matters.

## How to run the loop again

The pattern that worked: screenshot sweep (Playwright from scratchpad — scroll through each
page before fullPage capture or whileInView content reads as black voids) → two agents
(designer on images, engineer on images+code, both told to rank by damage and trace to
file:line) → apply fixes (parallel agents for disjoint page groups, core fixes inline) →
typecheck + tests + re-sweep. The screenshots artifact-trap: unscrolled fullPage captures
show `whileInView` content invisible; the "N" badge is the Next dev overlay; both burned a
chunk of round-1 designer effort before being identified as artifacts.

## Env / infra notes
- `.next` was wiped once mid-session — if the user's dev server 500s or throws phantom
  Tailwind ENOENTs after file deletions, `rm -rf .next` + restart (known Turbopack gotcha).
- Paddle keys still live in the user's account (from previous handoff — user's to revoke).
- Billing remains App Store/Play IAP via RevenueCat (no web checkout; do not re-research).
