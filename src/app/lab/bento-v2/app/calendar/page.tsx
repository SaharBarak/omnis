import type { Metadata } from 'next'
import { CalendarView } from '@/components/bento-lab/systems/calendar-view'
import { routeTitle } from '@/lib/site/routes'

export const metadata: Metadata = { title: routeTitle('/app/calendar') }

export default function Page() {
  return <CalendarView />
}
