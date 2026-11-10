import { describe, expect, it } from 'vitest'
import { V2_FOOTER, V2_INVERSE_MAX, V2_RUN, V2_SECTIONS, chapterOf } from './v2-chapters'

describe('the v2 home keeps the other ground rare (BENTO_V2.md "Light and dark")', () => {
  const turns = V2_RUN.filter((section) => chapterOf(section) !== undefined)

  it('opens and closes on the page itself', () => {
    expect(chapterOf(V2_SECTIONS[0][0])).toBeUndefined()
    expect(chapterOf(V2_SECTIONS[V2_SECTIONS.length - 1][0])).toBeUndefined()
  })

  it('ends on the footer', () => {
    expect(V2_RUN.at(-1)).toBe(V2_FOOTER)
    expect(new Set(V2_RUN).size).toBe(V2_RUN.length)
  })

  it('turns to the other ground at least once and at most the allowed number of times', () => {
    expect(turns.length).toBeGreaterThan(0)
    expect(turns.length).toBeLessThanOrEqual(V2_INVERSE_MAX)
  })

  it('never sets two turns side by side', () => {
    for (const [i, section] of V2_RUN.entries()) {
      const next = V2_RUN[i + 1]
      if (next && chapterOf(section) !== undefined) expect(chapterOf(next), `${section} then ${next}`).toBeUndefined()
    }
  })
})
