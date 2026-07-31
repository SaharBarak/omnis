/**
 * Global search index (#77) — the app's own page list plus the shared
 * reference corpus (`@pleiad/engine/services/search-reference`, indexed
 * identically on mobile). cmdk does the fuzzy matching; this module only
 * decides what exists and where it leads.
 */

import type { SearchEntry } from '@pleiad/engine/services/search-reference'

export {
  getReferenceEntries,
  type SearchEntry,
  type SearchGroup,
} from '@pleiad/engine/services/search-reference'

export const PAGE_ENTRIES: readonly SearchEntry[] = [
  { id: 'page-home', title: 'Home', href: '/app', group: 'Pages', keywords: 'dashboard overview today board' },
  { id: 'page-calendar', title: 'Dreamspell Calendar', href: '/app/calendar', group: 'Pages', keywords: 'kin month 13 moons wavespell dreamspell' },
  { id: 'page-cal-hebrew', title: 'Hebrew Calendar', href: '/app/calendars/hebrew', group: 'Pages', keywords: 'jewish lunisolar molad holidays' },
  { id: 'page-cal-hijri', title: 'Hijri Calendar', href: '/app/calendars/hijri', group: 'Pages', keywords: 'islamic lunar ramadan eid umm al-qura' },
  { id: 'page-cal-persian', title: 'Persian Calendar', href: '/app/calendars/persian', group: 'Pages', keywords: 'solar hijri iranian nowruz equinox' },
  { id: 'page-cal-chinese', title: 'Chinese Calendar', href: '/app/calendars/chinese', group: 'Pages', keywords: 'lunisolar zodiac stems branches new year' },
  { id: 'page-cal-panchang', title: 'Panchang', href: '/app/calendars/panchang', group: 'Pages', keywords: 'hindu vedic tithi nakshatra muhurta' },
  { id: 'page-cal-longcount', title: 'Maya Long Count', href: '/app/calendars/long-count', group: 'Pages', keywords: 'baktun katun tzolkin haab correlation' },
  { id: 'page-people', title: 'People', href: '/app/people', group: 'Pages', keywords: 'profiles persons contacts' },
  { id: 'page-relationships', title: 'Relationships', href: '/app/relationships', group: 'Pages', keywords: 'connections bonds couple' },
  { id: 'page-groups', title: 'Groups', href: '/app/groups', group: 'Pages', keywords: 'families teams circles' },
  { id: 'page-graph', title: 'Relationship Map', href: '/app/graph', group: 'Pages', keywords: 'network graph visualization' },
  { id: 'page-boards', title: 'Boards', href: '/app/boards', group: 'Pages', keywords: 'canvas visual notes' },
  { id: 'page-cards', title: 'Cards', href: '/app/cards', group: 'Pages', keywords: 'print export pdf' },
  { id: 'page-predictions', title: 'Predictions', href: '/app/predictions', group: 'Pages', keywords: 'forecast daily weekly' },
  { id: 'page-moon', title: 'Moon Map', href: '/app/moon', group: 'Pages', keywords: 'lunar phases lunation' },
  { id: 'page-numerology', title: 'Numerology', href: '/app/numerology', group: 'Pages', keywords: 'life path destiny soul urge pinnacles pythagorean' },
  { id: 'page-bazi', title: 'BaZi — Four Pillars', href: '/app/bazi', group: 'Pages', keywords: 'chinese metaphysics stems branches day master luck' },
  { id: 'page-oracles', title: 'Oracles', href: '/app/oracles', group: 'Pages', keywords: 'tarot i ching runes daily draw' },
  { id: 'page-gene-keys', title: 'Gene Keys', href: '/app/gene-keys', group: 'Pages', keywords: 'golden path shadow gift siddhi hologenetic' },
  { id: 'page-tree', title: 'Tree of Life', href: '/app/tree-of-life', group: 'Pages', keywords: 'kabbalah sefirot paths pillars' },
  { id: 'page-library', title: 'Learning Library', href: '/app/library', group: 'Pages', keywords: 'articles questions education learn' },
  { id: 'page-profile', title: 'Profile', href: '/app/profile', group: 'Pages', keywords: 'account settings personal birth' },
  { id: 'page-settings', title: 'Settings', href: '/app/settings', group: 'Pages', keywords: 'preferences systems' },
  { id: 'learn-dreamspell', title: 'Learn: Dreamspell', href: '/learn/dreamspell', group: 'Pages', keywords: 'kin seals tones wavespell oracle' },
  { id: 'learn-tzolkin', title: 'Learn: Tzolkin', href: '/learn/tzolkin', group: 'Pages', keywords: 'maya 260 sacred count' },
  { id: 'learn-astrology', title: 'Learn: Astrology', href: '/learn/astrology', group: 'Pages', keywords: 'zodiac natal chart planets houses' },
  { id: 'learn-hd', title: 'Learn: Human Design', href: '/learn/human-design', group: 'Pages', keywords: 'bodygraph gates channels type authority' },
  { id: 'learn-gematria', title: 'Learn: Gematria', href: '/learn/gematria', group: 'Pages', keywords: 'kabbalah hebrew letters values' },
  { id: 'learn-integration', title: 'Learn: Integration', href: '/learn/integration', group: 'Pages', keywords: 'systems together synthesis' },
]

export function peopleEntries(
  people: readonly { id: string; name: string; birth_date: string }[]
): SearchEntry[] {
  return people.map((p) => ({
    id: `person-${p.id}`,
    title: p.name,
    subtitle: p.birth_date,
    href: `/app/people/${p.id}`,
    group: 'People' as const,
    keywords: 'person profile',
  }))
}
