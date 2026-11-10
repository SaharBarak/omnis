'use client'

import { DayRows, frame as f } from '@/components/bento-v2'
import { useSystemPreferences } from '@/lib/hooks/use-system-preferences'
import { dayRows, type DaySources } from '@/lib/site/v2-day'

/**
 * The day across the calendars the account follows (BENTO_V2.md
 * "Dashboard"): the board's rows kept to the systems picked in settings, as
 * the bento board keeps them (all of them until the preference is read),
 * each with its figure and its calendar's board. The kin has its own tile
 * beside it.
 */
export function DayFeed({ sources, className }: { readonly sources: DaySources; readonly className?: string }) {
  const { enabledSystems } = useSystemPreferences()
  return (
    <section className={className} aria-labelledby="v2-feed">
      <p id="v2-feed" className={f.eyebrow}>
        The day, across your calendars
      </p>
      <DayRows rows={dayRows(sources, enabledSystems)} />
    </section>
  )
}
