'use client'

import type { ReactNode } from 'react'
import { LazyMotion, MotionConfig } from 'framer-motion'
import { useEntrance } from './use-entrance'
import { useMotionAllowed } from './use-motion-allowed'
import { CURVE, DURATION, seconds } from '@/lib/design/motion-tokens'

const loadFeatures = () => import('./motion-features').then((m) => m.default)

/**
 * Motion for responses (BENTO_MOTION.md "Motion engines"). LazyMotion keeps
 * the first bundle to the `m` core and fetches animation features after
 * paint; `strict` rejects the full `motion.*` components. The one motion
 * switch sets Motion's reduced-motion policy, and `useEntrance` keeps the
 * CSS first-paint entrances to one play each.
 */
export function MotionRoot({ children }: { readonly children: ReactNode }) {
  const allowed = useMotionAllowed()
  useEntrance()
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion={allowed ? 'never' : 'always'} transition={{ duration: seconds(DURATION.quick), ease: CURVE.standard }}>
        {children}
      </MotionConfig>
    </LazyMotion>
  )
}
