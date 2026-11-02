import type { Metadata } from 'next'
import { PeopleBrowser } from '@/components/bento-lab/people'
import { PageHead, site } from '@/components/bento-lab/site'

export const metadata: Metadata = { title: 'People' }

/** T9 App list: everyone the user saved. `?add=1` opens the add form. */
export default async function PeoplePage({ searchParams }: { readonly searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { add } = await searchParams
  return (
    <>
      <PageHead eyebrow="People" title="Everyone you mapped" lead="Open a person for their full map. Pick two to map the pair, or three and more to make a circle." />
      <div className={site.page}>
        <PeopleBrowser startAdding={add === '1'} />
      </div>
    </>
  )
}
