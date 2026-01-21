import type { Tone } from '../types/tone'

export const TONES: readonly Tone[] = Object.freeze([
  { number: 1,  name: 'Magnetic',      nameHebrew: 'מגנטי',      keywords: ['Unify', 'Attract', 'Purpose'],        action: 'unify' },
  { number: 2,  name: 'Lunar',         nameHebrew: 'ירחי',       keywords: ['Polarize', 'Stabilize', 'Challenge'], action: 'polarize' },
  { number: 3,  name: 'Electric',      nameHebrew: 'חשמלי',      keywords: ['Activate', 'Bond', 'Service'],        action: 'activate' },
  { number: 4,  name: 'Self-Existing', nameHebrew: 'קיים-עצמי', keywords: ['Define', 'Measure', 'Form'],          action: 'define' },
  { number: 5,  name: 'Overtone',      nameHebrew: 'על-טון',     keywords: ['Empower', 'Command', 'Radiance'],     action: 'empower' },
  { number: 6,  name: 'Rhythmic',      nameHebrew: 'קצבי',       keywords: ['Organize', 'Balance', 'Equality'],    action: 'organize' },
  { number: 7,  name: 'Resonant',      nameHebrew: 'מהדהד',      keywords: ['Channel', 'Inspire', 'Attunement'],   action: 'channel' },
  { number: 8,  name: 'Galactic',      nameHebrew: 'גלקטי',      keywords: ['Harmonize', 'Model', 'Integrity'],    action: 'harmonize' },
  { number: 9,  name: 'Solar',         nameHebrew: 'שמשי',       keywords: ['Pulse', 'Realize', 'Intention'],      action: 'realize' },
  { number: 10, name: 'Planetary',     nameHebrew: 'כוכבי',      keywords: ['Perfect', 'Produce', 'Manifestation'],action: 'perfect' },
  { number: 11, name: 'Spectral',      nameHebrew: 'ספקטרלי',    keywords: ['Dissolve', 'Release', 'Liberation'],  action: 'dissolve' },
  { number: 12, name: 'Crystal',       nameHebrew: 'קריסטלי',    keywords: ['Dedicate', 'Universalize', 'Cooperation'], action: 'dedicate' },
  { number: 13, name: 'Cosmic',        nameHebrew: 'קוסמי',      keywords: ['Endure', 'Transcend', 'Presence'],    action: 'transcend' },
])

export function getTone(toneNumber: number): Tone {
  if (toneNumber < 1 || toneNumber > 13) {
    throw new RangeError(`Invalid tone number: ${toneNumber}`)
  }
  return TONES[toneNumber - 1]
}
