import type { Seal } from '../types/seal'
import type { Tone } from '../types/tone'
import type { SealNumber } from '../types/branded'
import { getGuide } from './oracle-tables'

// Seal data for Dreamspell affirmations (from José Argüelles' Dreamspell)
const SEAL_DATA: Record<number, { power: string; action: string; essence: string }> = {
  1:  { power: 'Birth',         action: 'nurture',     essence: 'Being' },
  2:  { power: 'Spirit',        action: 'communicate', essence: 'Breath' },
  3:  { power: 'Abundance',     action: 'dream',       essence: 'Intuition' },
  4:  { power: 'Flowering',     action: 'target',      essence: 'Awareness' },
  5:  { power: 'Life Force',    action: 'survive',     essence: 'Instinct' },
  6:  { power: 'Death',         action: 'equalize',    essence: 'Opportunity' },
  7:  { power: 'Accomplishment', action: 'know',       essence: 'Healing' },
  8:  { power: 'Elegance',      action: 'beautify',    essence: 'Art' },
  9:  { power: 'Universal Water', action: 'purify',    essence: 'Flow' },
  10: { power: 'Heart',         action: 'love',        essence: 'Loyalty' },
  11: { power: 'Magic',         action: 'play',        essence: 'Illusion' },
  12: { power: 'Free Will',     action: 'influence',   essence: 'Wisdom' },
  13: { power: 'Space',         action: 'explore',     essence: 'Wakefulness' },
  14: { power: 'Timelessness',  action: 'enchant',     essence: 'Receptivity' },
  15: { power: 'Vision',        action: 'create',      essence: 'Mind' },
  16: { power: 'Intelligence',  action: 'question',    essence: 'Fearlessness' },
  17: { power: 'Navigation',    action: 'evolve',      essence: 'Synchronicity' },
  18: { power: 'Endlessness',   action: 'reflect',     essence: 'Order' },
  19: { power: 'Self-Generation', action: 'catalyze',  essence: 'Energy' },
  20: { power: 'Universal Fire', action: 'enlighten',  essence: 'Life' },
}

// Tone data for Dreamspell affirmations
const TONE_DATA: Record<number, { action: string; essence: string; power: string }> = {
  1:  { action: 'Unify',       essence: 'Attracting',    power: 'Purpose' },
  2:  { action: 'Polarize',    essence: 'Stabilizing',   power: 'Challenge' },
  3:  { action: 'Activate',    essence: 'Bonding',       power: 'Service' },
  4:  { action: 'Define',      essence: 'Measuring',     power: 'Form' },
  5:  { action: 'Empower',     essence: 'Commanding',    power: 'Radiance' },
  6:  { action: 'Organize',    essence: 'Balancing',     power: 'Equality' },
  7:  { action: 'Channel',     essence: 'Inspiring',     power: 'Attunement' },
  8:  { action: 'Harmonize',   essence: 'Modeling',      power: 'Integrity' },
  9:  { action: 'Pulse',       essence: 'Realizing',     power: 'Intention' },
  10: { action: 'Perfect',     essence: 'Producing',     power: 'Manifestation' },
  11: { action: 'Dissolve',    essence: 'Releasing',     power: 'Liberation' },
  12: { action: 'Dedicate',    essence: 'Universalizing', power: 'Cooperation' },
  13: { action: 'Endure',      essence: 'Transcending',  power: 'Presence' },
}

// Wavespell type based on seal color
const WAVESPELL_TYPE: Record<string, string> = {
  red: 'Input',
  white: 'Store',
  blue: 'Output',
  yellow: 'Matrix',
}

export function generateMantra(seal: Seal, tone: Tone): string {
  const sealData = SEAL_DATA[seal.number]
  const toneData = TONE_DATA[tone.number]
  const wavespell = WAVESPELL_TYPE[seal.color]

  // Line 5: Guide reference per DREAMSPELL_SPEC.md lines 180, 198, 207
  // For tones 1, 6, 11: Guide = Kin, so say "my own power doubled"
  // For other tones: Reference Guide seal's power
  let guideLine: string
  if (tone.number === 1 || tone.number === 6 || tone.number === 11) {
    guideLine = 'I am guided by my own power doubled'
  } else {
    const guideSeal = getGuide(seal.number as SealNumber, tone.number)
    const guideData = SEAL_DATA[guideSeal]
    guideLine = `I am guided by the power of ${guideData.power.toLowerCase()}`
  }

  // Standard Dreamspell 5-line affirmation format
  const lines = [
    `I ${toneData.action.toLowerCase()} in order to ${sealData.action}`,
    `${toneData.essence} ${sealData.essence.toLowerCase()}`,
    `I seal the ${wavespell.toLowerCase()} of ${sealData.power.toLowerCase()}`,
    `With the ${tone.name.toLowerCase()} tone of ${toneData.power.toLowerCase()}`,
    guideLine
  ]

  return lines.join('\n')
}
