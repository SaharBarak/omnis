import { describe, it, expect } from 'vitest'

import { SEFIROT, TREE_PATHS, SEFIRAH_BY_ID } from './tree-of-life'
import { HEBREW_LETTERS } from './hebrew-letters'

describe('SEFIROT', () => {
  it('carries ten, numbered in emanation order, on three pillars', () => {
    expect(SEFIROT.length).toBe(10)
    SEFIROT.forEach((s, i) => expect(s.number).toBe(i + 1))
    expect(SEFIROT.filter((s) => s.pillar === 'mercy').length).toBe(3)
    expect(SEFIROT.filter((s) => s.pillar === 'severity').length).toBe(3)
    expect(SEFIROT.filter((s) => s.pillar === 'equilibrium').length).toBe(4)
  })

  it('places pillars at their columns', () => {
    for (const s of SEFIROT) {
      const expected = s.pillar === 'mercy' ? 80 : s.pillar === 'severity' ? 20 : 50
      expect(s.x).toBe(expected)
    }
  })
})

describe('TREE_PATHS', () => {
  it('numbers 22 paths 11-32 and uses every letter exactly once', () => {
    expect(TREE_PATHS.length).toBe(22)
    TREE_PATHS.forEach((p, i) => expect(p.number).toBe(11 + i))
    const letters = TREE_PATHS.map((p) => p.letterId)
    expect(new Set(letters).size).toBe(22)
    const alphabet = new Set(HEBREW_LETTERS.map((l) => l.id))
    for (const letter of letters) expect(alphabet.has(letter)).toBe(true)
  })

  it('connects only real sefirot, no duplicate edges', () => {
    const seen = new Set<string>()
    for (const p of TREE_PATHS) {
      expect(SEFIRAH_BY_ID[p.from]).toBeDefined()
      expect(SEFIRAH_BY_ID[p.to]).toBeDefined()
      const key = [p.from, p.to].sort().join('-')
      expect(seen.has(key)).toBe(false)
      seen.add(key)
    }
  })

  it('gives every sefirah at least one path', () => {
    const touched = new Set(TREE_PATHS.flatMap((p) => [p.from, p.to]))
    expect(touched.size).toBe(10)
  })
})
