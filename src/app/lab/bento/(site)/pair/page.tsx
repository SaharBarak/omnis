import type { Metadata } from 'next'
import { ToolPage } from '../_tool/tool-page'
import { demoPerson } from '@/lib/atlas/demo'
import { SHARE_PARAM } from '@/lib/atlas/share'

export const metadata: Metadata = { title: 'Two people' }

export default async function PairPage({ searchParams }: { readonly searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams
  return (
    <ToolPage
      path="/pair"
      eyebrow="Two people"
      title="Every tie between two maps"
      lead="Lines appear only for ties rarer than one pair in five. The table lists the common ones too, folded away."
      samplePeople={[demoPerson('maya'), demoPerson('ari')]}
      shared={params[SHARE_PARAM]}
    />
  )
}
