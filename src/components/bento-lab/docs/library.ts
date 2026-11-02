/**
 * The /learn library as data: every article, section and table comes from
 * src/lib/docs/content.ts, read by shape. A new section or record list in the
 * content renders without a change here.
 */
import type { LibraryEntry } from './library-search'
import { DOC_FLAVORS, type DocFlavor, type DocSectionId } from '@/lib/design/system-flavors'
import {
  astrologyDocs,
  docStructure,
  dreamspellDocs,
  gematriaDocs,
  humanDesignDocs,
  integrationDocs,
  tzolkinDocs,
} from '@/lib/docs/content'

export type Prose = { readonly kind: 'p'; readonly text: string } | { readonly kind: 'list'; readonly items: readonly string[] }

export interface Fact {
  readonly label: string
  readonly value: string
}

export interface ArticleCard {
  readonly title: string
  readonly badges: readonly string[]
  readonly facts: readonly Fact[]
  readonly chips: readonly string[]
  readonly body: readonly { readonly label: string | null; readonly prose: readonly Prose[] }[]
}

export type ArticleBlock =
  | { readonly kind: 'prose'; readonly label: string | null; readonly prose: readonly Prose[] }
  | { readonly kind: 'lines'; readonly label: string; readonly lines: readonly string[] }
  | { readonly kind: 'quote'; readonly text: string; readonly author: string }
  | { readonly kind: 'steps'; readonly label: string; readonly items: readonly string[] }
  | {
      readonly kind: 'table'
      readonly label: string
      readonly columns: readonly string[]
      readonly rows: readonly (readonly string[])[]
    }
  | { readonly kind: 'cards'; readonly label: string; readonly cards: readonly ArticleCard[] }

export interface ArticleSection {
  readonly id: string
  readonly title: string
  readonly subtitle: string | null
  readonly blocks: readonly ArticleBlock[]
  readonly minutes: number
}

export interface Article {
  readonly slug: DocSectionId
  readonly title: string
  readonly description: string
  readonly flavor: DocFlavor
  readonly sections: readonly ArticleSection[]
  readonly minutes: number
}

/** Words a reader gets through in a minute of study reading. */
export const READING_WPM = 230
/** Longest cell a record list may hold and still read as a table. */
const TABLE_CELL_MAX = 90
const TABLE_COLUMNS_MAX = 6
/** Longest string drawn as a short fact; anything longer reads as prose. */
const FACT_MAX = 80
/** Longest list item drawn as a chip. */
const CHIP_MAX = 32

/** Keys whose value names a record. First match wins. */
const TITLE_KEYS = ['name', 'title', 'term', 'sign', 'profile', 'theme', 'aspect', 'letter', 'color', 'yucatec', 'word']
/** Number keys that order a list (step 1, day 4) rather than measure something. */
const ORDINAL_KEYS = new Set(['number', 'step', 'day'])
/** Short marks shown beside a record's title. */
const BADGE_KEYS = new Set(['symbol', 'percentage'])
/** Prose keys that open a section and need no label. */
const UNLABELED_KEYS = new Set(['introduction', 'content', 'description'])
/** Keys whose line breaks carry meaning (a worked calculation). */
const LINE_KEYS = new Set(['example'])
const HEAD_KEYS = new Set(['title', 'subtitle'])

const SOURCES: Readonly<Record<DocSectionId, object>> = {
  dreamspell: dreamspellDocs,
  'human-design': humanDesignDocs,
  astrology: astrologyDocs,
  gematria: gematriaDocs,
  tzolkin: tzolkinDocs,
  integration: integrationDocs,
}

type Json = string | number | boolean | null | readonly Json[] | { readonly [key: string]: Json }
type Record_ = { readonly [key: string]: Json }

const isRecord = (value: unknown): value is Record_ =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const isStringList = (value: Json): value is readonly string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string')
const isRecordList = (value: Json): value is readonly Record_[] =>
  Array.isArray(value) && value.length > 0 && value.every(isRecord)
const isQuote = (value: Json): value is { readonly text: string; readonly author: string } =>
  isRecord(value) && typeof value.text === 'string' && typeof value.author === 'string'
const isSection = (value: unknown): value is Record_ => isRecord(value) && typeof value.title === 'string'

/** "practicalSteps" → "Practical steps". */
export const humanize = (key: string): string => {
  const words = key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

const kebab = (key: string): string => key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

const cleanLines = (text: string): readonly string[] => text.split('\n').map((line) => line.trim())

/** Indented template text → paragraphs and "- " lists. */
export function toProse(text: string): readonly Prose[] {
  const paragraphs = cleanLines(text)
    .join('\n')
    .split(/\n{2,}/)
    .map((chunk) => chunk.split('\n').filter(Boolean))
    .filter((lines) => lines.length > 0)
  return paragraphs.flatMap((lines) => {
    const out: Prose[] = []
    let words: string[] = []
    let items: string[] = []
    const flushWords = () => {
      if (words.length) out.push({ kind: 'p', text: words.join(' ') })
      words = []
    }
    const flushItems = () => {
      if (items.length) out.push({ kind: 'list', items })
      items = []
    }
    for (const line of lines) {
      if (line.startsWith('- ')) {
        flushWords()
        items.push(line.slice(2))
      } else {
        flushItems()
        words.push(line)
      }
    }
    flushWords()
    flushItems()
    return out
  })
}

const cellText = (value: Json): string =>
  isStringList(value) ? value.join(', ') : typeof value === 'string' || typeof value === 'number' ? String(value) : ''

const isTableable = (records: readonly Record_[]): boolean => {
  const keys = Object.keys(records[0])
  return (
    keys.length <= TABLE_COLUMNS_MAX &&
    records.every((record) =>
      Object.values(record).every(
        (value) =>
          (typeof value === 'number' || typeof value === 'string' || isStringList(value)) &&
          cellText(value).length <= TABLE_CELL_MAX,
      ),
    )
  )
}

const columnOf = (key: string): string => (ORDINAL_KEYS.has(key) ? '#' : humanize(key))

const toTable = (label: string, records: readonly Record_[]): ArticleBlock => {
  const keys = Object.keys(records[0])
  return {
    kind: 'table',
    label,
    columns: keys.map(columnOf),
    rows: records.map((record) => keys.map((key) => cellText(record[key] ?? ''))),
  }
}

const titleOf = (record: Record_): string => {
  const key = TITLE_KEYS.find((k) => typeof record[k] === 'string')
  if (key) return String(record[key])
  const ordinal = Object.keys(record).find((k) => ORDINAL_KEYS.has(k))
  return ordinal ? `${humanize(ordinal)} ${String(record[ordinal])}` : ''
}

/** A list of two-field records ({system, concept}) reads as label → value pairs. */
const pairsOf = (records: readonly Record_[]): readonly Fact[] | null => {
  const pairs = records.map((record) => Object.values(record))
  return pairs.every((values) => values.length === 2 && values.every((v) => typeof v === 'string'))
    ? pairs.map(([label, value]) => ({ label: String(label), value: String(value) }))
    : null
}

const toCard = (record: Record_): ArticleCard => {
  const title = titleOf(record)
  const titleKey = TITLE_KEYS.find((k) => record[k] === title)
  const badges: string[] = []
  const facts: Fact[] = []
  const chips: string[] = []
  const body: { label: string | null; prose: readonly Prose[] }[] = []
  for (const [key, value] of Object.entries(record)) {
    if (key === titleKey) continue
    if (typeof value === 'number') {
      if (ORDINAL_KEYS.has(key)) {
        if (!title.startsWith(humanize(key))) badges.push(String(value))
      } else facts.push({ label: humanize(key), value: String(value) })
    } else if (typeof value === 'string') {
      if (BADGE_KEYS.has(key)) badges.push(value)
      else if (value.length <= FACT_MAX && !value.includes('\n')) facts.push({ label: humanize(key), value })
      else body.push({ label: UNLABELED_KEYS.has(key) ? null : humanize(key), prose: toProse(value) })
    } else if (isStringList(value)) {
      if (value.every((item) => item.length <= CHIP_MAX)) chips.push(...value)
      else body.push({ label: humanize(key), prose: [{ kind: 'list', items: value }] })
    } else if (isRecordList(value)) {
      facts.push(...(pairsOf(value) ?? []))
    }
  }
  return { title, badges, facts, chips, body }
}

const toBlock = (key: string, value: Json): ArticleBlock | null => {
  const label = humanize(key)
  if (typeof value === 'string') {
    if (LINE_KEYS.has(key)) return { kind: 'lines', label, lines: cleanLines(value).filter(Boolean) }
    return { kind: 'prose', label: UNLABELED_KEYS.has(key) ? null : label, prose: toProse(value) }
  }
  if (isQuote(value)) return { kind: 'quote', text: toProse(value.text).map(proseText).join(' '), author: value.author }
  if (isStringList(value)) return { kind: 'steps', label, items: value }
  if (isRecordList(value)) {
    return isTableable(value) ? toTable(label, value) : { kind: 'cards', label, cards: value.map(toCard) }
  }
  return null
}

const proseText = (prose: Prose): string => (prose.kind === 'p' ? prose.text : prose.items.join(' '))

const stringsIn = (value: unknown): readonly string[] => {
  if (typeof value === 'string') return [value]
  if (typeof value === 'number') return []
  if (Array.isArray(value)) return value.flatMap(stringsIn)
  if (isRecord(value)) return Object.values(value).flatMap(stringsIn)
  return []
}

const wordCount = (value: unknown): number =>
  stringsIn(value).reduce((sum, text) => sum + text.split(/\s+/).filter(Boolean).length, 0)

const minutesFor = (words: number): number => Math.max(1, Math.round(words / READING_WPM))

const toSection = (slug: DocSectionId, key: string, value: Record_, entries = Object.entries(value)): ArticleSection => ({
  id: `${slug}-${kebab(key)}`,
  title: String(value.title),
  subtitle: typeof value.subtitle === 'string' ? value.subtitle : null,
  blocks: entries
    .filter(([k]) => !HEAD_KEYS.has(k))
    .map(([k, v]) => toBlock(k, v))
    .filter((block): block is ArticleBlock => block !== null),
  minutes: minutesFor(wordCount(Object.fromEntries(entries))),
})

/** A module is a map of sections; one with its own title opens with an overview built from its loose fields. */
const sectionsOf = (slug: DocSectionId, source: object): readonly ArticleSection[] => {
  const entries = Object.entries(source as Record_)
  const nested = entries.filter(([, value]) => isSection(value)) as [string, Record_][]
  const loose = entries.filter(([, value]) => !isSection(value))
  const overview = isSection(source) ? [toSection(slug, 'overview', source as Record_, loose)] : []
  return [...overview, ...nested.map(([key, value]) => toSection(slug, key, value))]
}

const toArticle = (meta: (typeof docStructure.sections)[number]): Article => {
  const slug = meta.id as DocSectionId
  const sections = sectionsOf(slug, SOURCES[slug])
  return {
    slug,
    title: meta.title,
    description: meta.description,
    flavor: DOC_FLAVORS[slug],
    sections,
    minutes: minutesFor(wordCount(SOURCES[slug])),
  }
}

/** Articles in the order the docs structure lists them. */
export const ARTICLES: readonly Article[] = docStructure.sections.map(toArticle)

export const findArticle = (slug: string): Article | undefined => ARTICLES.find((article) => article.slug === slug)

export interface Neighbours {
  readonly prev: Article | null
  readonly next: Article | null
}

export const neighboursOf = (slug: DocSectionId): Neighbours => {
  const index = ARTICLES.findIndex((article) => article.slug === slug)
  return { prev: ARTICLES[index - 1] ?? null, next: ARTICLES[index + 1] ?? null }
}

export const LIBRARY_ENTRIES: readonly LibraryEntry[] = ARTICLES.flatMap((article) =>
  article.sections.map((section) => ({
    id: section.id,
    title: section.title,
    article: article.slug,
    system: article.flavor.name,
    accent: article.flavor.accentSoft,
    minutes: section.minutes,
    haystack: [section.title, section.subtitle ?? '', article.title, ...section.blocks.flatMap(blockTerms)]
      .join(' ')
      .toLowerCase(),
  })),
)

function blockTerms(block: ArticleBlock): readonly string[] {
  if (block.kind === 'table') return [block.label, ...block.rows.flat()]
  if (block.kind === 'cards') return [block.label, ...block.cards.flatMap((card) => [card.title, ...card.chips])]
  if (block.kind === 'steps' || block.kind === 'lines') return [block.label]
  return []
}

