'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { gsap as Gsap } from 'gsap'
import type { ScrollTrigger as Trigger } from 'gsap/ScrollTrigger'
import type Lenis from 'lenis'
import { useMotionAllowed } from '@/components/bento-lab/motion'

/** The scroll engines, once loaded (docs/redesign/BENTO_V2.md "Motion engines"). */
export interface ScrollKit {
  readonly gsap: typeof Gsap
  readonly ScrollTrigger: typeof Trigger
  readonly lenis: Lenis
}

const ScrollKitContext = createContext<ScrollKit | null>(null)

/** The engines, or null before they land, while motion is off, or after they fail to load. */
export const useScrollKit = (): ScrollKit | null => useContext(ScrollKitContext)

/** Overlays that scroll their own content: Lenis leaves their wheel alone. */
const SCROLLS_ITSELF = '[popover], dialog, [data-lenis-prevent]'

/** GSAP's default lag smoothing, restored when v2 hands the ticker back. */
const LAG_SMOOTHING = [500, 33] as const

/**
 * Batches one `lenis.resize()` and `ScrollTrigger.refresh()` into a frame,
 * after fonts, after load and when the page's size changes; never per scrub
 * frame.
 */
function refreshCoordinator(lenis: Lenis, ScrollTrigger: typeof Trigger): () => void {
  let frame = 0
  let live = true
  const schedule = (): void => {
    if (!live || frame) return
    frame = requestAnimationFrame(() => {
      frame = 0
      lenis.resize()
      ScrollTrigger.refresh()
    })
  }
  const sizes = new ResizeObserver(schedule)
  sizes.observe(document.body)
  window.addEventListener('load', schedule)
  void document.fonts?.ready.then(schedule)
  return () => {
    live = false
    cancelAnimationFrame(frame)
    sizes.disconnect()
    window.removeEventListener('load', schedule)
  }
}

/**
 * Owns the document scroller for the v2 tree's lifetime: loads GSAP,
 * ScrollTrigger and Lenis after first paint, runs Lenis on GSAP's ticker so
 * scroll, scrub and paint share a frame, and publishes them to scenes. While
 * motion is not allowed nothing loads and the page scrolls natively; turning
 * motion off tears everything down, so every scene reverts to its final frame.
 */
export function ScrollEngine({ children }: { readonly children: ReactNode }) {
  const allowed = useMotionAllowed()
  const [kit, setKit] = useState<ScrollKit | null>(null)

  useEffect(() => {
    if (!allowed) return
    let live = true
    let teardown = (): void => {}

    Promise.all([import('gsap'), import('gsap/ScrollTrigger'), import('lenis')])
      .then(([{ gsap }, { ScrollTrigger }, { default: LenisEngine }]) => {
        if (!live) return
        gsap.registerPlugin(ScrollTrigger)
        const lenis = new LenisEngine({
          autoRaf: false,
          anchors: true,
          prevent: (node: HTMLElement) => node.closest(SCROLLS_ITSELF) !== null,
        })
        const tick = (seconds: number): void => lenis.raf(seconds * 1000)
        lenis.on('scroll', ScrollTrigger.update)
        gsap.ticker.add(tick)
        gsap.ticker.lagSmoothing(0)
        const stopRefreshing = refreshCoordinator(lenis, ScrollTrigger)
        teardown = () => {
          stopRefreshing()
          gsap.ticker.remove(tick)
          gsap.ticker.lagSmoothing(...LAG_SMOOTHING)
          lenis.destroy()
        }
        setKit({ gsap, ScrollTrigger, lenis })
      })
      .catch(() => {
        // The page is complete at rest; a failed engine leaves it there.
      })

    return () => {
      live = false
      setKit(null)
      teardown()
    }
  }, [allowed])

  return <ScrollKitContext.Provider value={kit}>{children}</ScrollKitContext.Provider>
}
