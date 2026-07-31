import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker'
import {
  panchang,
  siderealSun,
  type Panchang,
} from '@pleiad/engine/calculations/calendars'
import {
  hebrewDateParts,
  upcomingHebrewHolidays,
} from '@pleiad/engine/calculations/hebrew-calendar'
import {
  HISTORICAL_DATES,
  dateToLongCount,
  daysSinceCreation,
  formatLongCount,
  getLongCountData,
} from '@pleiad/engine/calculations/long-count'
import {
  chineseDateParts,
  hijriDateParts,
  persianDateParts,
  upcomingChineseFestivals,
  upcomingHijriHolidays,
  upcomingPersianHolidays,
} from '@pleiad/engine/calculations/world-calendars'
import { useMemo, useState } from 'react'
import { Platform, StyleSheet, View } from 'react-native'

import { Card, ListItem, Text } from '@/components/m3'
import { DataRow, PageSection } from '@/components/person/scaffold'
import { Notice } from '@/components/ui/notice'
import { SPACE, useTheme } from '@/theme/m3'
import type { SystemFlavor } from '@/theme/tokens'

/**
 * The live half of a calendar doc (#70/#71) — today in this calendar, an
 * exact converter, and what's coming. The prose half is the bundled doc the
 * reader already renders; these three blocks sit above it, which is why the
 * six calendars share the doc route instead of owning a second one.
 *
 * Every calculation is the engine's, on the same Intl foundation the web
 * pages use, so a date converted here and a date converted on
 * /app/calendars/<key> are the same date. Intl degrades to null where a
 * device lacks the calendar data; that shows as an honest notice rather
 * than an invented date.
 */

export type CalendarLiveKey =
  | 'hebrew'
  | 'hijri'
  | 'persian'
  | 'chinese'
  | 'panchang'
  | 'long-count'

const LIVE_KEYS: readonly string[] = [
  'hebrew',
  'hijri',
  'persian',
  'chinese',
  'panchang',
  'long-count',
]

export function isCalendarLiveKey(key: string): key is CalendarLiveKey {
  return LIVE_KEYS.includes(key)
}

interface ListEntry {
  readonly label: string
  readonly value: string
  readonly detail?: string
}

interface LiveSpec {
  /** The headline — today, in this calendar's own terms. */
  readonly heading: string | null
  /** One line under it: the civil date plus whatever the reader must know. */
  readonly note: string
  /** Extra rows under the hero (Long Count's wheels, Panchang's limbs). */
  readonly heroRows: readonly ListEntry[]
  /** Converts any civil date; null where the device lacks the calendar. */
  readonly convert: (date: Date) => string | null
  readonly footnote: string
  readonly listEyebrow: string
  readonly list: readonly ListEntry[]
}

function civilDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function shortCivilDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function whenLine(iso: string, inDays: number): string {
  return `${shortCivilDate(iso)} · ${inDays === 0 ? 'today' : `in ${inDays} days`}`
}

function toDateStr(date: Date): string {
  return date.toISOString().split('T')[0] as string
}

function panchangLimbs(p: Panchang, sun: { sign: string; degree: number }): ListEntry[] {
  return [
    { label: 'Tithi', value: p.tithi },
    { label: 'Nakshatra', value: p.nakshatra },
    { label: 'Yoga', value: p.yoga },
    { label: 'Karana', value: p.karana },
    { label: 'Vara', value: p.vara },
    { label: 'Sidereal sun', value: `${sun.sign} ${sun.degree}°` },
  ]
}

/**
 * The three lunar observances every panchang marks, found by scanning
 * forward — they move against the civil calendar, so there is no table to
 * look them up in.
 */
function upcomingObservances(from: Date): ListEntry[] {
  const wanted: ReadonlyArray<{ tithi: string; label: string; note: string }> = [
    {
      tithi: 'Ekadashi',
      label: 'Next Ekadashi',
      note: 'The eleventh tithi — the traditional fasting day of each paksha',
    },
    { tithi: 'Purnima', label: 'Next Purnima', note: 'Full moon — the bright half completes' },
    {
      tithi: 'Amavasya',
      label: 'Next Amavasya',
      note: 'New moon — the dark half completes; the month turns',
    },
  ]
  const found: ListEntry[] = []
  const seen = new Set<string>()
  for (let i = 0; i <= 35 && seen.size < wanted.length; i++) {
    const iso = toDateStr(new Date(from.getTime() + i * 86_400_000))
    const p = panchang(iso)
    for (const entry of wanted) {
      if (seen.has(entry.tithi) || !p.tithi.includes(entry.tithi)) continue
      seen.add(entry.tithi)
      found.push({
        label: entry.label,
        value: `${p.tithi} · ${whenLine(iso, i)}`,
        detail: entry.note,
      })
    }
  }
  return found
}

function buildSpec(key: CalendarLiveKey, today: Date): LiveSpec {
  switch (key) {
    case 'hebrew': {
      const holidays = upcomingHebrewHolidays(today, 11)
      return {
        heading: hebrewDateParts(today)?.formatted ?? null,
        note: `${civilDate(today)} · the Hebrew day began at sunset yesterday`,
        heroRows: [],
        convert: (date) => hebrewDateParts(date)?.formatted ?? null,
        footnote:
          'Conversion is exact — the fixed calendar of Hillel II, as carried by your device.',
        listEyebrow: 'Holidays',
        list: holidays.map((h) => ({
          label: h.holiday.name,
          value: `${h.hebrewDate} · ${whenLine(h.date, h.inDays)}`,
          detail: h.holiday.note,
        })),
      }
    }
    case 'hijri': {
      const holidays = upcomingHijriHolidays(today, 9)
      return {
        heading: hijriDateParts(today)?.formatted ?? null,
        note: `${civilDate(today)} · the Hijri day began at sunset yesterday`,
        heroRows: [],
        convert: (date) => hijriDateParts(date)?.formatted ?? null,
        footnote:
          'Umm al-Qura reckoning — observed dates can differ by a day where the crescent is sighted.',
        listEyebrow: 'Holidays',
        list: holidays.map((h) => ({
          label: h.holiday.name,
          value: `${h.calendarDate} · ${whenLine(h.date, h.inDays)}`,
          detail: h.holiday.note,
        })),
      }
    }
    case 'persian': {
      const holidays = upcomingPersianHolidays(today, 9)
      return {
        heading: persianDateParts(today)?.formatted ?? null,
        note: `${civilDate(today)} · the Persian day begins at midnight, Tehran time`,
        heroRows: [],
        convert: (date) => persianDateParts(date)?.formatted ?? null,
        footnote:
          'The Solar Hijri calendar is astronomical — the year turns on the observed March equinox, not a rule.',
        listEyebrow: 'Observances',
        list: holidays.map((h) => ({
          label: h.holiday.name,
          value: `${h.calendarDate} · ${whenLine(h.date, h.inDays)}`,
          detail: h.holiday.note,
        })),
      }
    }
    case 'chinese': {
      const festivals = upcomingChineseFestivals(today, 9)
      return {
        heading: chineseDateParts(today)?.formatted ?? null,
        note: `${civilDate(today)} · a leap month reads as e.g. “Sixth Monthbis”`,
        heroRows: [],
        convert: (date) => chineseDateParts(date)?.formatted ?? null,
        footnote:
          'Lunisolar: months follow the new moon, and a leap month keeps the year with the sun.',
        listEyebrow: 'Festivals',
        list: festivals.map((h) => ({
          label: h.holiday.name,
          value: `${h.calendarDate} · ${whenLine(h.date, h.inDays)}`,
          detail: h.holiday.note,
        })),
      }
    }
    case 'panchang': {
      const iso = toDateStr(today)
      const p = panchang(iso)
      return {
        heading: p.tithi,
        note: `${civilDate(today)} · computed at noon UTC — printed almanacs anchor at sunrise`,
        heroRows: panchangLimbs(p, siderealSun(iso)),
        convert: (date) => panchang(toDateStr(date)).tithi,
        footnote:
          'Noon-UTC longitudes with the Lahiri ayanamsa — sign-level accuracy, not observatory minutes.',
        listEyebrow: 'Observances',
        list: upcomingObservances(today),
      }
    }
    case 'long-count': {
      const data = getLongCountData(toDateStr(today))
      return {
        heading: formatLongCount(data.longCount),
        note: `${civilDate(today)} · GMT correlation, day-precise`,
        heroRows: [
          {
            label: 'Tzolkin',
            value: `${data.tzolkin.tone} ${data.tzolkin.daySign.yucatec} — ${data.tzolkin.daySign.english}`,
          },
          { label: 'Haab', value: `${data.haab.day} ${data.haab.monthName}` },
          { label: 'Calendar Round', value: data.calendarRound.formatted },
          {
            label: 'Days since creation',
            value: data.daysSinceCreation.toLocaleString('en-GB'),
          },
        ],
        convert: (date) => formatLongCount(dateToLongCount(toDateStr(date))),
        footnote: 'Exact arithmetic on the Julian Day Number.',
        listEyebrow: 'Notable dates',
        list: HISTORICAL_DATES.map((h) => ({
          label: h.longCount,
          value: `${h.tzolkin} · ${h.haab} · ${shortCivilDate(h.gregorian)}`,
          detail: h.significance,
        })),
      }
    }
  }
}

function Converter({
  convert,
  footnote,
  flavor,
}: {
  convert: (date: Date) => string | null
  footnote: string
  flavor: SystemFlavor
}) {
  const theme = useTheme()
  const [date, setDate] = useState(() => new Date())
  const [pickerOpen, setPickerOpen] = useState(false)

  const converted = useMemo(() => convert(date), [convert, date])

  return (
    <View style={styles.block}>
      <ListItem
        headline="Pick any civil date"
        supportingText={date.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
        onPress={() => setPickerOpen((previous) => !previous)}
        accessibilityLabel="Choose a date to convert"
      />
      {pickerOpen && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          themeVariant={theme.dark ? 'dark' : 'light'}
          onChange={(_event: DateTimePickerEvent, next?: Date) => {
            if (Platform.OS !== 'ios') setPickerOpen(false)
            if (next !== undefined) setDate(next)
          }}
        />
      )}
      <Card variant="filled">
        <Text variant="headlineSmall" color={flavor.accentSoft}>
          {converted ?? '—'}
        </Text>
      </Card>
      <Text variant="bodySmall" color="onSurfaceVariant">
        {footnote}
      </Text>
    </View>
  )
}

export function CalendarLive({
  calendarKey,
  flavor,
  startIndex = 0,
}: {
  calendarKey: CalendarLiveKey
  flavor: SystemFlavor
  /** Continues the doc's stagger rather than restarting it. */
  startIndex?: number
}) {
  // One clock read for the whole block: hero, holiday distances, and the
  // converter's default all describe the same "now".
  const today = useMemo(() => new Date(), [])
  const spec = useMemo(() => buildSpec(calendarKey, today), [calendarKey, today])

  let index = startIndex

  return (
    <>
      <PageSection index={index++} flavor={flavor} eyebrow="Today">
        {spec.heading === null ? (
          <Notice variant="info">
            This device doesn&rsquo;t carry the data for this calendar, so there is
            nothing honest to show here yet.
          </Notice>
        ) : (
          <Card variant="elevated">
            <Text variant="headlineMedium" color={flavor.accentSoft}>
              {spec.heading}
            </Text>
            <Text variant="bodyMedium" color="onSurfaceVariant" style={styles.note}>
              {spec.note}
            </Text>
            {spec.heroRows.length > 0 && (
              <View style={styles.heroRows}>
                {spec.heroRows.map((row, i) => (
                  <DataRow
                    key={row.label}
                    label={row.label}
                    value={row.value}
                    last={i === spec.heroRows.length - 1}
                  />
                ))}
              </View>
            )}
          </Card>
        )}
      </PageSection>

      <PageSection index={index++} flavor={flavor} eyebrow="Explore">
        <Converter convert={spec.convert} footnote={spec.footnote} flavor={flavor} />
      </PageSection>

      {spec.list.length > 0 && (
        <PageSection index={index++} flavor={flavor} eyebrow={spec.listEyebrow}>
          {spec.list.map((entry, i) => (
            <DataRow
              key={`${entry.label}-${entry.value}`}
              label={entry.label}
              value={entry.value}
              detail={entry.detail}
              last={i === spec.list.length - 1}
            />
          ))}
        </PageSection>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  block: {
    gap: SPACE.md,
  },
  note: {
    paddingTop: SPACE.xs,
  },
  heroRows: {
    paddingTop: SPACE.md,
  },
})
