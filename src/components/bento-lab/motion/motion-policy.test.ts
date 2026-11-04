import { describe, expect, it } from 'vitest'
import { declarations, labScripts, labSheets } from '@/lib/design/lab-sheets'

/**
 * BENTO_MOTION.md: scroll position never drives motion. A section that
 * enters view plays by time (`useSequence`); nothing is scrubbed, pinned or
 * tied to a scroll timeline, in CSS or in script.
 */

/** Script that ties motion to scroll: a GSAP trigger or scrub, Motion's scroll hooks, anime's scroll observer. */
const SCROLL_LINKED = [/\bScrollTrigger\b/, /\bscrub\s*:/, /\buse(?:Scroll|ScrollTimeline)\s*\(/, /from\s+['"]gsap/, /\bonScroll\b[^=]*\bfrom\s+['"]animejs/, /\banime\.onScroll\b/]

describe('motion policy', () => {
  it('ties no CSS animation to scroll', () => {
    expect(declarations(labSheets(), /animation-timeline|scroll-timeline(?:-name)?|view-timeline(?:-name)?|animation-range/)).toEqual([])
  })

  it('ties no scripted motion to scroll', () => {
    const found = labScripts().flatMap(({ path, lines }) =>
      lines.flatMap((line, i) => (SCROLL_LINKED.some((pattern) => pattern.test(line)) ? [`${path}:${i + 1} ${line.trim()}`] : [])),
    )
    expect(found).toEqual([])
  })
})
