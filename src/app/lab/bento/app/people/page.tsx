import type { Metadata } from 'next'
import { PeoplePageBody, type SearchParams } from '@/components/bento-lab/app/pages'

export const metadata: Metadata = { title: 'People' }

export default function Page({ searchParams }: { readonly searchParams: SearchParams }) {
  return <PeoplePageBody tree="v1" searchParams={searchParams} />
}
