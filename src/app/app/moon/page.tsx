import type { Metadata } from 'next'
import { MoonView } from '@/components/bento-lab/systems/moon-view'
import { requestedPersonId, type PersonParam } from '@/components/bento-lab/systems/requested-person'
import { routeTitle } from '@/lib/site/routes'

export const metadata: Metadata = { title: routeTitle('/app/moon') }

/** T12 system page. `?person=<id>` opens a saved person the account owns; otherwise the account's own person. */
export default async function Page({ searchParams }: { readonly searchParams: Promise<{ readonly person?: PersonParam }> }) {
  const { person } = await searchParams
  return <MoonView requested={await requestedPersonId(person)} />
}
