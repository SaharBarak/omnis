import {
  getReferenceEntries,
  type SearchEntry,
} from '@pleiad/engine/services/search-reference'

/**
 * Mobile search (#77) — the shared reference corpus plus this app's own
 * pages and the reader's people.
 *
 * `href` is a web path throughout, the same identity favorites use, so a
 * result knows what it points at regardless of which app opens it;
 * `mobileRouteFor()` decides where that lands here.
 *
 * Matching is a scored substring pass rather than a fuzzy library. At this
 * corpus size (~350 entries) it is instant, and it never produces the
 * confusing near-misses a trigram matcher gives you on names.
 */

export type { SearchEntry, SearchGroup } from '@pleiad/engine/services/search-reference'

/** Reference joins only once the query is specific enough to mean something. */
export const MIN_REFERENCE_QUERY = 2

export const PAGE_ENTRIES: readonly SearchEntry[] = [
  { id: 'page-today', title: 'Today', href: '/app', group: 'Pages', keywords: 'board across the systems home' },
  { id: 'page-calendar', title: 'Dreamspell Calendar', href: '/app/calendar', group: 'Pages', keywords: 'kin month 13 moons wavespell' },
  { id: 'page-cal-hebrew', title: 'Hebrew Calendar', href: '/app/calendars/hebrew', group: 'Pages', keywords: 'jewish lunisolar holidays' },
  { id: 'page-cal-hijri', title: 'Hijri Calendar', href: '/app/calendars/hijri', group: 'Pages', keywords: 'islamic lunar ramadan eid' },
  { id: 'page-cal-persian', title: 'Persian Calendar', href: '/app/calendars/persian', group: 'Pages', keywords: 'solar hijri nowruz equinox' },
  { id: 'page-cal-chinese', title: 'Chinese Calendar', href: '/app/calendars/chinese', group: 'Pages', keywords: 'lunisolar zodiac stems branches' },
  { id: 'page-cal-panchang', title: 'Panchang', href: '/app/calendars/panchang', group: 'Pages', keywords: 'vedic tithi nakshatra' },
  { id: 'page-cal-longcount', title: 'Maya Long Count', href: '/app/calendars/long-count', group: 'Pages', keywords: 'baktun katun haab' },
  { id: 'page-people', title: 'People', href: '/app/people', group: 'Pages', keywords: 'profiles persons' },
  { id: 'page-map', title: 'Relationship Map', href: '/app/graph', group: 'Pages', keywords: 'network graph bonds' },
  { id: 'page-circles', title: 'Circles', href: '/app/groups', group: 'Pages', keywords: 'groups families teams' },
  { id: 'page-oracles', title: 'Oracles', href: '/app/oracles', group: 'Pages', keywords: 'tarot i ching runes daily draw' },
  { id: 'page-tree', title: 'Tree of Life', href: '/app/tree-of-life', group: 'Pages', keywords: 'kabbalah sefirot paths pillars' },
  { id: 'page-library', title: 'Library', href: '/app/library', group: 'Pages', keywords: 'articles questions codex learn' },
  { id: 'page-settings', title: 'Settings', href: '/app/settings', group: 'Pages', keywords: 'preferences systems notifications plan' },
  { id: 'learn-dreamspell', title: 'Codex: Dreamspell', href: '/learn/dreamspell', group: 'Pages', keywords: 'kin seals tones wavespell' },
  { id: 'learn-tzolkin', title: 'Codex: Tzolkin', href: '/learn/tzolkin', group: 'Pages', keywords: 'maya 260 sacred count' },
  { id: 'learn-astrology', title: 'Codex: Astrology', href: '/learn/astrology', group: 'Pages', keywords: 'zodiac natal chart planets' },
  { id: 'learn-hd', title: 'Codex: Human Design', href: '/learn/human-design', group: 'Pages', keywords: 'bodygraph gates channels type' },
  { id: 'learn-gematria', title: 'Codex: Kabbalah', href: '/learn/gematria', group: 'Pages', keywords: 'hebrew letters values' },
  { id: 'learn-integration', title: 'Codex: Integration', href: '/learn/integration', group: 'Pages', keywords: 'systems together synthesis' },
]

export function peopleEntries(
  people: readonly { id: string; name: string; birth_date: string }[]
): SearchEntry[] {
  return people.map((person) => ({
    id: `person-${person.id}`,
    title: person.name,
    subtitle: person.birth_date,
    href: `/app/people/${person.id}`,
    group: 'People' as const,
    keywords: 'person profile reading',
  }))
}

/**
 * Rank: a title that starts with the query beats one that merely contains
 * it, which beats a subtitle hit, which beats a keyword hit. Without that
 * ordering, typing "sun" surfaces four holidays before the Sun itself.
 */
function score(entry: SearchEntry, query: string): number {
  const title = entry.title.toLowerCase()
  if (title.startsWith(query)) return 0
  if (title.includes(query)) return 1
  if (entry.subtitle?.toLowerCase().includes(query) === true) return 2
  if (entry.keywords?.toLowerCase().includes(query) === true) return 3
  return -1
}

export function searchEntries(
  query: string,
  people: readonly { id: string; name: string; birth_date: string }[],
  limit = 40
): SearchEntry[] {
  const needle = query.trim().toLowerCase()
  if (needle.length === 0) return []

  // The empty palette is a navigator, not a dictionary: pages and people
  // only, until the query is specific enough to be worth 300 more rows.
  const corpus =
    needle.length >= MIN_REFERENCE_QUERY
      ? [...peopleEntries(people), ...PAGE_ENTRIES, ...getReferenceEntries()]
      : [...peopleEntries(people), ...PAGE_ENTRIES]

  return corpus
    .map((entry) => ({ entry, rank: score(entry, needle) }))
    .filter(({ rank }) => rank >= 0)
    .sort((a, b) => a.rank - b.rank)
    .slice(0, limit)
    .map(({ entry }) => entry)
}
