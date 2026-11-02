import type { Metadata } from 'next'
import { GroupsBrowser } from '@/components/bento-lab/people'
import { PageHead, site } from '@/components/bento-lab/site'
import { routeId } from '@/lib/atlas/app/owned'

export const metadata: Metadata = { title: 'Circles' }

/** `?with=id,id` arrives from the people list's compare bar. Only well-formed ids pass. */
const preselectOf = (raw: string | string[] | undefined): readonly string[] =>
  (typeof raw === 'string' ? raw.split(',') : []).flatMap((id) => {
    const ok = routeId(id)
    return ok ? [ok] : []
  })

/** T9 App list for circles. */
export default async function CirclesPage({ searchParams }: { readonly searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams
  return (
    <>
      <PageHead eyebrow="Circles" title="Groups you map together" lead="A circle lays its people out by how strong their ties are and ranks every pair." />
      <div className={site.page}>
        <GroupsBrowser preselect={preselectOf(params.with)} />
      </div>
    </>
  )
}
