import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import t from './today.module.css'
import { kit } from '@/components/bento-lab'
import { OracleCross, TodayBoard } from '@/components/bento-lab/blocks'
import { Section, site } from '@/components/bento-lab/site'
import { BirthInputSchema } from '@/lib/atlas/birth-input'
import { isoDay } from '@/lib/atlas/light'
import { buildMaya } from '@/lib/atlas/maya'
import { composeKinCombination, getToneMeaning } from '@/lib/dreamspell-meanings'
import { signInHref, siteHref } from '@/lib/site/routes'
import { getTodayAcrossSystems } from '@/lib/today-board'
import { todayFigures } from '@/lib/today-figures'

export const metadata: Metadata = { title: 'Today' }

const DAY_MS = 86_400_000
const LONG = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

const dayParam = (raw: string | undefined): string => {
  const parsed = BirthInputSchema.shape.date.safeParse(raw)
  return parsed.success ? parsed.data : isoDay(new Date())
}

const shift = (day: string, days: number): string => isoDay(new Date(Date.parse(`${day}T12:00:00Z`) + days * DAY_MS))

/** T3 Board, public: one day across the calendars, with a stepper; centred like the home sections (BENTO_SITE.md). */
export default async function TodayPage({ searchParams }: { readonly searchParams: Promise<Record<string, string | undefined>> }) {
  const day = dayParam((await searchParams).d)
  const noon = new Date(`${day}T12:00:00Z`)
  const maya = buildMaya(day)
  const tone = getToneMeaning(maya.tone.n)
  const board = getTodayAcrossSystems(noon)
  const href = (d: string) => `${siteHref('/today')}?d=${d}`

  return (
    <Section
      as="h1"
      eyebrow="Today"
      title={LONG.format(noon)}
      lead={`Kin ${maya.kin}, ${maya.title}. ${board.hebrewDate}. The board turns over at midnight UTC.`}
    >
      <nav className={t.stepper} aria-label="Day">
        <Link href={href(shift(day, -1))} className={`${site.btn} ${site.btnSmall}`} aria-label="Previous day">
          <ChevronLeft size={16} aria-hidden />
          Previous day
        </Link>
        <Link href={siteHref('/today')} className={`${site.btn} ${site.btnSmall}`}>
          Today
        </Link>
        <Link href={href(shift(day, 1))} className={`${site.btn} ${site.btnSmall}`} aria-label="Next day">
          Next day
          <ChevronRight size={16} aria-hidden />
        </Link>
      </nav>
      <TodayBoard board={board} day={day} figures={todayFigures(day, board)} />
      <section className={`${site.card} ${t.kin}`} aria-labelledby="day-kin">
        <h2 id="day-kin" className={kit.eyebrow}>
          The day&apos;s kin and its oracle
        </h2>
        <OracleCross maya={maya} />
        <div className={t.kinText}>
          <p className={site.body}>{composeKinCombination(maya.seal.n, maya.tone.n)}</p>
          <p className={site.body}>{tone.paragraph}</p>
          <p className={site.hint}>Traditional Tzolkin day: {maya.tzolkin}</p>
        </div>
      </section>
      <p className={site.figureLine}>
        <span>This board by email each morning, set to the systems you pick, with what the day touches in the people you saved.</span>
        <Link href={signInHref('/app/settings')} className={`${site.textLink} ${site.figureLineLink}`}>
          Get the brief
          <ArrowRight size={15} aria-hidden />
        </Link>
      </p>
    </Section>
  )
}
