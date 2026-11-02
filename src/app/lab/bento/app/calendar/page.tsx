import type { Metadata } from 'next'
import { routeTitle } from '@/lib/site/routes'
import { CalendarView } from '@/components/bento-lab/systems/calendar-view'

export const metadata: Metadata = { title: routeTitle('/app/calendar') }

export default function Page() {
  return <CalendarView />
}
