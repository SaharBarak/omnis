# App Design Contract — authed app (`src/app/app/*`)

The authed app speaks the **landing-v2 language** (the website's dark
cosmic system), executed through the **mobile component grammar**
(packages/mobile — the most mature implementation of this product's UX).
This document is the authority for any work under `src/app/app` and
`src/components/app-kit`.

## 1. Tokens (already wired — do not restate)

- `src/app/app/dashboard.css` maps shadcn vars to the v2 palette while
  `.dash-theme` is on `<html>`: ground `#0B0D16`, surfaces
  `#0D101A`/`#12151F`, brand violet `#7D5BC9` (`--primary`), soft
  `#A78FDF` (`--accent`), bright `#EFEAFA`.
- Tailwind literals also available: `bg-ground`, `bg-surface`,
  `bg-surface-2`, `bg-brand`, `text-brand-soft`, `text-brand-bright`.
- **Text emphasis is exactly four steps**: `text-white/90` (primary) ·
  `/70` (body) · `/50` (muted) · `/35` (faint). No ad-hoc grays.
- Borders are hairlines: `border-white/[0.07]`, hover `/[0.12]`.
- Per-system folklore accents from `src/lib/design/system-flavors.ts`
  via `getFlavor()` in the kit: astrology `#C9A227` gold, dreamspell
  `#A87BD1` violet, tzolkin `#2E6E5E` jade, humanDesign `#7FD4C1` teal,
  gematria `#D4AF37` gold, integration gold.
- Dreamspell seal colors ONLY through `app-kit/seal-colors.ts`
  (`SEAL_COLORS`, `toSealColor`) → `--seal-*` tokens. Raw palette
  (`bg-red-500`, `#EF4444`) is banned.
- Type: display = **Space Grotesk** (`font-display`, weight carries
  hierarchy, NO italics), body = Barlow (`font-sans`), numerals/labels =
  IBM Plex Mono (`font-mono`, tabular-nums for numbers). Import `TYPE`
  from `src/lib/design/landing-tokens.ts` for hero/section headings.

## 2. The kit (`src/components/app-kit`) — use it, don't reinvent

```tsx
import {
  PageSection, DataRow, StatWord, MeterBar, AddDataChip, LockedPage,
  FlavorTabs, FlapBoard, FlapValue, Notice,
  Eyebrow, Pill, Hairline, StatNumber,
  SkeletonRow, SkeletonRows, SkeletonCard,
  getFlavor, useCountUp, EASE_OUT, SPRING, fadeUp, staggerParent, VIEWPORT_ONCE,
} from '@/components/app-kit'
```

- `PageSection` — every content section: flavored hairline + accent
  eyebrow + staggered fade-up (pass `index`).
- `DataRow` — every key/value listing. **Lists are hairline-divided
  rows, never nested card boxes.**
- `MeterBar` — scores/balances: accent fill (scaleX) + count-up numeral.
- `StatWord` / `StatNumber` — word stats and big tabular-mono numbers.
- `FlavorTabs` — the six-system segmented control (layoutId pill,
  accent hairline crossfade).
- `FlapBoard` — split-flap set piece (dashboard "Today" board only).
- `Notice` — the ONE warning/info/error/success banner. The amber
  copy-paste pattern is dead.
- `LockedPage` — entitlement gate: dimmed real preview + flavor lock
  panel. Treat subscription-loading as locked (never flash open).
- `AddDataChip` — honest partial states: missing birth time / Hebrew
  name renders a calm explanation + chip deep-linking to the edit form.
  **Never render zeros or fabricated readings.**
- `SkeletonRow(s)/Card` — loading = layout-matched skeletons.
  **Spinners for content loading are banned.**

## 3. Motion rules

- framer-motion only; easing `EASE_OUT` `[0.4,0,0.2,1]`; spring
  `SPRING` `{stiffness:100, damping:20}`. **Nothing bounces.**
- Entrances: `initial={{opacity:0, y:16}} whileInView viewport={VIEWPORT_ONCE}`,
  stagger 60–80ms (`staggerParent`/`PageSection index`).
- Animate ONLY `transform` and `opacity`. Interactive elements get
  `active:scale-[0.98]`.
- Everything checks `useReducedMotion()` (kit components already do).
- Page containers keep the CSS `page-enter` class (already in shell).

## 4. Layout & chrome grammar

- Cards: `surface-card` / `interactive-card` / `feature-card` classes
  (dashboard.css rounds them + refraction border). Never stock shadcn
  `<Card>` visual defaults on app pages.
- Primary CTA: `rounded-xl bg-brand text-white hover:bg-brand-soft
  active:scale-[0.98]`. Small pills stay `rounded-full`.
- Pill badges: kit `Pill` with flavor accent (border `55`, bg `14` alpha).
- Section headers: `Eyebrow` mono micro-caps above a `font-display`
  title. No `text-earth-gradient`/gradient text in the app.
- No 3-equal-card feature rows. No emoji. Icons: lucide-react,
  consistent stroke. Text glyphs as buttons (`-`, `+`, `×`, `⟳`) banned —
  use lucide icons.
- Empty states: `src/components/dashboard/empty-state.tsx` (good as-is).

## 5. Forbidden (grep before you finish)

- Raw palette classes (`bg-red-500`, `text-gray-*`, `bg-green-500/10`,
  `border-amber-200`…) and hex literals in JSX. Exceptions: domain SVG
  diagrams (bodygraph, natal wheel) keep their internal palettes.
- `window.confirm` — use `useConfirm()` from
  `src/components/dashboard/confirm-dialog`.
- Native unstyled `<select>`/`<input>` — use shadcn `Select`/`Input`.
- `h-screen` (use `min-h-[100dvh]` if needed), `font-heading` additions
  (dash-theme remaps it; write `font-display` in app code).
- New CSS files per page. Extend the kit instead.

## 6. Reference implementations

- Mobile scaffold: `packages/mobile/src/components/person/scaffold.tsx`
- Mobile person detail: `packages/mobile/src/app/person/[id].tsx`
- Mobile pair/compat: `packages/mobile/src/app/pair/[id1]/[id2].tsx`
- Mobile today board: `packages/mobile/src/components/today/board.tsx`
- Landing grammar: `src/components/landing-v2/zone.tsx`, `hero-v2.tsx`,
  `sections.tsx`
- Engine "today" data: `src/lib/today-board.ts`
