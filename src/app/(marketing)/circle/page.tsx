import type { Metadata } from 'next'
import { ToolPage } from '../_tool/tool-page'
import { DEMO_ATLAS_PEOPLE } from '@/lib/atlas/demo'
import { SHARE_PARAM } from '@/lib/atlas/share'

export const metadata: Metadata = { title: 'A circle' }

export default async function CirclePage({ searchParams }: { readonly searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams
  return (
    <ToolPage
      path="/circle"
      eyebrow="A circle"
      title="A group, laid out by its ties"
      lead="Up to eight people. The one whose ties carry the most information sits in the middle."
      samplePeople={DEMO_ATLAS_PEOPLE}
      shared={params[SHARE_PARAM]}
    />
  )
}
