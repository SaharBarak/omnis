import type { Tone } from '../types/tone'

export const TONES: readonly Tone[] = Object.freeze([
  { number: 1,  name: 'Magnetic',      keywords: ['Unify', 'Attract', 'Purpose'],        action: 'unify' },
  { number: 2,  name: 'Lunar',         keywords: ['Polarize', 'Stabilize', 'Challenge'], action: 'polarize' },
  { number: 3,  name: 'Electric',      keywords: ['Activate', 'Bond', 'Service'],        action: 'activate' },
  { number: 4,  name: 'Self-Existing', keywords: ['Define', 'Measure', 'Form'],          action: 'define' },
  { number: 5,  name: 'Overtone',      keywords: ['Empower', 'Command', 'Radiance'],     action: 'empower' },
  { number: 6,  name: 'Rhythmic',      keywords: ['Organize', 'Balance', 'Equality'],    action: 'organize' },
  { number: 7,  name: 'Resonant',      keywords: ['Channel', 'Inspire', 'Attunement'],   action: 'channel' },
  { number: 8,  name: 'Galactic',      keywords: ['Harmonize', 'Model', 'Integrity'],    action: 'harmonize' },
  { number: 9,  name: 'Solar',         keywords: ['Pulse', 'Realize', 'Intention'],      action: 'realize' },
  { number: 10, name: 'Planetary',     keywords: ['Perfect', 'Produce', 'Manifestation'],action: 'perfect' },
  { number: 11, name: 'Spectral',      keywords: ['Dissolve', 'Release', 'Liberation'],  action: 'dissolve' },
  { number: 12, name: 'Crystal',       keywords: ['Dedicate', 'Universalize', 'Cooperation'], action: 'dedicate' },
  { number: 13, name: 'Cosmic',        keywords: ['Endure', 'Transcend', 'Presence'],    action: 'transcend' },
])

export function getTone(toneNumber: number): Tone {
  if (toneNumber < 1 || toneNumber > 13) {
    throw new RangeError(`Invalid tone number: ${toneNumber}`)
  }
  return TONES[toneNumber - 1]
}
