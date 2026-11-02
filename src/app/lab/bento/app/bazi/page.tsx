import type { Metadata } from 'next'
import { routeTitle } from '@/lib/site/routes'
import { requestedPersonId, type PersonParam } from '@/components/bento-lab/systems/requested-person'
import { BaziView } from '@/components/bento-lab/systems/bazi-view'

export const metadata: Metadata = { title: routeTitle('/app/bazi') }

/** T12 system page. `?person=<id>` opens a saved person the account owns; otherwise the account's own person. */
export default async function Page({ searchParams }: { readonly searchParams: Promise<{ readonly person?: PersonParam }> }) {
  const { person } = await searchParams
  return <BaziView requested={await requestedPersonId(person)} />
}
