/**
 * The searchable reference corpus (#77) — every card, hexagram, rune, gene
 * key, sefirah, letter, seal, holiday and article, as flat entries.
 *
 * Shared because both clients index the same things and it would be absurd
 * for a rune to be findable on one platform and not the other. `href` is the
 * **web path**, which is the portable identity of a destination across the
 * two apps (favorites key on the same thing); mobile maps it to a local
 * route with `mobileRouteFor()`.
 *
 * The matching itself is each client's business — this module only decides
 * what exists and where it leads.
 */

import { ARTICLES, TOPIC_LABELS } from '../data/articles'
import { TAROT_DECK } from '../data/tarot'
import { HEXAGRAMS } from '../data/iching'
import { ELDER_FUTHARK } from '../data/runes'
import { GENE_KEYS } from '../data/gene-keys'
import { SEFIROT, TREE_PATHS } from '../data/tree-of-life'
import { HEBREW_LETTERS } from '../data/hebrew-letters'
import { SEALS } from '../data/seals'
import { HEBREW_HOLIDAYS } from '../calculations/hebrew-calendar'
import {
  CHINESE_FESTIVALS,
  HIJRI_HOLIDAYS,
  PERSIAN_HOLIDAYS,
} from '../calculations/world-calendars'

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

function referenceEntries(): SearchEntry[] {
  const entries: SearchEntry[] = []

  for (const article of ARTICLES) {
    entries.push({
      id: `article-${article.slug}`,
      title: article.question,
      subtitle: article.title,
      href: `/app/library/${article.slug}`,
      group: 'Reference',
      keywords: `library article ${TOPIC_LABELS[article.topic]}`,
    })
  }

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
