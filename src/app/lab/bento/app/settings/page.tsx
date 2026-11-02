import type { Metadata } from 'next'
import { routeTitle } from '@/lib/site/routes'
import { SettingsView } from '@/components/bento-lab/systems/settings-view'

export const metadata: Metadata = { title: routeTitle('/app/settings') }

export default function Page() {
  return <SettingsView />
}
