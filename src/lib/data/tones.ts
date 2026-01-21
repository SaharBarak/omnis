import type { Tone } from '../types/tone.ts'

export const TONES: readonly Tone[] = Object.freeze([
  { number: 1,  name: 'Magnetic',      hebrewName: 'מגנטי',      keywords: ['Unify', 'Attract', 'Purpose'],        action: 'unify' },
  { number: 2,  name: 'Lunar',         hebrewName: 'ירחי',       keywords: ['Polarize', 'Stabilize', 'Challenge'], action: 'polarize' },
  { number: 3,  name: 'Electric',      hebrewName: 'חשמלי',      keywords: ['Activate', 'Bond', 'Service'],        action: 'activate' },
  { number: 4,  name: 'Self-Existing', hebrewName: 'קיים-עצמי', keywords: ['Define', 'Measure', 'Form'],          action: 'define' },
  { number: 5,  name: 'Overtone',      hebrewName: 'על-טון',     keywords: ['Empower', 'Command', 'Radiance'],     action: 'empower' },
  { number: 6,  name: 'Rhythmic',      hebrewName: 'קצבי',       keywords: ['Organize', 'Balance', 'Equality'],    action: 'organize' },
  { number: 7,  name: 'Resonant',      hebrewName: 'מהדהד',      keywords: ['Channel', 'Inspire', 'Attunement'],   action: 'channel' },
  { number: 8,  name: 'Galactic',      hebrewName: 'גלקטי',      keywords: ['Harmonize', 'Model', 'Integrity'],    action: 'harmonize' },
  { number: 9,  name: 'Solar',         hebrewName: 'שמשי',       keywords: ['Pulse', 'Realize', 'Intention'],      action: 'realize' },
  { number: 10, name: 'Planetary',     hebrewName: 'כוכבי',      keywords: ['Perfect', 'Produce', 'Manifestation'],action: 'perfect' },
  { number: 11, name: 'Spectral',      hebrewName: 'ספקטרלי',   keywords: ['Dissolve', 'Release', 'Liberation'],  action: 'dissolve' },
  { number: 12, name: 'Crystal',       hebrewName: 'קריסטלי',   keywords: ['Dedicate', 'Universalize', 'Cooperation'], action: 'dedicate' },
  { number: 13, name: 'Cosmic',        hebrewName: 'קוסמי',      keywords: ['Endure', 'Transcend', 'Presence'],    action: 'transcend' },
])

export function getTone(toneNumber: number): Tone {
  if (toneNumber < 1 || toneNumber > 13) {
    throw new RangeError(`Invalid tone number: ${toneNumber}`)
  }
  return TONES[toneNumber - 1]
}
