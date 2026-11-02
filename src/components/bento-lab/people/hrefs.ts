import { siteHref } from '@/lib/site/routes'

/** Links into the signed-in people pages. Ids are encoded; paths come from the route table's patterns. */
export const personHref = (id: string): string => siteHref(`/app/people/${encodeURIComponent(id)}`)
export const pairHref = (a: string, b: string): string => siteHref(`/app/pair/${encodeURIComponent(a)}/${encodeURIComponent(b)}`)
export const groupHref = (id: string): string => siteHref(`/app/groups/${encodeURIComponent(id)}`)
/** The circles page with people already chosen for a new circle. */
export const newCircleHref = (ids: readonly string[]): string => `${siteHref('/app/groups')}?with=${ids.map(encodeURIComponent).join(',')}`
/** A system page opened on one saved person. */
export const systemHref = (path: string, personId: string): string => `${siteHref(path)}?person=${encodeURIComponent(personId)}`
