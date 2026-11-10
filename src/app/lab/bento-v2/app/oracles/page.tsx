import type { Metadata } from 'next'
import { OraclesView } from '@/components/bento-lab/systems/oracles-view'
import { routeTitle } from '@/lib/site/routes'

export const metadata: Metadata = { title: routeTitle('/app/oracles') }

export default function Page() {
  return <OraclesView />
}
