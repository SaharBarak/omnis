import type { SiteTree } from '@/lib/site/routes'

/**
 * How a page sets its parts (docs/redesign/BENTO_V2.md "The app in v2",
 * "Appearance"): the bento site's centred heads over the star chart, or
 * v2's frame, every part on a panel. A tree has one appearance.
 */
export type Appearance = 'bento' | 'frame'

export const APPEARANCE: Readonly<Record<SiteTree, Appearance>> = { v1: 'bento', v2: 'frame' }
