/**
 * Legal documents as data. One copy of the text, rendered by the live pages
 * (src/app/{terms,privacy,refund}) and by the bento document template.
 */

/** A run of text inside a paragraph or list item. */
export type Inline =
  | string
  | { readonly kind: 'strong'; readonly text: string }
  /** `/path` renders as an in-app link, `http(s)` opens in a new tab, anything else (mailto) as a plain anchor. */
  | { readonly kind: 'link'; readonly text: string; readonly href: string }

export type Rich = readonly Inline[]

export type Block =
  | { readonly kind: 'p'; readonly content: Rich }
  | { readonly kind: 'ul'; readonly items: readonly Rich[] }

export interface LegalSection {
  readonly heading: string
  readonly blocks: readonly Block[]
}

export type LegalSlug = 'terms' | 'privacy' | 'refund'

export interface LegalDoc {
  readonly slug: LegalSlug
  readonly title: string
  /** Meta description. */
  readonly description: string
  /** ISO date of the last change. */
  readonly updated: string
  readonly sections: readonly LegalSection[]
}

export const p = (...content: Inline[]): Block => ({ kind: 'p', content })
export const ul = (...items: Rich[]): Block => ({ kind: 'ul', items })
export const strong = (text: string): Inline => ({ kind: 'strong', text })
export const link = (text: string, href: string): Inline => ({ kind: 'link', text, href })
