/**
 * Bento v2 scenes as data (docs/redesign/BENTO_V2.md "Scenes"). Every trigger
 * window, smoothing and travel the v2 kit plays is a row here; components
 * read rows, never spell a value. The values are the reference landing's
 * (design/zeus-rebrand-live), so the two read the same under the hand;
 * a tie line draws as the bento kit draws one (`DURATION.draw`).
 */

import { DURATION, seconds } from '@/lib/design/motion-tokens'

/** A value tied to scroll position between two trigger points. */
export interface ScrubScene {
  readonly kind: 'scrub'
  /** ScrollTrigger start and end, "<trigger edge> <viewport edge>". */
  readonly start: string
  readonly end: string
  /** Seconds the scrubbed value takes to catch the scroll position. */
  readonly smooth: number
}

/** A timeline that plays when its section's top crosses a share of the viewport. */
export interface EnterScene {
  readonly kind: 'enter'
  /** Share of the viewport height, from the top, the section's top crosses to play. */
  readonly at: number
  /** Seconds. */
  readonly duration: number
  /** Pixels each element rises from. */
  readonly rise: number
  /** Seconds between elements. */
  readonly stagger: number
}

export type V2Scene = ScrubScene | EnterScene

const SCENES = {
  heroOut: { kind: 'scrub', start: 'top top', end: 'bottom top', smooth: 0.6 },
  tilesIn: { kind: 'enter', at: 0.8, duration: 0.8, rise: 40, stagger: 0.05 },
  proofsIn: { kind: 'enter', at: 0.85, duration: 0.9, rise: 60, stagger: 0.08 },
  /** Tie lines draw rarest first; the steps spread by the kit's `staggerStep` for their count. */
  linesIn: { kind: 'enter', at: 0.7, duration: seconds(DURATION.draw), rise: 0, stagger: 0 },
  /** A light or dark plate opens to full size while its top travels from the viewport's foot to its upper quarter. */
  plateIn: { kind: 'scrub', start: 'top bottom', end: 'top 25%', smooth: 0.6 },
  closeIn: { kind: 'scrub', start: 'top bottom', end: 'top 15%', smooth: 0.8 },
  closeLine: { kind: 'scrub', start: 'top 60%', end: 'bottom bottom', smooth: 0.8 },
} as const satisfies Readonly<Record<string, V2Scene>>

export const V2_SCENES = Object.freeze(SCENES)

export type V2SceneId = keyof typeof V2_SCENES

/** Travel and timing the scenes share. */
export const V2_MOTION = Object.freeze({
  /** The hero mark assembles over this long on load. */
  introMs: 2200,
  /** Hero out: the side column rises this share of its height, the title falls this share of its own. */
  heroSideShift: -18,
  heroTypeShift: 25,
  /** No scrubbed element fades below this opacity, so it stays legible and focusable. */
  scrubFloor: 0.35,
  /** Plate in: the plate's scale where its window starts. */
  plateFrom: 0.92,
  /** Numerals count up over this long. */
  countMs: 1400,
})

/** The widths the scenes build for: scrubs on desktop, entrances everywhere. */
export const V2_MEDIA = Object.freeze({
  desktop: '(min-width: 900px)',
  compact: '(max-width: 899.98px)',
})

/** A row's ScrollTrigger start for an entrance. */
export const enterStart = (scene: EnterScene): string => `top ${Math.round(scene.at * 100)}%`
