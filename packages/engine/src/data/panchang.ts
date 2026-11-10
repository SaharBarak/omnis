/**
 * The Panchang's five limbs and its lunar months, as names:
 *
 * - Tithis: the thirty of a lunation, each twelve degrees of the Moon's
 *   elongation from the Sun, fifteen in the bright half (Shukla paksha) to
 *   Purnima and fifteen in the dark (Krishna) to Amavasya
 *   (https://en.wikipedia.org/wiki/Tithi).
 * - Yogas: the twenty-seven spans of the sidereal Sun and Moon's summed
 *   longitudes, each 13°20′ (https://en.wikipedia.org/wiki/Panchangam).
 * - Karanas: the half-tithis, the seven movable run eight times from the
 *   second half of Shukla Pratipada, the four fixed at the lunation's ends
 *   (Kimstughna first; Shakuni, Chatushpada and Naga last); the seventh
 *   movable, Vishti (Bhadra), is the one avoided for undertakings
 *   (https://en.wikipedia.org/wiki/Karana_(pancanga)).
 * - Varas: the weekdays, each ruled by its planet in the planetary week.
 * - Months: the amanta months, new Moon to new Moon, each named for the
 *   rashi the Sun enters in it, so the month in which the Sun enters Mesha
 *   is Chaitra; a month the Sun enters no rashi in is adhika, the next
 *   month's name repeated before it
 *   (https://en.wikipedia.org/wiki/Hindu_calendar , "Lunar months").
 */

import type { PlanetId } from '../types/astrology'

/** The fourteen tithis each paksha shares, then its last: Purnima in the bright half, Amavasya in the dark. */
export const TITHI_NAMES: readonly (readonly [name: string, devanagari: string])[] = Object.freeze([
  ['Pratipada', 'प्रतिपदा'],
  ['Dwitiya', 'द्वितीया'],
  ['Tritiya', 'तृतीया'],
  ['Chaturthi', 'चतुर्थी'],
  ['Panchami', 'पञ्चमी'],
  ['Shashthi', 'षष्ठी'],
  ['Saptami', 'सप्तमी'],
  ['Ashtami', 'अष्टमी'],
  ['Navami', 'नवमी'],
  ['Dashami', 'दशमी'],
  ['Ekadashi', 'एकादशी'],
  ['Dwadashi', 'द्वादशी'],
  ['Trayodashi', 'त्रयोदशी'],
  ['Chaturdashi', 'चतुर्दशी'],
])

export const PURNIMA: readonly [string, string] = ['Purnima', 'पूर्णिमा']
export const AMAVASYA: readonly [string, string] = ['Amavasya', 'अमावस्या']

export const PAKSHAS = {
  Shukla: { devanagari: 'शुक्ल', words: 'the bright half, the Moon waxing' },
  Krishna: { devanagari: 'कृष्ण', words: 'the dark half, the Moon waning' },
} as const

export const YOGA_NAMES: readonly string[] = Object.freeze([
  'Vishkambha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana', 'Atiganda',
  'Sukarma', 'Dhriti', 'Shula', 'Ganda', 'Vriddhi', 'Dhruva', 'Vyaghata',
  'Harshana', 'Vajra', 'Siddhi', 'Vyatipata', 'Variyana', 'Parigha',
  'Shiva', 'Siddha', 'Sadhya', 'Shubha', 'Shukla', 'Brahma', 'Indra',
  'Vaidhriti',
])

export const MOVABLE_KARANAS: readonly string[] = Object.freeze(['Bava', 'Balava', 'Kaulava', 'Taitila', 'Garija', 'Vanija', 'Vishti'])

/** The fixed karanas: Kimstughna opens the lunation; Shakuni, Chatushpada and Naga close it. */
export const FIXED_KARANAS = { first: 'Kimstughna', last: ['Shakuni', 'Chatushpada', 'Naga'] } as const

/** The karana avoided for undertakings. */
export const VISHTI = 'Vishti'

export interface Vara {
  readonly name: string
  readonly devanagari: string
  readonly lord: PlanetId
  readonly lordName: string
}

/** The weekdays from Sunday, as Date numbers them. */
export const VARAS: readonly Vara[] = Object.freeze([
  { name: 'Ravivara', devanagari: 'रविवार', lord: 'sun', lordName: 'Sun' },
  { name: 'Somavara', devanagari: 'सोमवार', lord: 'moon', lordName: 'Moon' },
  { name: 'Mangalavara', devanagari: 'मंगलवार', lord: 'mars', lordName: 'Mars' },
  { name: 'Budhavara', devanagari: 'बुधवार', lord: 'mercury', lordName: 'Mercury' },
  { name: 'Guruvara', devanagari: 'गुरुवार', lord: 'jupiter', lordName: 'Jupiter' },
  { name: 'Shukravara', devanagari: 'शुक्रवार', lord: 'venus', lordName: 'Venus' },
  { name: 'Shanivara', devanagari: 'शनिवार', lord: 'saturn', lordName: 'Saturn' },
])

/** The lunar months by the rashi the Sun enters in them, from Mesha (0): Chaitra. */
export const LUNAR_MONTHS: readonly (readonly [name: string, devanagari: string])[] = Object.freeze([
  ['Chaitra', 'चैत्र'],
  ['Vaishakha', 'वैशाख'],
  ['Jyeshtha', 'ज्येष्ठ'],
  ['Ashadha', 'आषाढ'],
  ['Shravana', 'श्रावण'],
  ['Bhadrapada', 'भाद्रपद'],
  ['Ashvin', 'आश्विन'],
  ['Kartika', 'कार्तिक'],
  ['Margashirsha', 'मार्गशीर्ष'],
  ['Pausha', 'पौष'],
  ['Magha', 'माघ'],
  ['Phalguna', 'फाल्गुन'],
])

/** The word set before an adhika month's name. */
export const ADHIKA = 'Adhika'
