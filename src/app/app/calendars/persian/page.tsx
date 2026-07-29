'use client'

import { useMemo } from 'react'
import {
  persianDateParts,
  upcomingPersianHolidays,
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

const ACCENT = '#D98E5F' // soft fire — Nowruz flames and Zoroastrian hearths

const SPEC: CalendarSpec = {
  title: 'Persian Calendar',
  subtitle: 'The most accurate solar calendar in civil use, opening each year at the spring equinox',
  accent: ACCENT,
  overview: [
    'The Persian (Solar Hijri) calendar is purely solar, and its new year is not a convention but an astronomical event: year one begins at Nowruz, the moment of the March equinox as observed on the meridian of Tehran.',
    'The first six months have 31 days, the next five have 30, and the last month has 29 — or 30 in a leap year. Seasons and months are locked together permanently: Farvardin is always the first month of spring, Azar always closes autumn.',
    'Years are counted from the Hijra, like the Islamic calendar — but in solar years, so the two counts drift apart by about one year every 33. The civil year 2026 spans Solar Hijri 1404 and 1405.',
  ],
  history: [
    'Iran has kept solar calendars for over 2,500 years. The Achaemenid empire used a Zoroastrian solar year of twelve 30-day months plus five gathered days; the month names still honor Zoroastrian divinities — Farvardin from the fravashis, Mehr from Mithra, Bahman from Vohu Manah.',
    'The great reform came in 1079 CE under the Seljuk sultan Malik-Shah: a commission of astronomers including Omar Khayyam fixed the year to the true equinox. The Jalali calendar they built was more accurate than the Gregorian reform that followed it by five centuries.',
    'The modern Solar Hijri calendar, codified in 1925, keeps the Jalali principle — equinox observation, not arithmetic approximation — and became the official calendar of Iran, and later Afghanistan.',
  ],
  howItWorks: [
    'The year begins on the day whose noon-to-noon window at Tehran contains the March equinox. Everything else follows from that single astronomical anchor.',
    'Because the anchor is observed rather than approximated, leap years fall out of the astronomy itself — usually every four years, occasionally after five. No simple division rule reproduces the pattern exactly; the equinox is the rule.',
    'This is what makes the calendar so accurate: the Gregorian year drifts from the sun by about one day in 3,300 years, while the equinox-anchored Persian year cannot drift at all.',
  ],
  calculation: [
    'Exact equinox observation requires an ephemeris, so calculated implementations use a 33-year leap cycle (with 29 and 37-year variants at the seams) that reproduces the astronomical calendar for centuries around the present.',
    'Pleiad reads Persian dates through the calendar arithmetic built into your device, which implements this standard algorithmic form — exact for every date you will ever pick here.',
    'The Afghan variant of the calendar uses the same structure with different month names (Hamal, Sawr, Jawza…) taken from the zodiac signs.',
  ],
  concepts: [
    { term: 'Nowruz', meaning: 'The March equinox — new year as an astronomical moment' },
    { term: 'Solar Hijri', meaning: 'Hijra-era year count, measured in solar years' },
    { term: 'Farvardin', meaning: 'The first month, named for the fravashis — guardian spirits' },
    { term: 'Jalali calendar', meaning: 'Khayyam’s 1079 reform that fixed the year to the equinox' },
    { term: 'Haft-sin', meaning: 'The Nowruz table of seven S’s — sprouts, apples, garlic, and more' },
    { term: 'Yalda', meaning: 'The longest night, kept with pomegranates and poetry' },
  ],
  modernUsage: [
    'The Solar Hijri calendar is the official calendar of Iran, dating everything from newspapers to contracts, and was Afghanistan’s official calendar until 2022.',
    'Nowruz itself is bigger than any border: some 300 million people from the Balkans to Central Asia keep the equinox new year, and the UN recognizes it as an international day.',
  ],
  related: [
    { name: 'Hijri', href: '/app/calendars/hijri', relation: 'Shares the era count — but lunar, so the two calendars drift a year apart every 33' },
    { name: 'Gregorian', relation: 'The other great solar calendar — arithmetic where the Persian is astronomical' },
    { name: 'Hebrew', href: '/app/calendars/hebrew', relation: 'Keeps its festivals in season by leap months rather than an equinox anchor' },
  ],
}

export default function PersianCalendarPage() {
  const today = useMemo(() => new Date(), [])
  const parts = useMemo(() => persianDateParts(today), [today])
  const holidays = useMemo(() => upcomingPersianHolidays(today, 6), [today])

  return (
    <CalendarDetail
      spec={SPEC}
      hero={
        <WorldTodayHero
          parts={parts}
          next={holidays[0]}
          dayNote="months locked to the seasons by the equinox"
        />
      }
      explorer={
        <WorldConverter
          convert={persianDateParts}
          footnote="Algorithmic Solar Hijri — exact for all civil dates, anchored to the Tehran equinox."
        />
      }
      holidays={<WorldHolidays list={holidays} />}
    />
  )
}
