/**
 * Landing design tokens — the single source for colors and the type ramp
 * used by src/components/landing-v2 (docs/redesign/TASTE_AUDIT.md §F).
 *
 * Tailwind mirrors COLORS as `ground / surface / surface-2 / gold /
 * gold-soft / gold-bright`; use the classes in markup and these constants
 * wherever a literal value is required (SVG fills, gradients, inline
 * styles).
 */

export const COLORS = Object.freeze({
  ground: '#0B0D16',
  surface: '#0D101A',
  surface2: '#12151F',
  gold: '#C9A227',
  goldSoft: '#E7D08A',
  goldBright: '#FFF6D9',
})

/**
 * The type ramp. Five steps, used verbatim — no ad-hoc heading classes.
 * Text emphasis uses exactly four steps: white/90 · /70 · /50 · /35.
 */
export const TYPE = Object.freeze({
  /** H1 — hero only. */
  hero: 'font-display text-4xl leading-none tracking-tighter text-white md:text-6xl',
  /** Zone H2 — left-aligned capability zones. */
  zone: 'font-display text-4xl leading-[1.08] tracking-tight text-white md:text-6xl',
  /** Centered section H2 — social proof, board, pricing, FAQ, portal. */
  section: 'font-display text-4xl leading-tight tracking-tight text-white md:text-5xl',
  /** Card / logo display — nav wordmark, card titles. */
  card: 'font-display text-2xl text-white',
  /** Mono eyebrow — uppercase micro-label. */
  eyebrow: 'font-mono text-[11px] uppercase tracking-[0.2em]',
})
