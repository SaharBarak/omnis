'use client'

import { useMemo } from 'react'
import {
  chineseDateParts,
  chineseYear,
  upcomingChineseFestivals,
} from '@pleiad/engine/calculations'
import {
  CalendarDetail,
  type CalendarSpec,
} from '@/components/calendars/calendar-detail'
import {
  WorldConverter,
  WorldHolidays,
  WorldTodayHero,
} from '@/components/calendars/world-calendar-blocks'

const ACCENT = '#CF6F6F' // muted vermilion — the festival red, in the mural register

const SPEC: CalendarSpec = {
  title: 'Chinese Calendar',
  subtitle: 'A lunisolar count where every year carries an element, an animal, and a polarity',
  accent: ACCENT,
  overview: [
    'The Chinese calendar is lunisolar: months follow the moon, years follow the sun, and a leap month reconciles them. Its months are unnamed — numbered First through Twelfth — but its years carry names, cycling through sixty combinations of ten heavenly stems and twelve earthly branches.',
    'The stems carry the five elements (Wood, Fire, Earth, Metal, Water) in yin and yang pairs; the branches carry the twelve animals. 2026 is bing-wu — the year of the Yang Fire Horse.',
    'New year falls on the second or third new moon after the winter solstice — between 21 January and 20 February — and opens a fifteen-day festival that ends at the first full moon with lanterns.',
  ],
  history: [
    'Oracle bones from the Shang dynasty, three thousand years ago, already record the sexagenary day count — one of the oldest continuous counting systems on Earth. The stems and branches counted days for a millennium before they counted years.',
    'Calendar-making was an act of state: each dynasty issued its own calendar as proof of the Mandate of Heaven, and the Bureau of Astronomy refined the astronomy century by century. More than a hundred calendars were promulgated across Chinese history.',
    'The current rules — true astronomical new moons, computed for the meridian of Beijing — date to the Shixian calendar of 1645, prepared with the Jesuit astronomers of the Qing court.',
  ],
  howItWorks: [
    'A month begins at the astronomical new moon and runs 29 or 30 days. Twelve lunar months fall eleven days short of the sun, so seven times in nineteen years a leap month is inserted — the same Metonic arithmetic the Hebrew calendar uses, arrived at independently.',
    'Which month leaps is decided by the sun: the solar year is divided into twelve major solar terms (zhongqi), and a lunar month that contains none of them becomes a leap month, repeating the number of the month before it.',
    'The sexagenary cycle pairs stems and branches: Wood Rat, Fire Horse, Metal Monkey… sixty combinations before the cycle returns. Stems fix polarity — even stems are yang, odd are yin — so an animal is always yang or always yin.',
  ],
  calculation: [
    'Everything reduces to two astronomical series computed for UTC+8: new moons (month boundaries) and solar terms (leap-month placement and the agricultural year). No approximation rule — the modern calendar is defined directly by the astronomy.',
    'Pleiad reads Chinese dates through the calendar arithmetic built into your device, which implements these rules; the year’s stem-branch name and element derive from the year count by simple modular arithmetic.',
    'Note that Chinese astrology (BaZi) often uses the solar year — beginning at the Start of Spring term, around 4 February — rather than the lunar new year. The two boundaries differ by days to weeks.',
  ],
  concepts: [
    { term: 'Stems & branches', meaning: 'The 10 × 12 cycle — sixty year-names before repetition' },
    { term: 'Five elements', meaning: 'Wood, Fire, Earth, Metal, Water — carried by the stems in yin-yang pairs' },
    { term: 'Twelve animals', meaning: 'Rat through Pig — carried by the earthly branches' },
    { term: 'Leap month', meaning: 'A repeated month, placed wherever a lunar month misses a major solar term' },
    { term: 'Solar terms', meaning: 'Twenty-four stations of the sun that structure the agricultural year' },
    { term: 'Zodiac year', meaning: 'Your animal year returns every 12 — traditionally a year to be careful, not lucky' },
  ],
  modernUsage: [
    'China lives civil life on the Gregorian calendar, but the traditional calendar sets the great festivals — New Year, Qingming, Dragon Boat, Mid-Autumn — which are public holidays moving through the civil year.',
    'Across China and the diaspora the zodiac year remains personal identity: birth years are named, compatibilities weighed, and the new year’s animal marked worldwide. Korea and Vietnam keep sibling calendars with their own variations.',
  ],
  related: [
    { name: 'Hebrew', href: '/app/calendars/hebrew', relation: 'The same lunisolar problem — leap months by the Metonic cycle rather than solar terms' },
    { name: 'Panchang', href: '/app/calendars/panchang', relation: 'The other great lunisolar tradition — India counts the same sun and moon in different limbs' },
    { name: 'Gregorian', relation: 'The civil frame the festivals move through' },
  ],
}

export default function ChineseCalendarPage() {
  const today = useMemo(() => new Date(), [])
  const parts = useMemo(() => chineseDateParts(today), [today])
  const year = useMemo(() => chineseYear(today), [today])
  const festivals = useMemo(() => upcomingChineseFestivals(today, 8), [today])

  return (
    <CalendarDetail
      spec={SPEC}
      hero={
        <WorldTodayHero
          parts={parts}
          next={festivals[0]}
          dayNote={year ? `year of the ${year.polarity} ${year.name}` : undefined}
        />
      }
      explorer={
        <WorldConverter
          convert={chineseDateParts}
          footnote="Astronomical new moons at UTC+8 — leap months surface as a repeated month."
        />
      }
      holidays={<WorldHolidays list={festivals} />}
      holidaysEyebrow="Festivals"
    />
  )
}
