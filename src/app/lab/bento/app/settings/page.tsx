import type { Metadata } from 'next'
import { SettingsView } from '@/components/bento-lab/systems/settings-view'
import { routeTitle } from '@/lib/site/routes'

export const metadata: Metadata = { title: routeTitle('/app/settings') }

export default function Page() {
  return <SettingsView />
}
