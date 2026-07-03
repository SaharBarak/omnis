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

## Execution order

1. **P1 sweep** (hero split, triads→divide-y, circles asym, 100dvh, active
   states, AmbientVideo, OG image, stray file) — one commit.
2. **P2 sweep** (magnetic CTAs, node-tap card, marquee, star parallax,
   dreamspell accent, aspect warnings, ping-pong) — one commit.
3. **P3 backlog** — with the /learn + dashboard phases.
