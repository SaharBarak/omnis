import type { Seal } from '../types/seal.ts'
import type { Tone } from '../types/tone.ts'

// Seal actions for mantra templates
const SEAL_ACTIONS: Record<number, { english: string; hebrew: string }> = {
  1:  { english: 'nurture being',      hebrew: 'לטפח הוויה' },
  2:  { english: 'communicate spirit', hebrew: 'לתקשר רוח' },
  3:  { english: 'dream abundance',    hebrew: 'לחלום שפע' },
  4:  { english: 'target awareness',   hebrew: 'לכוון מודעות' },
  5:  { english: 'survive instinct',   hebrew: 'לשרוד אינסטינקט' },
  6:  { english: 'equalize death',     hebrew: 'לאזן מוות' },
  7:  { english: 'know healing',       hebrew: 'לדעת ריפוי' },
  8:  { english: 'beautify elegance',  hebrew: 'ליפות אלגנטיות' },
  9:  { english: 'purify flow',        hebrew: 'לטהר זרימה' },
  10: { english: 'love heart',         hebrew: 'לאהוב לב' },
  11: { english: 'play magic',         hebrew: 'לשחק קסם' },
  12: { english: 'influence wisdom',   hebrew: 'להשפיע חוכמה' },
  13: { english: 'explore space',      hebrew: 'לחקור מרחב' },
  14: { english: 'enchant timelessness', hebrew: 'להקסים נצחיות' },
  15: { english: 'create vision',      hebrew: 'ליצור חזון' },
  16: { english: 'question fearlessness', hebrew: 'לשאול חוסר פחד' },
  17: { english: 'evolve synchronicity', hebrew: 'להתפתח סינכרוניות' },
  18: { english: 'reflect endlessness',  hebrew: 'לשקף אינסופיות' },
  19: { english: 'catalyze energy',    hebrew: 'לזרז אנרגיה' },
  20: { english: 'enlighten life',     hebrew: 'להאיר חיים' },
}

export interface Mantra {
  hebrew: string
  english: string
}

export function generateMantra(seal: Seal, tone: Tone): Mantra {
  const sealAction = SEAL_ACTIONS[seal.number]

  const english = `I ${tone.action} in order to ${sealAction.english}`
  const hebrew = `אני ${tone.hebrewName} כדי ${sealAction.hebrew}`

  return { hebrew, english }
}
