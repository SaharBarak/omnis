'use client'

import { useMemo } from 'react'
import {
  hijriDateParts,
  upcomingHijriHolidays,
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

const ACCENT = '#86C89B' // sage — the traditional green of Islamic ornament

const SPEC: CalendarSpec = {
  title: 'Hijri Calendar',
  subtitle: 'A purely lunar year that walks through the seasons, counted from the Hijra',
  accent: ACCENT,
  overview: [
    'The Hijri (Islamic) calendar is purely lunar: twelve lunar months, no leap month, no solar correction. Its year runs about 354 days — eleven days short of the solar year — so every Hijri date drifts earlier through the Gregorian calendar, circling the full cycle of seasons once every 33 years or so.',
    'That drift is not a defect but a feature of the design: Ramadan visits every season in a lifetime, falling in long summer days and short winter ones alike.',
    'Days begin at sunset, as in the Hebrew calendar. Years are counted from the Hijra — the Prophet Muhammad’s migration from Mecca to Medina in 622 CE — marked AH, Anno Hegirae.',
  ],
  history: [
    'Pre-Islamic Arabia used a lunisolar scheme with an intercalated month (nasi’). The Quran abolished intercalation, fixing the year at twelve lunar months, and the calendar has run purely lunar since.',
    'The era itself was instituted under the caliph Umar around 638 CE, when the growing administration needed a fixed year count. The community chose the Hijra — not a birth or a victory, but the founding migration — as year one.',
    'For most of history, months began with the sighting of the new crescent, and religious practice still honors observation: Ramadan and the Eids are proclaimed by moon-sighting committees in many countries, which is why observed dates can differ by a day from any computed calendar.',
  ],
  howItWorks: [
    'Months alternate between 30 and 29 days, tracking the mean lunar month of about 29.53 days. Eleven times in each 30-year cycle, a leap day is added to the final month, Dhu al-Hijjah, keeping the calendar aligned with the moon to within a day over centuries.',
    'The twelve months carry pre-Islamic names: Muharram, Safar, Rabi al-Awwal, Rabi al-Thani, Jumada al-Awwal, Jumada al-Thani, Rajab, Sha’ban, Ramadan, Shawwal, Dhu al-Qi’dah, Dhu al-Hijjah. Four of them — Muharram, Rajab, Dhu al-Qi’dah, Dhu al-Hijjah — are the sacred months of the Quran.',
    'Because the year is eleven days short, no Hijri month belongs to a season. A birthday in Ramadan returns to the same Gregorian date only after the full 33-year circuit.',
  ],
  calculation: [
    'Pleiad uses the Umm al-Qura calendar — the calculated calendar of Saudi Arabia, computed from the astronomical new moon at Mecca. It is the most widely used civil Hijri reckoning and what your device’s calendar arithmetic implements.',
    'A calculated calendar and a sighted moon can disagree by a day: computation places the month’s start at the astronomical conjunction criterion, while an actual sighting depends on weather, latitude, and the evening sky. For civil purposes the tabular date is standard; for ritual purposes many communities wait for the sighting.',
    'Conversions here are therefore exact within the Umm al-Qura system — and a day of grace applies to any religious observance.',
  ],
  concepts: [
    { term: 'Hijra', meaning: 'The migration to Medina in 622 CE — year one of the era' },
    { term: 'AH', meaning: 'Anno Hegirae — the year count from the Hijra' },
    { term: 'Hilal', meaning: 'The new crescent whose sighting opens the month' },
    { term: 'Umm al-Qura', meaning: 'The calculated calendar of Mecca that civil life runs on' },
    { term: 'Sacred months', meaning: 'Muharram, Rajab, Dhu al-Qi’dah, Dhu al-Hijjah' },
    { term: 'Nasi’', meaning: 'The abolished leap month that once tied the year to the sun' },
  ],
  modernUsage: [
    'The Hijri calendar is the civil calendar of Saudi Arabia and dates official documents across much of the Muslim world alongside the Gregorian calendar.',
    'Globally it governs the Islamic ritual year — Ramadan, the two Eids, the Hajj — for nearly two billion people, with dates announced nationally by moon-sighting authorities.',
  ],
  related: [
    { name: 'Hebrew', href: '/app/calendars/hebrew', relation: 'The same moon with a solar correction — lunisolar where the Hijri is purely lunar' },
    { name: 'Persian', href: '/app/calendars/persian', relation: 'The other calendar of the Islamic world — solar, with the same era count' },
    { name: 'Gregorian', relation: 'Purely solar — the civil frame the Hijri year drifts through' },
  ],
}

export default function HijriCalendarPage() {
  const today = useMemo(() => new Date(), [])
  const parts = useMemo(() => hijriDateParts(today), [today])
  const holidays = useMemo(() => upcomingHijriHolidays(today, 9), [today])

  return (
    <CalendarDetail
      spec={SPEC}
      hero={
        <WorldTodayHero
          parts={parts}
          next={holidays[0]}
          dayNote="the Hijri day began at sunset yesterday"
        />
      }
      explorer={
        <WorldConverter
          convert={hijriDateParts}
          footnote="Umm al-Qura reckoning — observed dates can differ by a day where the crescent is sighted."
        />
      }
      holidays={<WorldHolidays list={holidays} />}
    />
  )
}
