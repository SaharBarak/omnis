import { describe, expect, it } from 'vitest'
import { ARTICLES, LIBRARY_ENTRIES, findArticle, humanize, neighboursOf, toProse } from './library'
import { matchesQuery } from './library-search'
import { docStructure } from '@/lib/docs/content'

describe('toProse', () => {
  it('splits paragraphs on blank lines and joins wrapped lines', () => {
    expect(toProse('\n  One line\n  wrapped.\n\n  Two.\n')).toEqual([
      { kind: 'p', text: 'One line wrapped.' },
      { kind: 'p', text: 'Two.' },
    ])
  })

  it('reads "- " lines as a list after their lead-in', () => {
    expect(toProse('Relates to:\n- gestation\n- Venus\nAfter.')).toEqual([
      { kind: 'p', text: 'Relates to:' },
      { kind: 'list', items: ['gestation', 'Venus'] },
      { kind: 'p', text: 'After.' },
    ])
  })
})

describe('humanize', () => {
  it('turns a camelCase key into a label', () => {
    expect(humanize('practicalSteps')).toBe('Practical steps')
    expect(humanize('notSelf')).toBe('Not self')
  })
})

describe('library', () => {
  it('has one article per docs section, in the docs order', () => {
    expect(ARTICLES.map((a) => a.slug)).toEqual(docStructure.sections.map((s) => s.id))
  })

  it('gives every article sections, and every section a title and content', () => {
    for (const article of ARTICLES) {
      expect(article.sections.length).toBeGreaterThan(0)
      expect(article.minutes).toBeGreaterThan(0)
      for (const section of article.sections) {
        expect(section.title.trim()).not.toBe('')
        expect(section.blocks.length).toBeGreaterThan(0)
      }
    }
  })

  it('keeps section ids unique across the library', () => {
    const ids = LIBRARY_ENTRIES.map((entry) => entry.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('reads record lists as tables or cards with no empty cell titles', () => {
    const cards = ARTICLES.flatMap((a) => a.sections.flatMap((s) => s.blocks)).flatMap((b) =>
      b.kind === 'cards' ? b.cards : [],
    )
    expect(cards.length).toBeGreaterThan(0)
    for (const card of cards) expect(card.title.trim()).not.toBe('')
  })

  it('links each article to its neighbours and stops at the ends', () => {
    const first = ARTICLES[0]
    const last = ARTICLES[ARTICLES.length - 1]
    expect(neighboursOf(first.slug).prev).toBeNull()
    expect(neighboursOf(first.slug).next?.slug).toBe(ARTICLES[1].slug)
    expect(neighboursOf(last.slug).next).toBeNull()
  })

  it('finds an article by slug and nothing for an unknown one', () => {
    expect(findArticle('dreamspell')?.title).toBe('Dreamspell')
    expect(findArticle('nope')).toBeUndefined()
  })

  it('matches every word of a search in a section', () => {
    const seals = LIBRARY_ENTRIES.find((entry) => entry.id === 'dreamspell-seals')
    expect(seals).toBeDefined()
    if (!seals) return
    expect(matchesQuery(seals, 'red dragon')).toBe(true)
    expect(matchesQuery(seals, 'red zzzqx')).toBe(false)
  })
})
