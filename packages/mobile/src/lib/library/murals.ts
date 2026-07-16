import type { LibrarySystemKey } from './content'

/**
 * The zone murals, keyed by library doc.
 *
 * Only four of the six traditions were ever painted. `tzolkin` and
 * `integration` have no mural and are not expected to grow one, so this map is
 * deliberately partial: a caller takes `undefined` as "there is no art here,
 * dress the surface in the tradition's flavour instead", never as an error.
 *
 * The `require` calls are static on purpose — Metro resolves them at bundle
 * time, which is what keeps the codex readable with no network.
 */
const MURALS: Partial<Record<LibrarySystemKey, number>> = {
  dreamspell: require('../../../assets/mural/zone-dreamspell.webp') as number,
  astrology: require('../../../assets/mural/zone-astrology.webp') as number,
  'human-design': require('../../../assets/mural/zone-human-design.webp') as number,
  gematria: require('../../../assets/mural/zone-gematria.webp') as number,
}

/** The mural for a tradition, or `undefined` where none was ever painted. */
export function muralFor(key: LibrarySystemKey): number | undefined {
  return MURALS[key]
}
