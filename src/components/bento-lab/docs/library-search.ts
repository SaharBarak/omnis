/**
 * Library search, kept apart from the content so the client bundle carries
 * the index rows and not the articles.
 */

/** One row of the library list: a section of an article. */
export interface LibraryEntry {
  readonly id: string
  readonly title: string
  readonly article: string
  readonly system: string
  readonly accent: string
  readonly minutes: number
  /** Lower-cased text the search matches against. */
  readonly haystack: string
}

/** Every word of the query appears somewhere in the entry. */
export const matchesQuery = (entry: LibraryEntry, query: string): boolean =>
  query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => entry.haystack.includes(term))
