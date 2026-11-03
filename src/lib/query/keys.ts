/**
 * Every query key the web app caches under. A query that derives from
 * another sits beneath it, so refreshing the parent refreshes it too
 * (docs/perf/APP_PERFORMANCE_PROMPT.md "Keys are one registry").
 */
export const QUERY_KEYS = Object.freeze({
  people: ['people'],
  matrix: ['people', 'matrix'],
  boards: ['boards'],
  groups: ['groups'],
  group: (id: string) => ['groups', id],
  relationships: ['relationships'],
  relationshipsOf: (personId: string) => ['relationships', personId],
  shares: ['shares'],
  subscription: ['billing', 'subscription'],
  subscriptionSync: ['billing', 'subscription-sync'],
  notificationSettings: ['notifications', 'settings'],
} as const)
