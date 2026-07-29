/**
 * Global search index (#77) — client-side, built from three sources:
 * static app pages, the user's people, and reference entries generated
 * straight from the engine's data libraries (cards, hexagrams, runes,
 * gene keys, sefirot, letters, holidays, seals). cmdk does the fuzzy
 * matching; this module only decides what exists and where it leads.
 */

import { TAROT_DECK } from '@pleiad/engine/data/tarot'
import { HEXAGRAMS } from '@pleiad/engine/data/iching'
import { ELDER_FUTHARK } from '@pleiad/engine/data/runes'
import { GENE_KEYS } from '@pleiad/engine/data/gene-keys'
import { SEFIROT, TREE_PATHS } from '@pleiad/engine/data/tree-of-life'
import { HEBREW_LETTERS } from '@pleiad/engine/data/hebrew-letters'
import { SEALS } from '@pleiad/engine/data/seals'
import { HEBREW_HOLIDAYS } from '@pleiad/engine/calculations/hebrew-calendar'
import {
  CHINESE_FESTIVALS,
  HIJRI_HOLIDAYS,
  PERSIAN_HOLIDAYS,
} from '@pleiad/engine/calculations/world-calendars'

export type SearchGroup = 'People' | 'Pages' | 'Reference'

export interface SearchEntry {
  readonly id: string
  readonly title: string
  readonly subtitle?: string
  readonly href: string
  readonly group: SearchGroup
  /** Extra match terms beyond title/subtitle. */
  readonly keywords?: string
}

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
  { id: 'page-profile', title: 'Profile', href: '/app/profile', group: 'Pages', keywords: 'account settings personal birth' },
  { id: 'page-settings', title: 'Settings', href: '/app/settings', group: 'Pages', keywords: 'preferences systems' },
  { id: 'learn-dreamspell', title: 'Learn: Dreamspell', href: '/learn/dreamspell', group: 'Pages', keywords: 'kin seals tones wavespell oracle' },
  { id: 'learn-tzolkin', title: 'Learn: Tzolkin', href: '/learn/tzolkin', group: 'Pages', keywords: 'maya 260 sacred count' },
  { id: 'learn-astrology', title: 'Learn: Astrology', href: '/learn/astrology', group: 'Pages', keywords: 'zodiac natal chart planets houses' },
  { id: 'learn-hd', title: 'Learn: Human Design', href: '/learn/human-design', group: 'Pages', keywords: 'bodygraph gates channels type authority' },
  { id: 'learn-gematria', title: 'Learn: Gematria', href: '/learn/gematria', group: 'Pages', keywords: 'kabbalah hebrew letters values' },
  { id: 'learn-integration', title: 'Learn: Integration', href: '/learn/integration', group: 'Pages', keywords: 'systems together synthesis' },
]

function referenceEntries(): SearchEntry[] {
  const entries: SearchEntry[] = []

  for (const card of TAROT_DECK) {
    entries.push({
      id: `tarot-${card.id}`,
      title: card.name,
      subtitle: card.upright,
      href: '/app/oracles',
      group: 'Reference',
      keywords: `tarot card ${card.arcana} ${card.suit ?? 'major arcana'}`,
    })
  }

  for (const hexagram of HEXAGRAMS) {
    entries.push({
      id: `hex-${hexagram.number}`,
      title: `Hexagram ${hexagram.number} · ${hexagram.english}`,
      subtitle: hexagram.judgment,
      href: '/app/oracles',
      group: 'Reference',
      keywords: `i ching ${hexagram.pinyin} ${hexagram.trigrams.join(' ')}`,
    })
  }

  for (const rune of ELDER_FUTHARK) {
    entries.push({
      id: `rune-${rune.id}`,
      title: `${rune.glyph} ${rune.name}`,
      subtitle: rune.meaning,
      href: '/app/oracles',
      group: 'Reference',
      keywords: `rune elder futhark ${rune.literal}`,
    })
  }

  for (const key of GENE_KEYS) {
    entries.push({
      id: `gk-${key.key}`,
      title: `Gene Key ${key.key}`,
      subtitle: `${key.shadow} → ${key.gift} → ${key.siddhi}`,
      href: '/app/gene-keys',
      group: 'Reference',
      keywords: 'gene keys shadow gift siddhi',
    })
  }

  for (const sefirah of SEFIROT) {
    entries.push({
      id: `sefirah-${sefirah.id}`,
      title: `${sefirah.name} — ${sefirah.translation}`,
      subtitle: sefirah.meaning,
      href: '/app/tree-of-life',
      group: 'Reference',
      keywords: `kabbalah sefirah sefirot tree of life ${sefirah.hebrew}`,
    })
  }

  for (const letter of HEBREW_LETTERS) {
    const onTree = TREE_PATHS.some((p) => p.letterId === letter.id)
    entries.push({
      id: `letter-${letter.id}`,
      title: `${letter.letter} ${letter.name}`,
      subtitle: `Gematria ${letter.standardValue} · ${letter.keywords.join(', ')}`,
      href: onTree ? '/app/tree-of-life' : '/learn/gematria',
      group: 'Reference',
      keywords: 'hebrew letter gematria alphabet',
    })
  }

  for (const seal of SEALS) {
    entries.push({
      id: `seal-${seal.number}`,
      title: `${seal.english} (${seal.mayan})`,
      subtitle: `Seal ${seal.number} · ${seal.color}`,
      href: '/app/calendar',
      group: 'Reference',
      keywords: 'dreamspell solar seal kin',
    })
  }

  const holidaySets: readonly [readonly { name: string; note: string }[], string, string][] = [
    [HEBREW_HOLIDAYS, '/app/calendars/hebrew', 'hebrew jewish holiday'],
    [HIJRI_HOLIDAYS, '/app/calendars/hijri', 'islamic hijri holiday'],
    [PERSIAN_HOLIDAYS, '/app/calendars/persian', 'persian iranian holiday'],
    [CHINESE_FESTIVALS, '/app/calendars/chinese', 'chinese festival'],
  ]
  for (const [holidays, href, kw] of holidaySets) {
    for (const holiday of holidays) {
      entries.push({
        id: `holiday-${kw.split(' ')[0]}-${holiday.name}`,
        title: holiday.name,
        subtitle: holiday.note,
        href,
        group: 'Reference',
        keywords: `${kw} festival observance`,
      })
    }
  }

  return entries
}

/** Built once per session — the engine data is static. */
let cachedReference: SearchEntry[] | null = null

export function getReferenceEntries(): SearchEntry[] {
  cachedReference ??= referenceEntries()
  return cachedReference
}

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
