import { describe, expect, it } from 'vitest'

import { getReferenceEntries } from './search-reference'

describe('search reference corpus', () => {
  const entries = getReferenceEntries()

  it('indexes every library', () => {
    const groups = new Map<string, number>()
    for (const entry of entries) {
      const kind = entry.id.split('-')[0] ?? ''
      groups.set(kind, (groups.get(kind) ?? 0) + 1)
    }
    expect(groups.get('tarot')).toBe(78)
    expect(groups.get('hex')).toBe(64)
    expect(groups.get('rune')).toBe(24)
    expect(groups.get('sefirah')).toBe(10)
    expect(groups.get('gk')).toBe(64)
  })

  it('gives every entry a destination and a unique id', () => {
    expect(entries.every((entry) => entry.href.startsWith('/'))).toBe(true)
    expect(new Set(entries.map((entry) => entry.id)).size).toBe(entries.length)
  })

  it('caches — the data is static, so the corpus is built once', () => {
    expect(getReferenceEntries()).toBe(entries)
  })
})
