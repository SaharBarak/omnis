import { GroupsBrowser, PeopleBrowser } from '@/components/bento-lab/people'
import { APPEARANCE, PageBlock, PageHead, PageStack } from '@/components/bento-lab/site'
import { routeId } from '@/lib/atlas/app/owned'
import type { SiteTree } from '@/lib/site/routes'

export type SearchParams = Promise<Record<string, string | string[] | undefined>>

/** `?with=id,id` arrives from the people list's compare bar. Only well-formed ids pass. */
const preselectOf = (raw: string | string[] | undefined): readonly string[] =>
  (typeof raw === 'string' ? raw.split(',') : []).flatMap((id) => {
    const ok = routeId(id)
    return ok ? [ok] : []
  })

/** T9 App list: everyone the user saved. `?add=1` opens the add form. The same body in either tree. */
export async function PeoplePageBody({ tree, searchParams }: { readonly tree: SiteTree; readonly searchParams: SearchParams }) {
  const { add } = await searchParams
  const appearance = APPEARANCE[tree]
  return (
    <PageStack appearance={appearance}>
      <PageHead
        eyebrow="People"
        title="Everyone you mapped"
        lead="Open a person for their full map. Pick two to map the pair, or three and more to make a circle."
        appearance={appearance}
      />
      <PageBlock appearance={appearance}>
        <PeopleBrowser startAdding={add === '1'} />
      </PageBlock>
    </PageStack>
  )
}

/** T9 App list for circles; `?with=` preselects people for a new one. The same body in either tree. */
export async function CirclesPageBody({ tree, searchParams }: { readonly tree: SiteTree; readonly searchParams: SearchParams }) {
  const params = await searchParams
  const appearance = APPEARANCE[tree]
  return (
    <PageStack appearance={appearance}>
      <PageHead eyebrow="Circles" title="Groups you map together" lead="A circle lays its people out by how strong their ties are and ranks every pair." appearance={appearance} />
      <PageBlock appearance={appearance}>
        <GroupsBrowser preselect={preselectOf(params.with)} />
      </PageBlock>
    </PageStack>
  )
}
