/**
 * Landing design tokens — the single source for colors and the type ramp
 * used by src/components/landing-v2 (docs/redesign/TASTE_AUDIT.md §F).
 *
 * Tailwind mirrors COLORS as `ground / surface / surface-2 / brand /
 * brand-soft / brand-bright`; use the classes in markup and these
 * constants wherever a literal value is required (SVG fills, gradients,
 * inline styles).
 *
 * The ground stays #0B0D16 — every mural asset is painted to fade into
 * it. The chrome accent is a desaturated Railway-family violet; per-system
 * folklore accents live in system-flavors.ts and are unaffected.
 */

export const COLORS = Object.freeze({
  ground: '#0B0D16',
  surface: '#0D101A',
  surface2: '#12151F',
  brand: '#7D5BC9',
  brandSoft: '#A78FDF',
  brandBright: '#EFEAFA',
})

/**
 * The type ramp. Five steps, used verbatim — no ad-hoc heading classes.
 * Display face is Space Grotesk (technical, trustworthy); weight carries
 * the hierarchy, not size alone. Text emphasis uses exactly four steps:
 * white/90 · /70 · /50 · /35.
 */
export const TYPE = Object.freeze({
  /** H1 — hero only. */
  hero: 'font-display font-semibold text-4xl leading-none tracking-tighter text-white md:text-6xl',
  /** Zone H2 — left-aligned capability zones. */
  zone: 'font-display font-semibold text-4xl leading-[1.08] tracking-tight text-white md:text-5xl',
  /** Centered section H2 — social proof, board, pricing, FAQ, portal. */
  section: 'font-display font-semibold text-3xl leading-tight tracking-tight text-white md:text-4xl',
  /** Card / logo display — nav wordmark, card titles. */
  card: 'font-display font-medium text-2xl text-white',
  /** Mono eyebrow — uppercase micro-label. */
  eyebrow: 'font-mono text-[11px] uppercase tracking-[0.2em]',
})
