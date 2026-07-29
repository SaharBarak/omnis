/**
 * Daily oracle draws (#74) — tarot card, I Ching hexagram, Elder Futhark
 * rune. Draws are deterministic: seeded by civil date plus an optional
 * per-user key (FNV-1a), so "today's card" is the same card all day on
 * every device, different per user, and different again tomorrow. Each
 * oracle salts the hash so one seed doesn't correlate across systems.
 */

import { TAROT_DECK, type TarotCard } from '../data/tarot'
import { HEXAGRAMS, type Hexagram } from '../data/iching'
import { ELDER_FUTHARK, type Rune } from '../data/runes'

/** 32-bit FNV-1a. */
function fnv1a(input: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

export interface DailyTarot {
  readonly card: TarotCard
  readonly reversed: boolean
}

export function dailyTarotCard(dateStr: string, seedKey = ''): DailyTarot {
  const hash = fnv1a(`tarot:${dateStr}:${seedKey}`)
  const card = TAROT_DECK[hash % TAROT_DECK.length]
  // An independent bit for orientation, off the top of the hash.
  const reversed = ((hash >>> 24) & 1) === 1
  return { card, reversed }
}

export function dailyHexagram(dateStr: string, seedKey = ''): Hexagram {
  const hash = fnv1a(`iching:${dateStr}:${seedKey}`)
  return HEXAGRAMS[hash % HEXAGRAMS.length]
}

export function dailyRune(dateStr: string, seedKey = ''): Rune {
  const hash = fnv1a(`runes:${dateStr}:${seedKey}`)
  return ELDER_FUTHARK[hash % ELDER_FUTHARK.length]
}
