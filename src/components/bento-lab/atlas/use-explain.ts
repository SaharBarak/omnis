'use client'

import { useEffect, useState } from 'react'
import { lazyModule } from '@/lib/lazy-module'

type ExplainModule = typeof import('@/lib/atlas/explain')

/** The mark meanings, loaded once per page on first use; a failed load retries on the next call. */
const loadExplain = lazyModule(() => import('@/lib/atlas/explain'))

/** Runs `work` when the page is idle, or on the next task where idle callbacks are missing; returns a cancel. */
const whenIdle = (work: () => void): (() => void) => {
  if (typeof window.requestIdleCallback === 'function') {
    const handle = window.requestIdleCallback(work)
    return () => window.cancelIdleCallback(handle)
  }
  const handle = window.setTimeout(work, 0)
  return () => window.clearTimeout(handle)
}

/**
 * explain.ts after the first paint (BENTO_SITE.md, "Marks explain
 * themselves"): on the first idle moment, or sooner when `prime` reports the
 * pointer or focus arriving. Until it lands, cards show their title alone.
 */
export function useExplain(): { readonly explainer: ExplainModule | null; readonly prime: () => void } {
  const [explainer, setExplainer] = useState<ExplainModule | null>(null)
  const prime = () => {
    loadExplain().then(setExplainer, () => undefined)
  }
  useEffect(() => {
    let live = true
    const cancel = whenIdle(() => {
      loadExplain().then(
        (loaded) => live && setExplainer(loaded),
        () => undefined,
      )
    })
    return () => {
      live = false
      cancel()
    }
  }, [])
  return { explainer, prime }
}
