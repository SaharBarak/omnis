import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { BoardDay, TodayBoard } from '@/components/bento-lab/blocks'
import { todayFigures } from '@/lib/today-figures'
import { Section, site } from '@/components/bento-lab/site'
import { siteHref } from '@/lib/site/routes'
import type { TodayAcrossSystems } from '@/lib/today-board'

/** Tiles on the home board: the first rows of the board table, every one of them drawn. */
const HOME_TILES = 8

/**
 * Storyboard 5, "Every day": one full-width board of drawn tiles, the morning
 * brief and the link in one line under it. `day` is the date `board` was
 * computed for; the page is cached, so the board says which day it is.
 */
export function DailySection({ board, day }: { readonly board: TodayAcrossSystems; readonly day: string }) {
  return (
    <Section
      id="daily"
      eyebrow="Every day"
      title="Today, across the calendars"
      lead="The kin, the Moon, the Sun's gate and the Hebrew date on one board. It turns over at midnight UTC."
    >
      <BoardDay day={day} todayHref={siteHref('/today')} />
      <TodayBoard board={board} day={day} limit={HOME_TILES} figures={todayFigures(day, board)} />
      <p className={site.figureLine}>
        <span>Saved accounts get this board by email each morning, set to the systems they pick.</span>
        <Link href={siteHref('/today')} className={`${site.textLink} ${site.figureLineLink}`}>
          Open today&apos;s board
          <ArrowRight size={15} aria-hidden />
        </Link>
      </p>
    </Section>
  )
}
