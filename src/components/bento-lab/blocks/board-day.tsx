'use client'

import { useSyncExternalStore } from 'react'
import Link from 'next/link'
import b from './blocks.module.css'
import { isoDay } from '@/lib/atlas/light'

const LONG = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

/** The UTC day changes at most once a minute matters; a minute's poll is enough to notice midnight. */
const RECHECK_MS = 60_000

const subscribe = (onChange: () => void): (() => void) => {
  const timer = window.setInterval(onChange, RECHECK_MS)
  return () => window.clearInterval(timer)
}

const utcToday = (): string => isoDay(new Date())

/**
 * The day a board was computed for, said in words. A cached page can outlive
 * its day, so the browser compares it with the UTC day it is in and, once
 * the board turns over, points to today's board instead of showing
 * yesterday's as today's.
 */
export function BoardDay({ day, todayHref }: { readonly day: string; readonly todayHref: string }) {
  const current = useSyncExternalStore(subscribe, utcToday, () => day)
  const stale = current > day
  return (
    <p className={b.boardDay}>
      <time dateTime={day}>{`${LONG.format(new Date(`${day}T12:00:00Z`))}, UTC`}</time>
      {stale && (
        <Link href={todayHref} className={b.boardDayLink}>
          The board has turned over. Open today&apos;s board
        </Link>
      )}
    </p>
  )
}
