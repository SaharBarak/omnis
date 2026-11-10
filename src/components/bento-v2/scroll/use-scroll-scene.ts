'use client'

import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react'
import { useScrollKit, type ScrollKit } from './scroll-engine'
import { landsAt, undrawnStroke } from '@/components/bento-lab/motion/draw-in'
import { seconds, staggerStep } from '@/lib/design/motion-tokens'
import { V2_MEDIA, enterStart, type EnterScene, type ScrubScene } from '@/lib/design/v2-scenes'

export interface SceneScope {
  readonly root: HTMLElement
  readonly kit: ScrollKit
  /** Scrubbed parts build on desktop only; entrances build at every width. */
  readonly desktop: boolean
}

/** Builds a section's scenes; may return extra cleanup. Tweens made inside are reverted with the scope. */
export type SceneBuild = (scope: SceneScope) => void | (() => void)

/**
 * One scope per section (BENTO_V2.md "Motion engines"): the build runs inside
 * `gsap.matchMedia()` scoped to the section, for desktop and compact widths,
 * once the engines have landed. Reverted on unmount, on a width change and
 * when motion stops (the engines go away), so the stylesheet's final frame
 * takes over.
 */
export function useScrollScene<T extends HTMLElement>(build: SceneBuild): RefObject<T | null> {
  const ref = useRef<T | null>(null)
  const latest = useRef(build)
  const kit = useScrollKit()

  useLayoutEffect(() => {
    latest.current = build
  })

  useEffect(() => {
    const root = ref.current
    if (!kit || !root) return
    const media = kit.gsap.matchMedia(root)
    media.add(V2_MEDIA, (context) => latest.current({ root, kit, desktop: Boolean(context.conditions?.desktop) }))
    return () => media.revert()
  }, [kit])

  return ref
}

/** A scrubbed timeline over a section, from its scene row. */
export const scrub = ({ kit, root }: SceneScope, scene: ScrubScene, trigger: Element = root) =>
  kit.gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger, start: scene.start, end: scene.end, scrub: scene.smooth } })

/** A scene's plate: its root, or the plate its root holds where a section sets its plate inside a band of its own. */
const plateOf = (root: Element): Element | null => (root.hasAttribute('data-chapter') ? root : root.querySelector(':scope > [data-chapter]'))

/**
 * A plate (BENTO_V2.md "Light and dark") opens to its full size as its top
 * comes up the viewport, from its top edge, so the field arrives as the
 * reader scrolls into it; the top stays put, and with it every trigger
 * measured from it. Desktop only, as every scrub.
 */
export function plateIn(scope: SceneScope, scene: ScrubScene, from: number): void {
  const plate = plateOf(scope.root)
  if (!scope.desktop || !plate) return
  scrub(scope, scene, plate).fromTo(plate, { scale: from }, { scale: 1 }, 0)
}

/**
 * Whether an entrance may still arm: its section's top has not yet crossed
 * the row's line. A section already past it keeps its final frame, so content
 * the reader has seen never hides and replays.
 */
export const mayArm = (root: Element, scene: EnterScene): boolean => root.getBoundingClientRect().top > window.innerHeight * scene.at

/**
 * What rises in a section, by contract rather than by any module's class
 * names: every `[data-tile]`, and every item of a list marked `[data-tiles]`
 * or held in an element so marked (a list drawn on the server and handed in).
 */
export const RISE_TARGETS = '[data-tile], [data-tiles] > li, [data-tiles] > :is(ol, ul) > li'

/** Elements of a section rise into place, once, as it enters view; `onLanded` hears when they have, at once when nothing arms. */
export function rise({ kit, root }: SceneScope, scene: EnterScene, targets: readonly Element[], onLanded?: () => void): void {
  if (targets.length === 0 || !mayArm(root, scene)) {
    onLanded?.()
    return
  }
  kit.gsap.fromTo(
    targets,
    { y: scene.rise, autoAlpha: 0 },
    {
      y: 0,
      autoAlpha: 1,
      duration: scene.duration,
      stagger: scene.stagger,
      ease: 'expo.out',
      scrollTrigger: {
        trigger: root,
        start: enterStart(scene),
        once: true,
      },
      onComplete: onLanded,
    },
  )
}

/** One step of a drawing: its lines, and the marks (ends, labels) that appear as they land. */
export interface LineStep {
  readonly lines: readonly Element[]
  readonly marks: readonly Element[]
}

/**
 * A drawing's lines draw in step after step (rarest first), once, as the
 * section enters, as the bento kit draws them: each line has `pathLength` 1,
 * so a draw is one dash; its marks appear as it lands. Inline styles clear
 * when each part lands, so the stylesheet's final frame takes over.
 * `onLanded` runs once every line is in, or at once when the draw-in does
 * not arm and the lines already stand drawn.
 */
export function drawLines({ kit, root }: SceneScope, scene: EnterScene, steps: readonly LineStep[], onLanded?: () => void): void {
  const live = steps.filter((step) => step.lines.length > 0)
  if (live.length === 0 || !mayArm(root, scene)) {
    onLanded?.()
    return
  }
  const step = seconds(staggerStep(live.length))
  const lands = seconds(landsAt(0))
  const timeline = kit.gsap.timeline({ scrollTrigger: { trigger: root, start: enterStart(scene), once: true }, onComplete: onLanded })
  live.forEach(({ lines, marks }, i) => {
    timeline.fromTo(lines, undrawnStroke(), { strokeDashoffset: 0, duration: scene.duration, ease: 'expo.out', clearProps: 'strokeDasharray,strokeDashoffset' }, i * step)
    if (marks.length > 0) timeline.fromTo(marks, { autoAlpha: 0 }, { autoAlpha: 1, duration: scene.duration / 3, clearProps: 'opacity,visibility' }, i * step + lands)
  })
}

/**
 * Numerals count up from zero to the value they already show. The server
 * renders the final text; a counter that never arms leaves it there.
 */
export function countUp({ kit, root }: SceneScope, scene: EnterScene, ms: number): void {
  if (!mayArm(root, scene)) return
  for (const el of root.querySelectorAll<HTMLElement>('[data-count]')) {
    const target = Number(el.dataset.count)
    if (!Number.isFinite(target)) continue
    const final = el.textContent ?? ''
    const digits = (el.dataset.count?.split('.')[1] ?? '').length
    const state = { value: 0 }
    kit.gsap.to(state, {
      value: target,
      duration: ms / 1000,
      ease: 'power2.out',
      scrollTrigger: { trigger: root, start: enterStart(scene), once: true },
      onStart: () => {
        el.textContent = (0).toFixed(digits)
      },
      onUpdate: () => {
        el.textContent = state.value.toFixed(digits)
      },
      onComplete: () => {
        el.textContent = final
      },
      onInterrupt: () => {
        el.textContent = final
      },
    })
  }
}
