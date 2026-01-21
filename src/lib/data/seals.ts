import type { Seal } from '../types/seal'
import type { ColorFamily } from '../types/common'

function getSealColor(sealNumber: number): ColorFamily {
  const colorIndex = (sealNumber - 1) % 4
  const colors: ColorFamily[] = ['red', 'white', 'blue', 'yellow']
  return colors[colorIndex]
}

export const SEALS: readonly Seal[] = Object.freeze([
  { number: 1,  mayan: 'Imix',     english: 'Dragon',        color: getSealColor(1) },
  { number: 2,  mayan: 'Ik',       english: 'Wind',          color: getSealColor(2) },
  { number: 3,  mayan: 'Akbal',    english: 'Night',         color: getSealColor(3) },
  { number: 4,  mayan: 'Kan',      english: 'Seed',          color: getSealColor(4) },
  { number: 5,  mayan: 'Chicchan', english: 'Serpent',       color: getSealColor(5) },
  { number: 6,  mayan: 'Cimi',     english: 'World-Bridger', color: getSealColor(6) },
  { number: 7,  mayan: 'Manik',    english: 'Hand',          color: getSealColor(7) },
  { number: 8,  mayan: 'Lamat',    english: 'Star',          color: getSealColor(8) },
  { number: 9,  mayan: 'Muluc',    english: 'Moon',          color: getSealColor(9) },
  { number: 10, mayan: 'Oc',       english: 'Dog',           color: getSealColor(10) },
  { number: 11, mayan: 'Chuen',    english: 'Monkey',        color: getSealColor(11) },
  { number: 12, mayan: 'Eb',       english: 'Human',         color: getSealColor(12) },
  { number: 13, mayan: 'Ben',      english: 'Skywalker',     color: getSealColor(13) },
  { number: 14, mayan: 'Ix',       english: 'Wizard',        color: getSealColor(14) },
  { number: 15, mayan: 'Men',      english: 'Eagle',         color: getSealColor(15) },
  { number: 16, mayan: 'Cib',      english: 'Warrior',       color: getSealColor(16) },
  { number: 17, mayan: 'Caban',    english: 'Earth',         color: getSealColor(17) },
  { number: 18, mayan: 'Etznab',   english: 'Mirror',        color: getSealColor(18) },
  { number: 19, mayan: 'Cauac',    english: 'Storm',         color: getSealColor(19) },
  { number: 20, mayan: 'Ahau',     english: 'Sun',           color: getSealColor(20) },
])

export function getSeal(sealNumber: number): Seal {
  if (sealNumber < 1 || sealNumber > 20) {
    throw new RangeError(`Invalid seal number: ${sealNumber}`)
  }
  return SEALS[sealNumber - 1]
}
