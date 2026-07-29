'use client'

import { useMemo, useState } from 'react'
import { panchang, siderealSun, type Panchang } from '@pleiad/engine/calculations'
import {
  CalendarDetail,
  type CalendarSpec,
} from '@/components/calendars/calendar-detail'
import { DataRow, getFlavor } from '@/components/app-kit'
import { Input } from '@/components/ui/input'

const ACCENT = getFlavor('astrology').accent // jyotisha is Vedic astrology — same gold

const SPEC: CalendarSpec = {
  title: 'Panchang',
  subtitle: 'The Hindu almanac of five limbs — a calendar that measures qualities of time, not just quantities',
  accent: ACCENT,
  overview: [
    'A panchang (pancha-anga, "five limbs") is the daily almanac of Hindu timekeeping. Where other calendars answer "what day is it," the panchang answers "what kind of day is it" — through five simultaneous cycles: tithi, nakshatra, yoga, karana, and vara.',
    'The tithi is the headline: thirty lunar days per month, fifteen in the waxing bright half (shukla paksha) and fifteen in the waning dark half (krishna paksha). Nearly every Hindu festival is a tithi — Diwali is a new-moon tithi, Holi a full-moon one.',
    'The nakshatra is the moon’s mansion — twenty-seven star-stations it visits in its monthly circuit — central to Vedic astrology, where your birth nakshatra matters more than your sun sign.',
  ],
  history: [
    'The roots are in the Vedanga Jyotisha, the astronomical limb of the Vedas, from the middle of the first millennium BCE — tithis and nakshatras were already the working units of ritual time.',
    'The classical siddhantas — above all the Surya Siddhanta — put the almanac on mathematical footing, computing the true longitudes of sun and moon. Regional traditions diverged into the many pancangas of India, but the five limbs are universal.',
    'India runs many calendars at once: lunisolar calendars (amanta in the south, purnimanta in the north), the solar calendars of Tamil Nadu and Bengal, and the civil Saka calendar. The panchang is the layer they all share.',
  ],
  howItWorks: [
    'Tithi: the time the moon needs to gain 12° on the sun. Thirty tithis make a lunar month; each can be shorter or longer than a civil day, so tithis skip and repeat against the calendar — the almanac tells you which one rules today.',
    'Nakshatra: the sidereal sky cut into 27 arcs of 13°20′; the moon’s current arc names the day’s mansion. Yoga: 27 divisions of the *sum* of solar and lunar longitudes. Karana: half a tithi, eleven names — seven moving, four fixed. Vara: the ordinary weekday, Ravivara to Shanivara.',
    'Together the five limbs classify each day for undertakings: some combinations are auspicious (muhurta), others to be avoided — the panchang is consulted before weddings, journeys, and openings to this day.',
  ],
  calculation: [
    'Everything reduces to two numbers: the ecliptic longitudes of the sun and moon. Tithi and karana come from their difference, yoga from their sum, nakshatra from the moon’s sidereal position.',
    'Sidereal positions subtract the ayanamsa — the accumulated precession offset, about 24° today — from tropical longitudes. Pleiad uses the Lahiri ayanamsa, the Indian government standard.',
    'Pleiad computes the limbs from its ephemeris at noon UTC for the picked date. Traditional almanacs anchor the day at local sunrise instead, so a limb that changes mid-morning can differ between this page and a printed panchang — sign-level agreement, not observatory minutes.',
  ],
  concepts: [
    { term: 'Tithi', meaning: 'A lunar day — 12° of moon-sun separation; the unit festivals are set by' },
    { term: 'Paksha', meaning: 'The bright (shukla) and dark (krishna) halves of the lunar month' },
    { term: 'Nakshatra', meaning: 'The moon’s mansion — 27 star-stations of the sidereal sky' },
    { term: 'Yoga', meaning: '27 divisions of the sun-moon longitude sum' },
    { term: 'Karana', meaning: 'Half a tithi — seven movable names and four fixed ones' },
    { term: 'Vara', meaning: 'The weekday, ruled by its planet — Ravivara is the sun’s day' },
    { term: 'Muhurta', meaning: 'An auspicious window chosen by weighing all five limbs' },
    { term: 'Ayanamsa', meaning: 'The precession offset separating sidereal from tropical zodiacs' },
  ],
  modernUsage: [
    'Panchang apps and printed almanacs are consulted daily across India and the diaspora — for festival dates, fasting days like Ekadashi, and muhurta timings for weddings and new ventures.',
    'The great festivals ride its cycles: Diwali on the Kartika new moon, Holi on the Phalguna full moon, Navaratri opening the bright half of Ashvina. Government of India ephemerides publish the official Lahiri-based reckoning.',
  ],
  related: [
    { name: 'Astrology', href: '/learn/astrology', relation: 'Western astrology reads the same sky tropically; jyotisha reads it sidereally' },
    { name: 'Chinese', href: '/app/calendars/chinese', relation: 'The other great lunisolar tradition — solar terms where India uses tithis' },
    { name: 'Hebrew', href: '/app/calendars/hebrew', relation: 'Also lunisolar, also festival-bearing — the moon corrected to the sun' },
  ],
}

function limbs(p: Panchang, sun: { sign: string; degree: number }) {
  return [
    { label: 'Tithi', value: p.tithi },
    { label: 'Nakshatra', value: p.nakshatra },
    { label: 'Yoga', value: p.yoga },
    { label: 'Karana', value: p.karana },
    { label: 'Vara', value: p.vara },
    { label: 'Sidereal sun', value: `${sun.sign} ${sun.degree}°` },
  ]
}

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

function TodayHero() {
  const todayStr = useMemo(() => toDateStr(new Date()), [])
  const p = useMemo(() => panchang(todayStr), [todayStr])
  const sun = useMemo(() => siderealSun(todayStr), [todayStr])

  return (
    <div className="feature-card p-6">
      <div className="font-display text-3xl tracking-tight text-brand-bright md:text-4xl">
        {p.tithi}
      </div>
      <p className="mt-1 text-sm text-white/50">
        {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        {' · '}computed at noon UTC — printed almanacs anchor at sunrise
      </p>
      <div className="mt-4">
        {limbs(p, sun).map((row, i, all) => (
          <DataRow key={row.label} label={row.label} value={row.value} last={i === all.length - 1} />
        ))}
      </div>
    </div>
  )
}

function Explorer() {
  const [value, setValue] = useState(() => toDateStr(new Date()))
  const computed = useMemo(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
    return { p: panchang(value), sun: siderealSun(value) }
  }, [value])

  return (
    <div className="surface-card p-5">
      <label htmlFor="panchang-date-in" className="mb-2 block text-sm text-white/70">
        Pick any civil date
      </label>
      <Input
        id="panchang-date-in"
        type="date"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-fit"
      />
      {computed && (
        <div className="mt-4">
          {limbs(computed.p, computed.sun).map((row, i, all) => (
            <DataRow key={row.label} label={row.label} value={row.value} last={i === all.length - 1} />
          ))}
        </div>
      )}
      <p className="mt-3 text-xs text-white/35">
        Noon-UTC longitudes with the Lahiri ayanamsa — sign-level accuracy, not observatory minutes.
      </p>
    </div>
  )
}

/** Next Ekadashi, Purnima, and Amavasya, scanned day by day. */
function Observances() {
  const rows = useMemo(() => {
    const wanted = new Map<string, { label: string; note: string }>([
      ['Ekadashi', { label: 'Next Ekadashi', note: 'The eleventh tithi — the traditional fasting day of each paksha' }],
      ['Purnima', { label: 'Next Purnima', note: 'Full moon — the bright half completes' }],
      ['Amavasya', { label: 'Next Amavasya', note: 'New moon — the dark half completes; the month turns' }],
    ])
    const found: { label: string; value: string; note: string }[] = []
    const seen = new Set<string>()
    const start = Date.now()
    for (let i = 0; i <= 35 && seen.size < wanted.size; i++) {
      const dateStr = toDateStr(new Date(start + i * 86_400_000))
      const p = panchang(dateStr)
      for (const [key, meta] of wanted) {
        if (seen.has(key) || !p.tithi.includes(key)) continue
        seen.add(key)
        found.push({
          label: meta.label,
          value: `${p.tithi} · ${new Date(`${dateStr}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · ${i === 0 ? 'today' : `in ${i} days`}`,
          note: meta.note,
        })
      }
    }
    return found
  }, [])

  return (
    <div className="surface-card p-5">
      {rows.map((r, i) => (
        <DataRow key={r.label} label={r.label} value={r.value} detail={r.note} last={i === rows.length - 1} />
      ))}
    </div>
  )
}

export default function PanchangPage() {
  return (
    <CalendarDetail
      spec={SPEC}
      hero={<TodayHero />}
      explorer={<Explorer />}
      holidays={<Observances />}
      holidaysEyebrow="Observances"
    />
  )
}
