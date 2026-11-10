import type { Metadata } from 'next'
import { CirclePageBody } from '@/components/bento-lab/app/pages'

export const metadata: Metadata = { title: 'Circle' }

export default function Page({ params }: { readonly params: Promise<{ readonly id: string }> }) {
  return <CirclePageBody tree="v2" params={params} />
}
