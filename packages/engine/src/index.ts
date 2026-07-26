/**
 * @pleiad/engine — pure TypeScript computation engines.
 *
 * Framework-free: no React, no Next.js, no database. Shared by the web app
 * (via the `@pleiad/engine` / `@pleiad/engine/*` tsconfig path aliases) and,
 * in the future, a React Native app.
 *
 * Subpath imports (e.g. `@pleiad/engine/calculations/dreamspell`) are also
 * supported and preferred for tree-shaking; this barrel is the public API
 * surface for consumers that want a single entry point.
 */

// Core branded types
export * from './types/core'

// Calculation engines (dreamspell, tzolkin, long count, astrology,
// human design, gematria, moon, cycles, wavespell, yearly, julian, oracle)
export * from './calculations'

// Static system data
export * from './data/aspects'
export * from './data/castles'
export * from './data/hebrew-letters'
export * from './data/houses'
export * from './data/human-design-channels'
export * from './data/human-design-gates'
export * from './data/human-design'
export * from './data/mantras'
export * from './data/oracle-tables'
export * from './data/planets'
export * from './data/seals'
export * from './data/tones'
export * from './data/tzolkin-signs'
export * from './data/wavespells'
export * from './data/zodiac-signs'

// Domain types
export * from './types/astrology'
export * from './types/common'
export * from './types/dreamspell'
export * from './types/gematria'
export * from './types/human-design'
export * from './types/prediction'
export * from './types/relationship'
export * from './types/seal'
export * from './types/tone'
export * from './types/tzolkin'

// Pure domain services
export * from './services/compatibility'
export * from './services/synastry'
export * from './services/hd-compatibility'
export * from './services/predictions'
export * from './services/group-analysis'
export * from './services/astro-phenomena'

// Explicit re-exports for names that would otherwise be ambiguous
// (star exports silently drop names exported by more than one module).
export type { CastleColor } from './calculations/cycles'
export { analyzeGroup } from './services/group-analysis'
export { analyzeGroup as analyzeGroupGematria } from './calculations/gematria'
export * from './services/today'
