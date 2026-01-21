import type { TzolkinDaySign } from '../types/tzolkin'

// Traditional Tzolkin day signs (differs from Dreamspell for signs 6, 13, 14, 16)
export const TZOLKIN_SIGNS: readonly TzolkinDaySign[] = Object.freeze([
  { number: 1,  yucatec: 'Imix',     english: 'Crocodile', hebrew: 'תנין' },
  { number: 2,  yucatec: "Ik'",      english: 'Wind',      hebrew: 'רוח' },
  { number: 3,  yucatec: "Ak'b'al",  english: 'Night',     hebrew: 'לילה' },
  { number: 4,  yucatec: "K'an",     english: 'Seed',      hebrew: 'זרע' },
  { number: 5,  yucatec: 'Chikchan', english: 'Serpent',   hebrew: 'נחש' },
  { number: 6,  yucatec: 'Kimi',     english: 'Death',     hebrew: 'מוות' },           // Dreamspell: World-Bridger
  { number: 7,  yucatec: "Manik'",   english: 'Deer',      hebrew: 'אייל' },
  { number: 8,  yucatec: 'Lamat',    english: 'Rabbit',    hebrew: 'ארנב' },
  { number: 9,  yucatec: 'Muluk',    english: 'Water',     hebrew: 'מים' },
  { number: 10, yucatec: 'Ok',       english: 'Dog',       hebrew: 'כלב' },
  { number: 11, yucatec: 'Chuwen',   english: 'Monkey',    hebrew: 'קוף' },
  { number: 12, yucatec: "Eb'",      english: 'Road',      hebrew: 'דרך' },
  { number: 13, yucatec: "B'en",     english: 'Reed',      hebrew: 'קנה' },            // Dreamspell: Skywalker
  { number: 14, yucatec: 'Ix',       english: 'Jaguar',    hebrew: 'יגואר' },          // Dreamspell: Wizard
  { number: 15, yucatec: 'Men',      english: 'Eagle',     hebrew: 'נשר' },
  { number: 16, yucatec: "Kib'",     english: 'Owl',       hebrew: 'ינשוף' },          // Dreamspell: Warrior
  { number: 17, yucatec: "Kab'an",   english: 'Earth',     hebrew: 'אדמה' },
  { number: 18, yucatec: "Etz'nab'", english: 'Flint',     hebrew: 'צור' },
  { number: 19, yucatec: 'Kawak',    english: 'Storm',     hebrew: 'סערה' },
  { number: 20, yucatec: 'Ajaw',     english: 'Lord',      hebrew: 'אדון' },
])

export function getTzolkinSign(signNumber: number): TzolkinDaySign {
  if (signNumber < 1 || signNumber > 20) {
    throw new RangeError(`Invalid Tzolkin sign number: ${signNumber}`)
  }
  return TZOLKIN_SIGNS[signNumber - 1]
}
