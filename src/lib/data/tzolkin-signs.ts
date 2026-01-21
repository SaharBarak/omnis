import type { TzolkinDaySign } from '../types/tzolkin'

// Traditional Tzolkin day signs (differs from Dreamspell for signs 6, 13, 14, 16)
export const TZOLKIN_SIGNS: readonly TzolkinDaySign[] = Object.freeze([
  { number: 1,  yucatec: 'Imix',     english: 'Crocodile' },
  { number: 2,  yucatec: "Ik'",      english: 'Wind' },
  { number: 3,  yucatec: "Ak'b'al",  english: 'Night' },
  { number: 4,  yucatec: "K'an",     english: 'Seed' },
  { number: 5,  yucatec: 'Chikchan', english: 'Serpent' },
  { number: 6,  yucatec: 'Kimi',     english: 'Death' },           // Dreamspell: World-Bridger
  { number: 7,  yucatec: "Manik'",   english: 'Deer' },
  { number: 8,  yucatec: 'Lamat',    english: 'Rabbit' },
  { number: 9,  yucatec: 'Muluk',    english: 'Water' },
  { number: 10, yucatec: 'Ok',       english: 'Dog' },
  { number: 11, yucatec: 'Chuwen',   english: 'Monkey' },
  { number: 12, yucatec: "Eb'",      english: 'Road' },
  { number: 13, yucatec: "B'en",     english: 'Reed' },            // Dreamspell: Skywalker
  { number: 14, yucatec: 'Ix',       english: 'Jaguar' },          // Dreamspell: Wizard
  { number: 15, yucatec: 'Men',      english: 'Eagle' },
  { number: 16, yucatec: "Kib'",     english: 'Owl' },             // Dreamspell: Warrior
  { number: 17, yucatec: "Kab'an",   english: 'Earth' },
  { number: 18, yucatec: "Etz'nab'", english: 'Flint' },
  { number: 19, yucatec: 'Kawak',    english: 'Storm' },
  { number: 20, yucatec: 'Ajaw',     english: 'Lord' },
])

export function getTzolkinSign(signNumber: number): TzolkinDaySign {
  if (signNumber < 1 || signNumber > 20) {
    throw new RangeError(`Invalid Tzolkin sign number: ${signNumber}`)
  }
  return TZOLKIN_SIGNS[signNumber - 1]
}
