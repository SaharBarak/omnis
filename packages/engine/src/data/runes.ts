/**
 * The Elder Futhark (#74) — the 24 runes in row (aett) order, with glyph,
 * transliteration, traditional name-meaning, and a one-line reading.
 */

export interface Rune {
  /** 0-23 in futhark order. */
  readonly id: number
  readonly glyph: string
  readonly name: string
  readonly transliteration: string
  /** 1-3: Freyr's, Hagal's, or Tyr's aett. */
  readonly aett: 1 | 2 | 3
  /** The name's literal meaning. */
  readonly literal: string
  readonly meaning: string
}

export const ELDER_FUTHARK: readonly Rune[] = Object.freeze([
  { id: 0, glyph: 'ᚠ', name: 'Fehu', transliteration: 'f', aett: 1, literal: 'cattle', meaning: 'Mobile wealth — abundance that must circulate to stay alive' },
  { id: 1, glyph: 'ᚢ', name: 'Uruz', transliteration: 'u', aett: 1, literal: 'aurochs', meaning: 'Wild strength — untamed vitality and the health to endure' },
  { id: 2, glyph: 'ᚦ', name: 'Thurisaz', transliteration: 'th', aett: 1, literal: 'giant / thorn', meaning: 'The thorn — reactive force, defense, a warning at the gate' },
  { id: 3, glyph: 'ᚨ', name: 'Ansuz', transliteration: 'a', aett: 1, literal: 'god / mouth', meaning: 'The breath of Odin — message, speech, inspiration arriving' },
  { id: 4, glyph: 'ᚱ', name: 'Raidho', transliteration: 'r', aett: 1, literal: 'ride / wagon', meaning: 'The journey — right movement, rhythm, travel in order' },
  { id: 5, glyph: 'ᚲ', name: 'Kenaz', transliteration: 'k', aett: 1, literal: 'torch', meaning: 'The controlled flame — craft, knowledge, the workshop light' },
  { id: 6, glyph: 'ᚷ', name: 'Gebo', transliteration: 'g', aett: 1, literal: 'gift', meaning: 'The gift — exchange, hospitality, a bond sealed both ways' },
  { id: 7, glyph: 'ᚹ', name: 'Wunjo', transliteration: 'w', aett: 1, literal: 'joy', meaning: 'Joy — harmony in the clan, wishes landing well' },
  { id: 8, glyph: 'ᚺ', name: 'Hagalaz', transliteration: 'h', aett: 2, literal: 'hail', meaning: 'Hail — disruption from outside, the storm that reseeds the field' },
  { id: 9, glyph: 'ᚾ', name: 'Nauthiz', transliteration: 'n', aett: 2, literal: 'need', meaning: 'Need-fire — constraint, friction, the strength distilled by lack' },
  { id: 10, glyph: 'ᛁ', name: 'Isa', transliteration: 'i', aett: 2, literal: 'ice', meaning: 'Ice — standstill, concentration, the pause that preserves' },
  { id: 11, glyph: 'ᛃ', name: 'Jera', transliteration: 'j/y', aett: 2, literal: 'year / harvest', meaning: 'The year-wheel — harvest in season, effort returned in time' },
  { id: 12, glyph: 'ᛇ', name: 'Eihwaz', transliteration: 'ei', aett: 2, literal: 'yew', meaning: 'The yew — the world-axis, endurance through death and renewal' },
  { id: 13, glyph: 'ᛈ', name: 'Perthro', transliteration: 'p', aett: 2, literal: 'lot-cup', meaning: 'The dice cup — chance, hidden matters, fate not yet cast' },
  { id: 14, glyph: 'ᛉ', name: 'Algiz', transliteration: 'z', aett: 2, literal: 'elk / sedge', meaning: 'The raised guard — protection, higher connection, alert stillness' },
  { id: 15, glyph: 'ᛊ', name: 'Sowilo', transliteration: 's', aett: 2, literal: 'sun', meaning: 'The sun — victory, wholeness, the goal lit and reachable' },
  { id: 16, glyph: 'ᛏ', name: 'Tiwaz', transliteration: 't', aett: 3, literal: 'Tyr', meaning: 'The sky-spear — justice, sacrifice for order, honest victory' },
  { id: 17, glyph: 'ᛒ', name: 'Berkano', transliteration: 'b', aett: 3, literal: 'birch', meaning: 'The birch — birth, becoming, growth tended quietly' },
  { id: 18, glyph: 'ᛖ', name: 'Ehwaz', transliteration: 'e', aett: 3, literal: 'horse', meaning: 'The horse — partnership, trust in motion, two moving as one' },
  { id: 19, glyph: 'ᛗ', name: 'Mannaz', transliteration: 'm', aett: 3, literal: 'human', meaning: 'The human — mind and community, the self among selves' },
  { id: 20, glyph: 'ᛚ', name: 'Laguz', transliteration: 'l', aett: 3, literal: 'water', meaning: 'Water — flow, the unconscious, intuition trusted like a tide' },
  { id: 21, glyph: 'ᛜ', name: 'Ingwaz', transliteration: 'ng', aett: 3, literal: 'Ing / seed', meaning: 'The seed — potential gestating, energy stored before release' },
  { id: 22, glyph: 'ᛟ', name: 'Othala', transliteration: 'o', aett: 3, literal: 'inheritance', meaning: 'The homestead — ancestral ground, what is kept in the family' },
  { id: 23, glyph: 'ᛞ', name: 'Dagaz', transliteration: 'd', aett: 3, literal: 'day', meaning: 'Daybreak — awakening, the hinge where night becomes light' },
])
