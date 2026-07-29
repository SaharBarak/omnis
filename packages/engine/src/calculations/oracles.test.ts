import { describe, it, expect } from 'vitest'

import { dailyTarotCard, dailyHexagram, dailyRune } from './oracles'
import { TAROT_DECK } from '../data/tarot'
import { HEXAGRAMS } from '../data/iching'
import { ELDER_FUTHARK } from '../data/runes'

describe('data libraries', () => {
  it('carries the full 78-card deck with unique names', () => {
    expect(TAROT_DECK.length).toBe(78)
    expect(new Set(TAROT_DECK.map((c) => c.name)).size).toBe(78)
    expect(TAROT_DECK.filter((c) => c.arcana === 'major').length).toBe(22)
  })

  it('carries all 64 hexagrams in King Wen order', () => {
    expect(HEXAGRAMS.length).toBe(64)
    HEXAGRAMS.forEach((h, i) => expect(h.number).toBe(i + 1))
    expect(new Set(HEXAGRAMS.map((h) => h.english)).size).toBe(64)
  })

  it('carries the 24 Elder Futhark runes across three aetts', () => {
    expect(ELDER_FUTHARK.length).toBe(24)
    expect(ELDER_FUTHARK.filter((r) => r.aett === 1).length).toBe(8)
    expect(ELDER_FUTHARK.filter((r) => r.aett === 2).length).toBe(8)
    expect(ELDER_FUTHARK.filter((r) => r.aett === 3).length).toBe(8)
  })
})

describe('daily draws', () => {
  it('is deterministic for the same date and seed', () => {
    const a = dailyTarotCard('2026-07-29', 'user-1')
    const b = dailyTarotCard('2026-07-29', 'user-1')
    expect(a.card.id).toBe(b.card.id)
    expect(a.reversed).toBe(b.reversed)
    expect(dailyHexagram('2026-07-29', 'user-1').number).toBe(
      dailyHexagram('2026-07-29', 'user-1').number
    )
    expect(dailyRune('2026-07-29', 'user-1').id).toBe(
      dailyRune('2026-07-29', 'user-1').id
    )
  })

  it('varies across dates and users', () => {
    const cards = new Set<number>()
    const hexes = new Set<number>()
    const runes = new Set<number>()
    for (let i = 1; i <= 30; i++) {
      const date = `2026-06-${String(i).padStart(2, '0')}`
      cards.add(dailyTarotCard(date, 'u').card.id)
      hexes.add(dailyHexagram(date, 'u').number)
      runes.add(dailyRune(date, 'u').id)
    }
    expect(cards.size).toBeGreaterThan(15)
    expect(hexes.size).toBeGreaterThan(15)
    expect(runes.size).toBeGreaterThan(10)
    expect(dailyTarotCard('2026-07-29', 'alice').card.id === dailyTarotCard('2026-07-29', 'bob').card.id
      && dailyHexagram('2026-07-29', 'alice').number === dailyHexagram('2026-07-29', 'bob').number
      && dailyRune('2026-07-29', 'alice').id === dailyRune('2026-07-29', 'bob').id).toBe(false)
  })

  it('draws both orientations over a month', () => {
    const orientations = new Set<boolean>()
    for (let i = 1; i <= 30; i++) {
      orientations.add(dailyTarotCard(`2026-06-${String(i).padStart(2, '0')}`).reversed)
    }
    expect(orientations.size).toBe(2)
  })
})
