import type { Metadata } from 'next'
import { BaziView } from '@/components/bento-lab/systems/bazi-view'
import { requestedPersonId, type PersonParam } from '@/components/bento-lab/systems/requested-person'
import { routeTitle } from '@/lib/site/routes'

export const metadata: Metadata = { title: routeTitle('/app/bazi') }

/** T12 system page. `?person=<id>` opens a saved person the account owns; otherwise the account's own person. */
export default async function Page({ searchParams }: { readonly searchParams: Promise<{ readonly person?: PersonParam }> }) {
  const { person } = await searchParams
  return <BaziView requested={await requestedPersonId(person)} />
}
