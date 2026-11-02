import type { Metadata } from 'next'
import { routeTitle } from '@/lib/site/routes'
import { requestedPersonId, type PersonParam } from '@/components/bento-lab/systems/requested-person'
import { GeneKeysView } from '@/components/bento-lab/systems/gene-keys-view'

export const metadata: Metadata = { title: routeTitle('/app/gene-keys') }

/** T12 system page. `?person=<id>` opens a saved person the account owns; otherwise the account's own person. */
export default async function Page({ searchParams }: { readonly searchParams: Promise<{ readonly person?: PersonParam }> }) {
  const { person } = await searchParams
  return <GeneKeysView requested={await requestedPersonId(person)} />
}
