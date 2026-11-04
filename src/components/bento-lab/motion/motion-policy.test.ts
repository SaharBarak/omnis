import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { declarations, labScripts, labSheets } from '@/lib/design/lab-sheets'

/**
 * BENTO_MOTION.md: scroll position never drives motion. A section that
 * enters view plays by time (`useSequence`); nothing is scrubbed, pinned or
 * tied to a scroll timeline, in CSS or in script.
 */

/** Script that ties motion to scroll, matched across lines: a GSAP import or trigger, Motion's scroll hooks, anime's scroll observer, a scroll listener. */
const SCROLL_LINKED: readonly RegExp[] = [
  /(?:from\s+|import\s*\(\s*)['"]gsap/,
  /\bScrollTrigger\b/,
  /\bscrub\s*:/,
  /import\s*\{[^}]*\b(?:scroll|useScroll)\b[^}]*\}\s*from\s*['"](?:framer-motion|motion(?:\/react)?)['"]/,
  /\buseScroll\s*\(/,
  /\bonScroll\b/,
  /addEventListener\(\s*['"]scroll['"]/,
]

/** Comments may name what is banned; only code counts. */
const uncommented = (source: string): string => source.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' ')).replace(/(^|[^:'"`])\/\/.*$/gm, '$1')

const lineOf = (source: string, index: number): number => source.slice(0, index).split('\n').length

describe('motion policy', () => {
  it('ties no CSS animation to scroll', () => {
    expect(declarations(labSheets(), /animation-timeline|scroll-timeline(?:-name)?|view-timeline(?:-name)?|animation-range/)).toEqual([])
  })

  it('ties no scripted motion to scroll', () => {
    const found = labScripts().flatMap(({ path, lines }) => {
      const code = uncommented(lines.join('\n'))
      return SCROLL_LINKED.flatMap((pattern) => {
        const match = new RegExp(pattern.source, 'g').exec(code)
        return match ? [`${path}:${lineOf(code, match.index)} ${match[0]}`] : []
      })
    })
    expect(found).toEqual([])
  })

  it('keeps GSAP out of the dependencies', () => {
    const { dependencies = {}, devDependencies = {} } = JSON.parse(readFileSync('package.json', 'utf8')) as Record<string, Record<string, string>>
    expect(Object.keys({ ...dependencies, ...devDependencies }).filter((name) => name === 'gsap' || name.startsWith('@gsap/'))).toEqual([])
  })
})
