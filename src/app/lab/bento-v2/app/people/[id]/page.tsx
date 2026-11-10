import type { Metadata } from 'next'
import { PersonPageBody } from '@/components/bento-lab/app/pages'

export const metadata: Metadata = { title: 'Person' }

export default function Page({ params }: { readonly params: Promise<{ readonly id: string }> }) {
  return <PersonPageBody tree="v2" params={params} />
}
