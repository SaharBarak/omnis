'use client'

import { useRef, type ReactNode } from 'react'
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion'

// ============================================
// MAGNETIC — wraps a CTA so it pulls gently toward the cursor.
// Motion values only (no setState in the hover path); isolated client leaf.
// ============================================

interface MagneticProps {
  readonly children: ReactNode
  /** Pull strength in px at the element's edge. */
  readonly strength?: number
  readonly className?: string
}

export function Magnetic({ children, strength = 10, className }: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 220, damping: 18 })
  const springY = useSpring(y, { stiffness: 220, damping: 18 })

  if (reducedMotion) {
    return <div className={className}>{children}</div>
  }

  const onMouseMove = (e: React.MouseEvent) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    x.set(((e.clientX - rect.left) / rect.width - 0.5) * strength * 2)
    y.set(((e.clientY - rect.top) / rect.height - 0.5) * strength * 2)
  }

  const onMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ x: springX, y: springY, display: 'inline-block' }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </motion.div>
  )
}
