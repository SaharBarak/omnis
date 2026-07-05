/**
 * Corpus builder: flattens the canonical /learn documentation module
 * (src/lib/docs/content.ts) into plain-prose documents + sections.
 *
 * The /learn pages render directly from that module, so ingesting it keeps
 * the knowledge base automatically in sync with the shipped guides — no TSX
 * parsing, no parallel markdown copies to maintain.
 */

import {
  astrologyDocs,
  docStructure,
  dreamspellDocs,
  gematriaDocs,
  humanDesignDocs,
  integrationDocs,
  tzolkinDocs,
} from '../../../src/lib/docs/content'

export interface CorpusSection {
  /** Top-level key inside the doc object, e.g. "seals" */
  key: string
  /** Human heading, e.g. "The 20 Solar Seals" */
  heading: string
  /** In-page anchor from docStructure when the topic id matches */
  anchor: string | null
  /** Flattened prose */
  text: string
}

export interface CorpusDoc {
  /** Stable slug matching the /learn route */
  slug: string
  /** Canonical page URL (knowledge_base.source_url, unique key) */
  sourceUrl: string
  title: string
  description: string
  sections: CorpusSection[]
}

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://omnis.app').replace(/\/$/, '')

const DOC_SOURCES: ReadonlyArray<{ slug: string; docs: Record<string, unknown> }> = [
  { slug: 'dreamspell', docs: dreamspellDocs },
  { slug: 'human-design', docs: humanDesignDocs },
  { slug: 'astrology', docs: astrologyDocs },
  { slug: 'gematria', docs: gematriaDocs },
  { slug: 'tzolkin', docs: tzolkinDocs },
  { slug: 'integration', docs: integrationDocs },
]

// ---------------------------------------------------------------------------
// Text rendering
// ---------------------------------------------------------------------------

/** Collapse template-literal indentation while preserving paragraph breaks. */
function cleanText(raw: string): string {
  return raw
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n\n')
}

function humanizeKey(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
}

const SKIP_KEYS = new Set(['icon', 'id', 'anchor'])
const LEAD_KEYS = ['title', 'subtitle', 'name', 'term'] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Generic recursive renderer for the doc-object shapes in content.ts:
 * prose strings, quote objects, and arrays of {name/term, ...facts,
 * description, keyPoints[]} records — all become searchable prose.
 */
function renderValue(value: unknown): string {
  if (typeof value === 'string') return cleanText(value)
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) {
    const items = value.map((item) => renderValue(item)).filter(Boolean)
    // Scalar lists read best as compact bullet lines
    if (value.every((item) => typeof item === 'string')) {
      return items.map((line) => `- ${line}`).join('\n')
    }
    return items.join('\n\n')
  }
  if (isRecord(value)) {
    // Quotes: `"text" — author`
    if (typeof value.text === 'string' && typeof value.author === 'string') {
      return `"${cleanText(value.text)}" — ${value.author}`
    }
    // Term/definition glossary entries
    if (typeof value.term === 'string' && typeof value.definition === 'string') {
      return `${value.term}: ${cleanText(value.definition)}`
    }

    const lines: string[] = []
    const lead = LEAD_KEYS.map((k) => value[k]).find((v) => typeof v === 'string') as
      | string
      | undefined
    if (lead) lines.push(lead)

    for (const [key, entry] of Object.entries(value)) {
      if (SKIP_KEYS.has(key) || (LEAD_KEYS as readonly string[]).includes(key)) continue
      if (entry === null || entry === undefined) continue
      const rendered = renderValue(entry)
      if (!rendered) continue
      const isShortScalar =
        (typeof entry === 'string' && !entry.includes('\n') && entry.length <= 120) ||
        typeof entry === 'number' ||
        typeof entry === 'boolean'
      lines.push(isShortScalar ? `${humanizeKey(key)}: ${rendered}` : rendered)
    }
    return lines.join('\n')
  }
  return ''
}

// ---------------------------------------------------------------------------
// Corpus assembly
// ---------------------------------------------------------------------------

interface DocStructureSection {
  id: string
  title: string
  description: string
  topics: Array<{ id: string; title: string; anchor: string }>
}

function structureFor(slug: string): DocStructureSection | undefined {
  return (docStructure.sections as DocStructureSection[]).find((s) => s.id === slug)
}

export function buildCorpus(): CorpusDoc[] {
  return DOC_SOURCES.map(({ slug, docs }) => {
    const structure = structureFor(slug)
    const sections: CorpusSection[] = Object.entries(docs)
      .map(([key, value]) => {
        const record = isRecord(value) ? value : {}
        const heading =
          typeof record.title === 'string' ? record.title : humanizeKey(key)
        const topic = structure?.topics.find((t) => t.id === key)
        // The heading is re-added as chunk context, so drop a duplicate lead line
        const rendered = renderValue(value)
        const text = rendered.startsWith(`${heading}\n`)
          ? rendered.slice(heading.length + 1).trimStart()
          : rendered
        return {
          key,
          heading,
          anchor: topic?.anchor ?? null,
          text,
        }
      })
      .filter((section) => section.text.length > 0)

    return {
      slug,
      sourceUrl: `${SITE_URL}/learn/${slug}`,
      title: structure?.title ?? humanizeKey(slug),
      description: structure?.description ?? '',
      sections,
    }
  })
}
