import type { Href } from 'expo-router'

/**
 * Article "related" links carry web paths (the data is shared with the web
 * app). This maps the ones that have a mobile home; anything absent hands
 * off to the browser, which is honest — the alternative is a dead tap or a
 * screen invented to catch it.
 *
 * Keep in sync when a screen lands: a new mobile route should be added here
 * the same day it exists.
 */
export const ARTICLE_ROUTES: Readonly<Record<string, Href>> = {
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
  '/learn/astrology': '/learn/astrology',
  '/learn/dreamspell': '/learn/dreamspell',
  '/learn/tzolkin': '/learn/tzolkin',
  '/learn/human-design': '/learn/human-design',
  '/learn/gematria': '/learn/gematria',
  '/app/library/tropical-vs-sidereal': '/learn/article/tropical-vs-sidereal',
  '/app/library/why-leap-months': '/learn/article/why-leap-months',
}
