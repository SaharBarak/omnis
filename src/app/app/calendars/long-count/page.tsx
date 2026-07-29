'use client'

import { useMemo, useState } from 'react'
import {
  HISTORICAL_DATES,
  dateToLongCount,
  daysSinceCreation,
  formatLongCount,
  getLongCountData,
} from '@pleiad/engine/calculations'
import {
  CalendarDetail,
  type CalendarSpec,
} from '@/components/calendars/calendar-detail'
import { DataRow, getFlavor } from '@/components/app-kit'
import { Input } from '@/components/ui/input'

const ACCENT = getFlavor('tzolkin').accent // Maya codex green

const SPEC: CalendarSpec = {
  title: 'Maya Long Count',
  subtitle: 'A day count from a mythological zero — the calendar that carved history in stone',
  accent: ACCENT,
  overview: [
    'The Long Count is not a cycle but a tally: an absolute count of days from a creation date in 3114 BCE, written as five nested place values — baktun, katun, tun, winal, kin. Today is a five-number address in a river of days more than 1.87 million long.',
    'Where the Tzolkin and Haab wheel around every 260 and 365 days, the Long Count never repeats on a human timescale — which is exactly why the Maya used it to fix historical events uniquely in time, the way we use a year number.',
    'The famous 13.0.0.0.0 of 21 December 2012 was the completion of the thirteenth baktun — a great odometer rollover, celebrated in antiquity as period endings always were, with monuments rather than apocalypses.',
  ],
  history: [
    'The count is older than the Classic Maya: the earliest Long Count dates appear on monuments in the first century BCE, in the Epi-Olmec sphere. The Maya inherited the system and perfected it.',
    'Classic-period stelae open with the Initial Series — a Long Count date followed by the day’s Tzolkin and Haab positions — anchoring coronations, wars, and dedications to the exact day, a precision unmatched in the ancient world.',
    'The count fell silent with the Classic collapse; the Postclassic books kept a Short Count of katuns instead. Modern scholarship recovered the full correlation between Long Count and European dates through the colonial chronicles and astronomical inscriptions.',
  ],
  howItWorks: [
    'The places are almost pure base-20: 20 kin make a winal, 18 winals a tun (360 days — close to the solar year), 20 tuns a katun (about 19.7 years), 20 katuns a baktun (about 394 years). The 18 keeps the tun near the sun.',
    'A date like 13.0.13.14.5 reads right to left: 5 kin, 14 winals, 13 tuns, 0 katuns, 13 baktuns since creation.',
    'Every Long Count day also carries its positions in the two wheels: the 260-day Tzolkin and the 365-day Haab. A Tzolkin-Haab pair — the Calendar Round — recurs only every 52 years, so the three systems together identify any day for millennia.',
  ],
  calculation: [
    'Conversion is pure arithmetic on the Julian Day Number: the creation date 0.0.0.0.0 corresponds to JDN 584283 (6 September 3114 BCE in the proleptic Gregorian calendar) — the GMT correlation, standard since Thompson.',
    'Gregorian date → JDN → subtract the correlation constant → decompose the remainder into baktun, katun, tun, winal, kin. The Tzolkin and Haab positions fall out of the same day number by modular arithmetic.',
    'Pleiad computes all of this exactly — every conversion on this page is day-precise across the whole historical range.',
  ],
  concepts: [
    { term: 'Kin', meaning: 'One day — the count’s atom' },
    { term: 'Winal', meaning: '20 kin — the Maya "month"' },
    { term: 'Tun', meaning: '18 winals = 360 days — the computational year' },
    { term: 'Katun', meaning: '20 tuns ≈ 19.7 years — the unit of Maya politics' },
    { term: 'Baktun', meaning: '20 katuns ≈ 394 years — thirteen completed in 2012' },
    { term: 'Calendar Round', meaning: 'The 52-year dance of Tzolkin and Haab' },
    { term: 'GMT correlation', meaning: 'JDN 584283 — the accepted anchor to European dates' },
    { term: 'Initial Series', meaning: 'The full date formula that opens Classic inscriptions' },
  ],
  modernUsage: [
    'Epigraphers date every Classic Maya inscription by its Long Count, and the 2012 period ending brought the count brief global fame — misread as an ending, when the inscriptions themselves calmly project dates far beyond it.',
    'Contemporary Maya communities keep the Tzolkin ceremonially, and the Dreamspell — which Pleiad reads daily — is a modern reinterpretation built on the same 260-day wheel, anchored to its own 1987 epoch.',
  ],
  related: [
    { name: 'Tzolkin', href: '/learn/tzolkin', relation: 'The 260-day sacred wheel every Long Count day also carries' },
    { name: 'Dreamspell', href: '/app/calendar', relation: 'The modern 13-Moon reading of the Tzolkin that Pleiad tracks daily' },
    { name: 'Hebrew', href: '/app/calendars/hebrew', relation: 'The other calendar counting from a creation epoch' },
  ],
}

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

function TodayHero() {
  const todayStr = useMemo(() => toDateStr(new Date()), [])
  const data = useMemo(() => getLongCountData(todayStr), [todayStr])

  const rows = [
    { label: 'Tzolkin', value: `${data.tzolkin.tone} ${data.tzolkin.daySign.yucatec} — ${data.tzolkin.daySign.english}` },
    { label: 'Haab', value: `${data.haab.day} ${data.haab.monthName}` },
    { label: 'Calendar Round', value: data.calendarRound.formatted },
    { label: 'Days since creation', value: data.daysSinceCreation.toLocaleString('en-GB') },
  ]

  return (
    <div className="feature-card p-6">
      <div className="font-display text-3xl tracking-tight text-brand-bright md:text-4xl">
        {formatLongCount(data.longCount)}
      </div>
      <p className="mt-1 text-sm text-white/50">
        {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        {' · '}GMT correlation, day-precise
      </p>
      <div className="mt-4">
        {rows.map((row, i) => (
          <DataRow key={row.label} label={row.label} value={row.value} last={i === rows.length - 1} />
        ))}
      </div>
    </div>
  )
}

function Converter() {
  const [value, setValue] = useState(() => toDateStr(new Date()))
  const converted = useMemo(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
    return {
      formatted: formatLongCount(dateToLongCount(value)),
      days: daysSinceCreation(value),
    }
  }, [value])

  return (
    <div className="surface-card p-5">
      <label htmlFor="lc-date-in" className="mb-2 block text-sm text-white/70">
        Pick any civil date
      </label>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Input
          id="lc-date-in"
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
        {converted
          ? `${converted.days.toLocaleString('en-GB')} days since 0.0.0.0.0 — exact arithmetic on the Julian Day Number.`
          : 'Exact arithmetic on the Julian Day Number.'}
      </p>
    </div>
  )
}

function NotableDates() {
  return (
    <div className="surface-card p-5">
      {HISTORICAL_DATES.map((h, i) => (
        <DataRow
          key={h.longCount}
          label={h.longCount}
          value={`${h.tzolkin} · ${h.haab} · ${new Date(`${h.gregorian}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
          detail={h.significance}
          last={i === HISTORICAL_DATES.length - 1}
        />
      ))}
    </div>
  )
}

export default function LongCountPage() {
  return (
    <CalendarDetail
      spec={SPEC}
      hero={<TodayHero />}
      explorer={<Converter />}
      holidays={<NotableDates />}
      holidaysEyebrow="Notable dates"
    />
  )
}
