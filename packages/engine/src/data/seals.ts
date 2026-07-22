import type { Seal } from '../types/seal'
import type { ColorFamily } from '../types/common'

function getSealColor(sealNumber: number): ColorFamily {
  const colorIndex = (sealNumber - 1) % 4
  const colors: ColorFamily[] = ['red', 'white', 'blue', 'yellow']
  return colors[colorIndex]
}

export const SEALS: readonly Seal[] = Object.freeze([
  { number: 1,  mayan: 'Imix',     english: 'Dragon',        hebrew: 'דרקון',         color: getSealColor(1) },
  { number: 2,  mayan: 'Ik',       english: 'Wind',          hebrew: 'רוח',           color: getSealColor(2) },
  { number: 3,  mayan: 'Akbal',    english: 'Night',         hebrew: 'לילה',          color: getSealColor(3) },
  { number: 4,  mayan: 'Kan',      english: 'Seed',          hebrew: 'זרע',           color: getSealColor(4) },
  { number: 5,  mayan: 'Chicchan', english: 'Serpent',       hebrew: 'נחש',           color: getSealColor(5) },
  { number: 6,  mayan: 'Cimi',     english: 'World-Bridger', hebrew: 'מגשר עולמות',   color: getSealColor(6) },
  { number: 7,  mayan: 'Manik',    english: 'Hand',          hebrew: 'יד',            color: getSealColor(7) },
  { number: 8,  mayan: 'Lamat',    english: 'Star',          hebrew: 'כוכב',          color: getSealColor(8) },
  { number: 9,  mayan: 'Muluc',    english: 'Moon',          hebrew: 'ירח',           color: getSealColor(9) },
  { number: 10, mayan: 'Oc',       english: 'Dog',           hebrew: 'כלב',           color: getSealColor(10) },
  { number: 11, mayan: 'Chuen',    english: 'Monkey',        hebrew: 'קוף',           color: getSealColor(11) },
  { number: 12, mayan: 'Eb',       english: 'Human',         hebrew: 'אדם',           color: getSealColor(12) },
  { number: 13, mayan: 'Ben',      english: 'Skywalker',     hebrew: 'הולך שמיים',    color: getSealColor(13) },
  { number: 14, mayan: 'Ix',       english: 'Wizard',        hebrew: 'קוסם',          color: getSealColor(14) },
  { number: 15, mayan: 'Men',      english: 'Eagle',         hebrew: 'נשר',           color: getSealColor(15) },
  { number: 16, mayan: 'Cib',      english: 'Warrior',       hebrew: 'לוחם',          color: getSealColor(16) },
  { number: 17, mayan: 'Caban',    english: 'Earth',         hebrew: 'אדמה',          color: getSealColor(17) },
  { number: 18, mayan: 'Etznab',   english: 'Mirror',        hebrew: 'מראה',          color: getSealColor(18) },
  { number: 19, mayan: 'Cauac',    english: 'Storm',         hebrew: 'סערה',          color: getSealColor(19) },
  { number: 20, mayan: 'Ahau',     english: 'Sun',           hebrew: 'שמש',           color: getSealColor(20) },
])

export function getSeal(sealNumber: number): Seal {
  if (sealNumber < 1 || sealNumber > 20) {
    throw new RangeError(`Invalid seal number: ${sealNumber}`)
  }
  return SEALS[sealNumber - 1]
}
