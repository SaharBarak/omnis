'use client'

import { useMemo, useState } from 'react'
import {
  hebrewDateParts,
  upcomingHebrewHolidays,
} from '@pleiad/engine/calculations'
import {
  CalendarDetail,
  type CalendarSpec,
} from '@/components/calendars/calendar-detail'
import { DataRow, Notice, getFlavor } from '@/components/app-kit'
import { Input } from '@/components/ui/input'

const ACCENT = getFlavor('gematria').accent // the Hebrew-tradition gold

const SPEC: CalendarSpec = {
  title: 'Hebrew Calendar',
  subtitle: 'A lunisolar count in its 58th century, still setting the rhythm of Jewish life',
  accent: ACCENT,
  overview: [
    'The Hebrew calendar is lunisolar: months follow the moon, years follow the sun. Each month begins near the new moon, and the year carries twelve months — or thirteen in leap years — so the festivals stay tied to their seasons: Passover in spring, Sukkot in autumn.',
    'Days run from sunset to sunset, not midnight to midnight. A Hebrew date begins the evening before its civil counterpart — Shabbat enters on Friday night.',
    'Years are counted from the traditional date of creation (Anno Mundi). The civil year 2026 spans the Hebrew years 5786 and 5787.',
  ],
  history: [
    'In the biblical period, months were declared by observation: witnesses saw the new crescent and the court in Jerusalem proclaimed the new month, relaying it by hilltop fires and messengers. Festival dates literally depended on who saw the moon.',
    'As the diaspora spread and communication with Jerusalem grew precarious, observation became untenable. In the fourth century CE — tradition credits Hillel II, around 358/359 — the calendar was fixed by calculation. The rules published then are, with minor refinement through the geonic period, the ones still in use today.',
    'The month names themselves — Nisan, Tammuz, Elul — are Babylonian, carried back from the exile in the sixth century BCE. Earlier biblical texts number the months or use older Canaanite names like Aviv.',
  ],
  howItWorks: [
    'A month is either 29 or 30 days, tracking the mean lunar month of about 29.53 days. A common year has 12 months (353–355 days); a leap year adds a thirteenth month for 383–385 days.',
    'Leap years follow the 19-year Metonic cycle: years 3, 6, 8, 11, 14, 17, and 19 of each cycle are leap years — seven in every nineteen. Nineteen solar years and 235 lunar months differ by only about two hours, which is what keeps Passover in spring indefinitely.',
    'In a leap year the added month is a second Adar: the ordinary Adar becomes Adar I, and the festivals of Adar — Purim above all — move to Adar II, keeping them a month before Passover.',
  ],
  calculation: [
    'The fixed calendar computes the molad — the mean lunar conjunction — for Tishri of each year, counted in days, hours, and 1080ths of an hour (chalakim) from a fixed epoch. Rosh Hashanah falls on or near that molad.',
    'Four postponement rules (dechiyot) then adjust the day: Rosh Hashanah may not fall on Sunday, Wednesday, or Friday (which would place Yom Kippur adjacent to Shabbat or Hoshana Rabbah on Shabbat), and further rules bound the year lengths. The slack is absorbed by Heshvan and Kislev, each of which can take 29 or 30 days.',
    'Pleiad reads Hebrew dates through the calendar arithmetic built into your device (the same fixed rules), so conversions are exact, not approximate.',
  ],
  concepts: [
    { term: 'Molad', meaning: 'The calculated mean new moon that anchors each month' },
    { term: 'Chalakim', meaning: '1080ths of an hour — the calendar’s unit of lunar precision' },
    { term: 'Metonic cycle', meaning: '19 years, 7 of them leap — the sun and moon reconciled' },
    { term: 'Adar I / Adar II', meaning: 'The doubled month that makes a leap year' },
    { term: 'Dechiyot', meaning: 'Postponement rules that place Rosh Hashanah' },
    { term: 'Rosh Chodesh', meaning: 'The new-moon day that opens every month' },
    { term: 'Anno Mundi', meaning: 'Year count from the traditional date of creation' },
  ],
  modernUsage: [
    'The Hebrew calendar is an official calendar of the State of Israel: it dates official documents alongside the Gregorian calendar, sets national holidays and memorial days, and appears daily in print and broadcast.',
    'Worldwide, it governs the Jewish ritual year — festivals, Torah readings, bar and bat mitzvah dates, yahrzeits — and personal milestones are still reckoned by it even in communities that live civil life on the Gregorian calendar.',
  ],
  related: [
    { name: 'Islamic (Hijri)', relation: 'Purely lunar — the same moon without solar correction, so its months migrate through the seasons' },
    { name: 'Babylonian', relation: 'Source of the month names and much of the lunisolar machinery, absorbed during the exile' },
    { name: 'Gregorian', relation: 'Purely solar — the civil frame the Hebrew calendar runs beside' },
    { name: 'Gematria', href: '/app', relation: 'The Hebrew letters that write these dates also carry the number system Pleiad reads names with' },
  ],
}

function TodayHero() {
  const today = useMemo(() => new Date(), [])
  const parts = useMemo(() => hebrewDateParts(today), [today])
  const next = useMemo(() => upcomingHebrewHolidays(today, 1)[0], [today])

  if (!parts) return <Notice variant="info">This device lacks Hebrew calendar data.</Notice>

  return (
    <div className="feature-card p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="font-display text-3xl tracking-tight text-brand-bright md:text-4xl">
            {parts.formatted}
          </div>
          <p className="mt-1 text-sm text-white/50">
            {today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {' · '}the Hebrew day began at sunset yesterday
          </p>
        </div>
        {next && (
          <div className="text-sm text-white/70">
            <span className="text-white/50">Next: </span>
            {next.holiday.name}
            <span className="text-white/50">
              {' '}
              ({next.hebrewDate}) — {next.inDays === 0 ? 'today' : `in ${next.inDays} days`}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function Converter() {
  const [value, setValue] = useState(() => new Date().toISOString().split('T')[0])
  const converted = useMemo(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
    return hebrewDateParts(new Date(`${value}T12:00:00Z`))
  }, [value])

  return (
    <div className="surface-card p-5">
      <label htmlFor="hebrew-date-in" className="mb-2 block text-sm text-white/70">
        Pick any civil date
      </label>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Input
          id="hebrew-date-in"
          type="date"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-fit"
        />
        <div className="font-display text-xl tracking-tight text-brand-bright">
          {converted ? converted.formatted : '—'}
        </div>
      </div>
      <p className="mt-3 text-xs text-white/35">
        Conversion is exact — the fixed calendar of Hillel II, as carried by your device.
      </p>
    </div>
  )
}

function Holidays() {
  const today = useMemo(() => new Date(), [])
  const list = useMemo(() => upcomingHebrewHolidays(today, 11), [today])
  return (
    <div className="surface-card p-5">
      {list.map((h, i) => (
        <DataRow
          key={`${h.holiday.name}-${h.date}`}
          label={h.holiday.name}
          value={`${h.hebrewDate} · ${new Date(`${h.date}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} · ${h.inDays === 0 ? 'today' : `in ${h.inDays} days`}`}
          detail={h.holiday.note}
          last={i === list.length - 1}
        />
      ))}
    </div>
  )
}

export default function HebrewCalendarPage() {
  return (
    <CalendarDetail
      spec={SPEC}
      hero={<TodayHero />}
      explorer={<Converter />}
      holidays={<Holidays />}
    />
  )
}
