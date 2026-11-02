import type { Metadata } from 'next'
import { routeTitle } from '@/lib/site/routes'
import { OraclesView } from '@/components/bento-lab/systems/oracles-view'

export const metadata: Metadata = { title: routeTitle('/app/oracles') }

export default function Page() {
  return <OraclesView />
}
