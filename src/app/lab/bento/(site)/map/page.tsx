import type { Metadata } from 'next'
import { ToolPage } from '../_tool/tool-page'
import { demoPerson } from '@/lib/atlas/demo'
import { SHARE_PARAM } from '@/lib/atlas/share'

export const metadata: Metadata = { title: 'Make a map' }

export default async function MapPage({ searchParams }: { readonly searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams
  return (
    <ToolPage
      path="/map"
      eyebrow="Make a map"
      title="One person, four layers"
      lead="Type a birth date and the map redraws in your browser. A time and place light the bodygraph and the rising sign."
      samplePeople={[demoPerson('maya')]}
      shared={params[SHARE_PARAM]}
    />
  )
}
