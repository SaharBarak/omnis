import { describe, expect, it } from 'vitest'
import { LEGAL_DOCS, numberedHeading, plainText, updatedLabel, type Block, type LegalDoc } from './index'
import { SITE_ROUTES } from '@/lib/site/routes'

const DOCS: readonly LegalDoc[] = Object.values(LEGAL_DOCS)

const blockRuns = (block: Block) => (block.kind === 'p' ? [block.content] : block.items)

const linksOf = (doc: LegalDoc): readonly string[] =>
  doc.sections
    .flatMap((section) => section.blocks.flatMap(blockRuns))
    .flat()
    .flatMap((part) => (typeof part !== 'string' && part.kind === 'link' ? [part.href] : []))

describe('legal documents', () => {
  it.each(DOCS.map((doc) => [doc.slug, doc] as const))('%s has a title, a dated update and sections', (_, doc) => {
    expect(doc.title.trim()).not.toBe('')
    expect(doc.description.trim()).not.toBe('')
    expect(doc.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(Number.isNaN(Date.parse(doc.updated))).toBe(false)
    expect(doc.sections.length).toBeGreaterThan(0)
  })

  it.each(DOCS.map((doc) => [doc.slug, doc] as const))('%s has no empty section, block or list item', (_, doc) => {
    for (const section of doc.sections) {
      expect(section.heading.trim()).not.toBe('')
      expect(section.blocks.length).toBeGreaterThan(0)
      for (const run of section.blocks.flatMap(blockRuns)) {
        expect(plainText(run).trim()).not.toBe('')
      }
    }
  })

  it('keys each document by its own slug', () => {
    for (const [slug, doc] of Object.entries(LEGAL_DOCS)) expect(doc.slug).toBe(slug)
  })

  it('formats the update date the way the live pages print it', () => {
    expect(updatedLabel(LEGAL_DOCS.terms)).toBe('January 25, 2026')
    expect(updatedLabel(LEGAL_DOCS.refund)).toBe('July 13, 2026')
  })

  it('numbers headings by position', () => {
    expect(numberedHeading(LEGAL_DOCS.terms, 0)).toBe('1. Acceptance of Terms')
  })

  it('links in-app only to routes the site knows', () => {
    const live = new Set(SITE_ROUTES.map((route) => route.live))
    const internal = DOCS.flatMap(linksOf).filter((href) => href.startsWith('/'))
    expect(internal.length).toBeGreaterThan(0)
    for (const href of internal) expect(live.has(href)).toBe(true)
  })
})
