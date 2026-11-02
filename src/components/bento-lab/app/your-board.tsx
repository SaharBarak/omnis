'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { TodayBoard } from '../blocks/board'
import site from '../site/site.module.css'
import type { TodayFigures } from '@/lib/today-figures'
import { useSystemPreferences } from '@/lib/hooks/use-system-preferences'
import { siteHref } from '@/lib/site/routes'
import type { TodayAcrossSystems } from '@/lib/today-board'

/**
 * Today's board for the signed-in account: the home board's tiles, filtered
 * by the systems the account picked (`profile.preferences.systems`), with the
 * morning brief in one line under it.
 */
export function YourBoard({ board, day, figures }: { readonly board: TodayAcrossSystems; readonly day: string; readonly figures: TodayFigures }) {
  const { enabledSystems } = useSystemPreferences()
  return (
    <>
      <TodayBoard board={board} day={day} figures={figures} enabled={enabledSystems} />
      <p className={site.figureLine}>
        <span>This board reaches your inbox each morning, set to the systems you pick.</span>
        <Link href={siteHref('/app/settings')} className={`${site.textLink} ${site.figureLineLink}`}>
          Choose the systems
          <ArrowRight size={15} aria-hidden />
        </Link>
      </p>
    </>
  )
}
