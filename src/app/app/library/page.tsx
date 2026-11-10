import type { Metadata } from 'next'
import { LibraryPageBody } from '@/components/bento-lab/app/pages'
import { routeTitle } from '@/lib/site/routes'

export const metadata: Metadata = { title: routeTitle('/app/library') }

export default function Page({ searchParams }: { readonly searchParams: Promise<{ readonly topic?: string | string[] }> }) {
  return <LibraryPageBody tree="v2" searchParams={searchParams} />
}
