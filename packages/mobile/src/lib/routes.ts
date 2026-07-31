import type { Href } from 'expo-router'

/**
 * Web path → mobile route.
 *
 * Two things need this. Article "related" links carry web paths because the
 * article data is shared with the web app; and favorites are keyed by web
 * path, because a star set on one platform has to be the same star on the
 * other — the href IS the identity, and mobile's own route names are not
 * portable.
 *
 * Anything absent has no mobile home and is opened in the browser, which is
 * honest: the alternatives are a dead tap or a screen invented to catch it.
 *
 * Keep in sync when a screen lands — a new mobile route belongs here the same
 * day it exists.
 */
export const WEB_TO_MOBILE: Readonly<Record<string, Href>> = {
  '/app': '/',
  '/app/calendar': '/calendar',
  '/app/calendars/hebrew': '/learn/hebrew',
  '/app/calendars/hijri': '/learn/hijri',
  '/app/calendars/persian': '/learn/persian',
  '/app/calendars/chinese': '/learn/chinese',
  '/app/calendars/panchang': '/learn/panchang',
  '/app/calendars/long-count': '/learn/long-count',
  '/app/oracles': '/oracles',
  '/app/tree-of-life': '/tree-of-life',
  '/app/people': '/people',
  '/app/library': '/library',
  '/app/settings': '/settings',
  '/app/graph': '/map',
  '/app/groups': '/circles',
  '/learn/astrology': '/learn/astrology',
  '/learn/dreamspell': '/learn/dreamspell',
  '/learn/tzolkin': '/learn/tzolkin',
  '/learn/human-design': '/learn/human-design',
  '/learn/gematria': '/learn/gematria',
  '/learn/integration': '/learn/integration',
  '/app/library/tropical-vs-sidereal': '/learn/article/tropical-vs-sidereal',
  '/app/library/why-leap-months': '/learn/article/why-leap-months',
}

/** The mobile route for a web path, or null when there isn't one. */
export function mobileRouteFor(webPath: string): Href | null {
  const direct = WEB_TO_MOBILE[webPath]
  if (direct !== undefined) return direct

  // Patterned routes the table can't enumerate.
  const article = /^\/app\/library\/([a-z0-9-]+)$/.exec(webPath)
  if (article?.[1] !== undefined) {
    return { pathname: '/learn/article/[slug]', params: { slug: article[1] } }
  }
  const person = /^\/app\/people\/([0-9a-f-]+)$/.exec(webPath)
  if (person?.[1] !== undefined) {
    return { pathname: '/person/[id]', params: { id: person[1] } }
  }
  return null
}
