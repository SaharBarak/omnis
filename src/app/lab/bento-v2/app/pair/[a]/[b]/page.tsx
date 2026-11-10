import type { Metadata } from 'next'
import { PairPageBody } from '@/components/bento-lab/app/pages'

export const metadata: Metadata = { title: 'Two people' }

export default function Page({ params }: { readonly params: Promise<{ readonly a: string; readonly b: string }> }) {
  return <PairPageBody tree="v2" params={params} />
}
