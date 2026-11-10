import { createSiteHref, type SiteTree } from '@/lib/site/routes'

/** The signed-in app's links in one tree (BENTO_V2.md "The app in v2", "Links"). Ids are encoded; paths come from the route table's patterns. */
export interface AppHrefs {
  readonly people: string
  /** The people list with the add form open. */
  readonly addPerson: string
  readonly person: (id: string) => string
  readonly pair: (a: string, b: string) => string
  readonly groups: string
  readonly group: (id: string) => string
  /** The circles page with people already chosen for a new circle. */
  readonly newCircle: (ids: readonly string[]) => string
  /** A system page opened on one saved person. */
  readonly system: (path: string, personId: string) => string
}

export function appHrefs(tree: SiteTree): AppHrefs {
  const href = createSiteHref(tree)
  return {
    people: href('/app/people'),
    addPerson: href('/app/people?add=1'),
    person: (id) => href(`/app/people/${encodeURIComponent(id)}`),
    pair: (a, b) => href(`/app/pair/${encodeURIComponent(a)}/${encodeURIComponent(b)}`),
    groups: href('/app/groups'),
    group: (id) => href(`/app/groups/${encodeURIComponent(id)}`),
    newCircle: (ids) => href(`/app/groups?with=${ids.map(encodeURIComponent).join(',')}`),
    system: (path, personId) => href(`${path}?person=${encodeURIComponent(personId)}`),
  }
}
