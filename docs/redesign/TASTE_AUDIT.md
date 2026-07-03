# Homepage Taste Audit — vs taste-skill (variance 8 · motion 6 · density 4) + all redesign MDs

Audit of the shipped landing-v2 against the high-agency frontend skill and
HOMEPAGE_SPEC / MOTION_SPEC / ASSET_MAP / USER_FLOWS. Verified in code.

## A. Skill violations (fix)

| # | Finding | Where | Fix | Priority |
|---|---|---|---|---|
| A1 | **Centered hero** — banned at variance 8 ("anti-center bias"). Everything centered: eyebrow, H1, sub, CTAs, graph below. | `hero-v2.tsx` | Split hero: text block left (H1 4xl→6xl, left-aligned), live graph right, `lg:grid-cols-[3fr_2fr]`; graph becomes above-the-fold co-star instead of below-fold. Mobile: single column. | P1 |
| A2 | **3-equal-card rows** — banned pattern, used 4×: zone triads, CirclesDemo, PricingV2, SocialProofV2. | `zone.tsx`, `zone-embeds.tsx`, `sections.tsx` | Triads → single `divide-y` rows (density-4 logic-grouping, no boxes). Circles → asymmetric `2fr_1fr_1fr` with the Family card dominant. Testimonials → offset grid (middle card `md:-mt-6`). Pricing stays 3-up (category convention) but middle card scales `md:scale-105`. | P1 |
| A3 | `min-h-screen` in pinned layers section — skill mandates `100dvh`. | `zone-layers.tsx:99` | `min-h-[100dvh]`. | P1 |
| A4 | **No tactile feedback** — zero `active:` states on CTAs. | all buttons | `active:scale-[0.98]` on every CTA/pill/lens chip. | P1 |
| A5 | **No magnetic micro-physics** (mandated at motion>5) | hero + portal CTAs | Magnetic pull via `useMotionValue`/`useTransform` (never useState), isolated client leaf `MagneticButton`. | P2 |
| A6 | Dreamspell accent `#B387E8` — grazes the LILA ban. | `system-flavors.ts` | Desaturate toward seal-red-violet `#A87BD1` → verify against mural. | P2 |
| A7 | Hero H1 `text-7xl` — oversized-H1 tell. | `hero-v2.tsx` | With A1 split layout drop to `text-4xl md:text-6xl tracking-tighter`. | P1 (rides A1) |
| A8 | Next/Image aspect warnings (bodygraph, aleph SVGs width≠height). | `zone-embeds.tsx`, `sections.tsx` | Add `h-auto w-auto` + fixed box wrappers. | P2 |
| A9 | Icons: lucide-react (skill prefers phosphor/radix). | project-wide | Keep lucide — existing project standard; deviation noted, uniform strokeWidth 2. | won't-fix |

## B. MOTION_SPEC contract not fully implemented

| # | Promised | Status | Fix | Priority |
|---|---|---|---|---|
| B1 | Videos pause offscreen via IntersectionObserver | missing | shared `AmbientVideo` client component: IO pause/play + `prefers-reduced-motion` + Save-Data → still. | P1 |
| B2 | Ping-pong playback (gen loops don't seam) | missing — plain `loop` | `AmbientVideo`: onended reverse or rate flip; fallback plain loop. | P2 |
| B3 | Global star-parallax layers (2–3 depths) | missing | Two fixed pointer-events-none star layers on scroll transforms. Cheap, big depth win. | P2 |
| B4 | Traveler spark trail | simplified to glow dot | tiny trailing motion-span opacity queue. | P3 |
| B5 | V3 map-nebula ambient loop behind map embed | not generated (P2 in ASSET_MAP) | Kling from ZONE-DSPELL still; ship static first. | P3 |

## C. HOMEPAGE_SPEC gaps

| # | Spec | Status | Priority |
|---|---|---|---|
| C1 | Hero graph: tap node → compact five-system person card | edge hover ✓, node tap missing | P2 |
| C2 | §11 social proof: horizontal quote marquee under cards | missing | P2 |
| C3 | §12 today board GATE value (needs sun-longitude→gate table) | dropped | P3 |
| C4 | §16 footer featured-announcement cards | missing | P3 |
| C5 | §10 knowledge search wired to real vector search (demo types, doesn't query) | demo only | P2 (needs public search endpoint — also USER_FLOWS gap #2) |
| C6 | §5 library quick actions Compare/Invite | partial (2 of 4) | P3 |

## D. ASSET_MAP / USER_FLOWS still open (not homepage blockers)

- OG-MAIN + per-system OG images (metadata references /og-image.png → 404 risk on share cards) — **P1 for launch**, composite from HERO-SKY crop.
- /learn doc heroes ×5 + integration banner (C2 batch) — P2.
- Onboarding ritual backdrops ×4 (C4) — P3.
- DASH-GROUND + empty states ×3 (C5) — P3.
- /app/cards TEST_PEOPLE demo data — P3.
- Stray `dreamspell-page.png` repo root — delete (P1, one command).

## E. Passing (no action)

Anti-emoji ✓ · no pure black (#0B0D16) ✓ · serif allowed (editorial context) ✓ ·
demo names organic (Maya/Noam/Ari…) ✓ · scores messy (78/91/64/57) ✓ · no
slop copy ✓ · transform/opacity-only animation ✓ · staggered orchestration ✓ ·
perpetual micro-interactions (flap board, cycler, SMIL pulse, glow) ✓ ·
deps verified in package.json ✓ · grid-not-flex-math ✓ · content max-width ✓.

## F. Typography & design-system persistence audit (verified by grep)

### F1. Type-scale drift — two competing H2 scales, no tracking rules
| Usage | Found | Files |
|---|---|---|
| Zone H2 | `text-4xl md:text-6xl leading-[1.08]` | zone.tsx, zone-layers.tsx |
| Centered section H2 | `text-4xl md:text-5xl` (no leading) | sections.tsx ×2, portal-cta.tsx |
| FAQ H2 | bare `text-4xl` (no md step, no leading) | sections.tsx |
| Board H2 | `text-4xl md:text-6xl` (no leading) | today-board.tsx |
| Sub-display | `text-2xl` ×2, `text-xl` ×2, `text-sm`, `text-base` italic ×2 — ad-hoc | embeds, nav, sections |

No `tracking-*` anywhere on display type (skill default: `tracking-tighter`).
**Fix: one type ramp, used everywhere** —
`display-hero` (H1) · `display-zone` (zone H2: 4xl/6xl, leading-[1.08],
tracking-tight) · `display-section` (centered H2: 4xl/5xl, leading-tight,
tracking-tight) · `display-card` (2xl) · `eyebrow` (mono 11px,
tracking-[0.2em] uppercase). FAQ + board + portal collapse into
`display-section`.

### F2. Color-token bypass — 90 hardcoded hexes in 10 files
- `#C9A227` gold written **32 times**; `#E7D08A` 7×; `#FFF6D9` 2×.
- **Four divergent card-surface colors**: `#0d101a` (12×), `#12151f` (5×),
  `#141828`, `#101423` — incoherent elevation story.
- Ground `#0B0D16` inline 6× despite `MURAL_GROUND` constant existing.
- The project's HSL token system (globals.css + tailwind) is unused by
  landing-v2; system-flavors.ts is the only tokenized path.

**Fix: extend tailwind theme + one constants module** —
`ground #0B0D16 · surface #0D101A · surface-2 #12151F · gold #C9A227 ·
gold-soft #E7D08A · gold-bright #FFF6D9` as tailwind colors
(`bg-ground`, `bg-surface`, `text-gold`…); kill `#141828`/`#101423`
(merge into surface-2); seal-family colors already live in tailwind
(`seal.*`) — demo-graph should import, not restate.

### F3. Text-emphasis ramp — 14 distinct white-opacity steps
`text-white/25…/90` in 14 flavors. Collapse to 4 semantic steps:
`text-hi` (white/90) · `text-mid` (white/70) · `text-low` (white/50) ·
`text-faint` (white/35). Map: 75,80,85→hi · 60,65→mid · 40,45,55→low ·
25,30,35→faint (per-case eyeball on borderline 55/60).

### F4. Header (nav) coherence
Nav logo `font-display text-xl`, footer logo `text-2xl` — unify (both
`display-card`/2xl or shared Logo component). Nav links `text-sm
text-white/70` fine, but pill CTA duplicates hero CTA styles inline —
extract shared `GoldButton` (also carries A4 active-state + A5 magnetic).

**Priority: F1–F4 fold into the P1 sweep** — they're one refactor commit
(tokens + ramp module + mechanical swap), best done BEFORE the layout
fixes so A1/A2 build on clean tokens.

## Execution order

1. **P1 sweep** (hero split, triads→divide-y, circles asym, 100dvh, active
   states, AmbientVideo, OG image, stray file) — one commit.
2. **P2 sweep** (magnetic CTAs, node-tap card, marquee, star parallax,
   dreamspell accent, aspect warnings, ping-pong) — one commit.
3. **P3 backlog** — with the /learn + dashboard phases.
