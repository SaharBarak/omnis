import type { Metadata } from 'next'
import { isTopic, LibraryIndex } from '@/components/bento-lab/systems/library-view'
import { routeTitle } from '@/lib/site/routes'

export const metadata: Metadata = { title: routeTitle('/app/library') }

export default async function LibraryPage({ searchParams }: { readonly searchParams: Promise<{ readonly topic?: string | string[] }> }) {
  const { topic } = await searchParams
  const value = Array.isArray(topic) ? topic[0] : topic
  return <LibraryIndex topic={isTopic(value) ? value : null} />
}
