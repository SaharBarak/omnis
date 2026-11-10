'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { APPEARANCE, type Appearance } from './appearance'
import { appHrefs, type AppHrefs } from '@/components/bento-lab/people/hrefs'
import { createSiteHref, type SiteTree } from '@/lib/site/routes'

/**
 * The tree a page belongs to, for the client components under it
 * (docs/redesign/BENTO_V2.md "The app in v2", "Links"). Each tree's app
 * layout sets it; a component reads it to link into the tree that rendered
 * it. Server components take the tree as a prop from their route file.
 */
const SiteTreeContext = createContext<SiteTree>('v1')

export function SiteTreeProvider({ tree, children }: { readonly tree: SiteTree; readonly children: ReactNode }) {
  return <SiteTreeContext.Provider value={tree}>{children}</SiteTreeContext.Provider>
}

export const useSiteTree = (): SiteTree => useContext(SiteTreeContext)

/** The route table's resolver for the tree this component renders in. */
export function useSiteHref(): (href: string) => string {
  const tree = useSiteTree()
  return useMemo(() => createSiteHref(tree), [tree])
}

/** The signed-in app's links (a person, a pair, a circle, a system on a person) for the tree this component renders in. */
export function useAppHrefs(): AppHrefs {
  const tree = useSiteTree()
  return useMemo(() => appHrefs(tree), [tree])
}

/** How the tree this component renders in sets its parts. */
export const useAppearance = (): Appearance => APPEARANCE[useSiteTree()]
