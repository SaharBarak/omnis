import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import parser from 'postcss-selector-parser'
import { describe, expect, it } from 'vitest'
import { declarations, labRoots, labScripts, labSheets, loops } from '@/lib/design/lab-sheets'

/**
 * BENTO_MOTION.md: on the bento site, scroll position never drives motion. A section that
 * enters view plays by time (`useSequence`); nothing is scrubbed, pinned or
 * tied to a scroll timeline, in CSS or in script. Bento v2 is scrolled by
 * design (BENTO_V2.md); this policy holds the bento tree only, and keeps the
 * scroll engines inside v2.
 */

/** A module loaded by name: imported from, imported for its effect, imported later, or required. */
const LOADS = String.raw`(?:\bfrom\s+|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*)['"]`

/** Script that ties motion to scroll, matched across lines: a GSAP import or trigger, Motion's scroll hooks, anime's scroll observer, a scroll listener. */
const SCROLL_LINKED: readonly RegExp[] = [
  new RegExp(`${LOADS}gsap`),
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

/**
 * BENTO_MOTION.md "Loops": every loop is a kind in the table, each by the
 * keyframes it runs. A status pulse and a current run only on screen; a
 * loading loop ends with its load.
 */
const LOOP_KINDS: Readonly<Record<string, 'status' | 'current' | 'loading'>> = {
  pulse: 'status',
  'atlas-current': 'current',
  'badge-pulse': 'loading',
  shimmer: 'loading',
}

const ON_SCREEN: ReadonlySet<string> = new Set(['status', 'current'])

/** The media every loop sits inside, whitespace dropped: motion allowed, colours not forced. */
const MOTION_MEDIA: readonly string[] = ['(prefers-reduced-motion:no-preference)', '(forced-colors:none)']

/** Whether a media query holds a feature in every branch, with no `not` or `or` to turn it. */
const holds = (query: string, feature: string): boolean =>
  query.split(',').every((branch) => !/\b(?:not|or)\b/i.test(branch) && branch.replace(/\s+/g, '').toLowerCase().includes(feature))

/** The `:not()` a selector node sits in, nearest first. */
const negations = (node: parser.Node): readonly parser.Pseudo[] => {
  const found: parser.Pseudo[] = []
  for (let parent = node.parent; parent; parent = parent.parent) if (parser.isPseudo(parent) && parent.value === ':not') found.push(parent)
  return found
}

/** The compound a selector node sits in: its siblings up to the combinators either side. */
const compound = (node: parser.Node): readonly parser.Node[] => {
  const nodes: readonly parser.Node[] = node.parent?.nodes ?? []
  const i = nodes.indexOf(node)
  const end = nodes.findIndex((n, j) => j > i && parser.isCombinator(n))
  return nodes.slice(nodes.slice(0, i).findLastIndex((n) => parser.isCombinator(n)) + 1, end === -1 ? nodes.length : end)
}

const attributes = (selector: string): readonly parser.Attribute[] => {
  const found: parser.Attribute[] = []
  parser((root) => {
    root.walkAttributes((attribute) => {
      found.push(attribute)
    })
  }).processSync(selector)
  return found
}

const named = (attribute: parser.Node, name: string): attribute is parser.Attribute => parser.isAttribute(attribute) && attribute.attribute === name

/** The lab pause: `[data-lab]` and, in the same compound, `:not([data-motion='paused'])`. */
const pausable = (found: readonly parser.Attribute[]): boolean =>
  found.some((attribute) => {
    const [not, ...outer] = negations(attribute)
    return named(attribute, 'data-motion') && attribute.value === 'paused' && not !== undefined && outer.length === 0 && compound(not).some((node) => named(node, 'data-lab') && negations(node).length === 0)
  })

/** On screen: `[data-in-view]` on some compound of the selector, and not inside a `:not()`. */
const onScreen = (found: readonly parser.Attribute[]): boolean => found.some((attribute) => named(attribute, 'data-in-view') && negations(attribute).length === 0)

describe('motion policy', () => {
  it('loops only as a kind in the table, only where motion is allowed, and, but for loading, only on screen', () => {
    const found = loops(labSheets())
    expect(found.length).toBeGreaterThan(0)
    const faults = found.flatMap((loop) => {
      const kind = LOOP_KINDS[loop.keyframes]
      return [
        !kind && `${loop.at} runs ${loop.keyframes || 'unnamed keyframes'}, which is no kind of loop`,
        ...MOTION_MEDIA.filter((feature) => !loop.media.some((query) => holds(query, feature))).map((feature) => `${loop.at} runs outside ${feature}`),
        loop.selectors.length === 0 && `${loop.at} sits in no rule`,
        ...loop.selectors.flatMap((selector) => {
          const found = attributes(selector)
          return [
            !pausable(found) && `${loop.at} ${selector} runs through the lab pause`,
            kind && ON_SCREEN.has(kind) && !onScreen(found) && `${loop.at} ${selector} runs off screen`,
          ]
        }),
      ].filter((fault): fault is string => typeof fault === 'string')
    })
    expect(faults).toEqual([])
  })

  it('ties no CSS animation to scroll', () => {
    expect(declarations(labSheets(undefined, ['bento']), /animation-timeline|scroll-timeline(?:-name)?|view-timeline(?:-name)?|animation-range/)).toEqual([])
  })

  it('ties no scripted motion to scroll', () => {
    const found = labScripts(undefined, ['bento']).flatMap(({ path, lines }) => {
      const code = uncommented(lines.join('\n'))
      return SCROLL_LINKED.flatMap((pattern) => {
        const match = new RegExp(pattern.source, 'g').exec(code)
        return match ? [`${path}:${lineOf(code, match.index)} ${match[0]}`] : []
      })
    })
    expect(found).toEqual([])
  })

  it('keeps the scroll engines inside bento v2, across the whole app', () => {
    const v2 = labRoots(['v2'])
    const engine = new RegExp(`${LOADS}(?:gsap|@gsap/|lenis)`)
    const scripts = readdirSync('src', { recursive: true, encoding: 'utf8' })
      .map((path) => join('src', path))
      .filter((path) => /\.tsx?$/.test(path) && !/\.test\.tsx?$/.test(path))
    const outside = scripts
      .filter((path) => !v2.some((root) => path.startsWith(`${root}/`)))
      .filter((path) => engine.test(uncommented(readFileSync(path, 'utf8'))))
    expect(scripts.length).toBeGreaterThan(0)
    expect(outside).toEqual([])
  })
})
