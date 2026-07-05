/**
 * Section-aware chunking for the knowledge corpus.
 *
 * Targets ~200–400 tokens per chunk (bge-small's sweet spot; its context is
 * 512 tokens). Using the ~4 chars/token heuristic that is ~800–1600 chars.
 * Long sections split at paragraph (then sentence) boundaries with a
 * trailing-text overlap so ideas spanning a boundary stay retrievable.
 *
 * Every chunk is prefixed with "<Doc title> — <Section heading>" so both the
 * embedding and the rendered snippet carry their context.
 */

import type { CorpusDoc, CorpusSection } from './corpus'

export interface Chunk {
  index: number
  text: string
  metadata: {
    system: string
    section: string
    heading: string
    anchor: string | null
  }
}

const MAX_CHARS = 1500
const MIN_FLUSH_CHARS = 700
const OVERLAP_CHARS = 200

function splitLongParagraph(paragraph: string): string[] {
  if (paragraph.length <= MAX_CHARS) return [paragraph]
  const sentences = paragraph.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) ?? [paragraph]
  const parts: string[] = []
  let current = ''
  for (const sentence of sentences) {
    if (current.length + sentence.length > MAX_CHARS && current) {
      parts.push(current.trim())
      current = ''
    }
    current += sentence
  }
  if (current.trim()) parts.push(current.trim())
  return parts
}

/** Last ~OVERLAP_CHARS of a chunk body, cut at a sentence/line start. */
function overlapTail(text: string): string {
  if (text.length <= OVERLAP_CHARS) return text
  const tail = text.slice(-OVERLAP_CHARS)
  const boundary = tail.search(/(?<=[.!?])\s+|\n/)
  return (boundary >= 0 ? tail.slice(boundary) : tail).trim()
}

function chunkSection(doc: CorpusDoc, section: CorpusSection): string[] {
  const contextPrefix = `${doc.title} — ${section.heading}\n\n`
  const paragraphs = section.text.split(/\n{2,}/).flatMap(splitLongParagraph)

  const bodies: string[] = []
  let current = ''
  for (const paragraph of paragraphs) {
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph
    if (candidate.length > MAX_CHARS && current.length >= MIN_FLUSH_CHARS) {
      bodies.push(current)
      current = `${overlapTail(current)}\n\n${paragraph}`
    } else {
      current = candidate
    }
  }
  if (current.trim()) bodies.push(current.trim())

  return bodies.map((body) => `${contextPrefix}${body}`)
}

export function chunkDoc(doc: CorpusDoc): Chunk[] {
  const chunks: Chunk[] = []
  for (const section of doc.sections) {
    for (const text of chunkSection(doc, section)) {
      chunks.push({
        index: chunks.length,
        text,
        metadata: {
          system: doc.slug,
          section: section.key,
          heading: section.heading,
          anchor: section.anchor,
        },
      })
    }
  }
  return chunks
}
