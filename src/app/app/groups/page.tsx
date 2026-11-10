import type { Metadata } from 'next'
import { CirclesPageBody, type SearchParams } from '@/components/bento-lab/app/pages'

export const metadata: Metadata = { title: 'Circles' }

export default function Page({ searchParams }: { readonly searchParams: SearchParams }) {
  return <CirclesPageBody tree="v2" searchParams={searchParams} />
}
