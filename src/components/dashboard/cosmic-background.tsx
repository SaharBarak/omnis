'use client'

import { useMemo, useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

// Generate deterministic star positions using a seed
function seededRandom(seed: number) {
  const x = Math.sin(seed * 9999) * 10000
  return x - Math.floor(x)
}

export function CosmicBackground() {
  const prefersReducedMotion = useReducedMotion()
  const [isVisible, setIsVisible] = useState(true)

  // Handle visibility changes to pause animations when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden)
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  // Pre-compute star positions to avoid hydration mismatch
  // Reduce count for reduced motion preference
  const stars = useMemo(() => {
    const count = prefersReducedMotion ? 0 : 30
    return [...Array(count)].map((_, i) => ({
      left: seededRandom(i * 1) * 100,
      top: seededRandom(i * 2) * 100,
      duration: 3 + seededRandom(i * 3) * 2,
      delay: seededRandom(i * 4) * 2,
    }))
  }, [prefersReducedMotion])

  // Return simplified version for reduced motion
  if (prefersReducedMotion || !isVisible) {
    return (
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background))_70%)]" />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Gradient base */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />

      {/* Animated stars - using warmer amber tones */}
      <div className="absolute inset-0">
        {stars.map((star, i) => (
          <motion.div
            key={i}
            className="absolute w-[3px] h-[3px] rounded-full bg-amber-500/20"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
            }}
            animate={{
              opacity: [0.2, 0.7, 0.2],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: star.duration,
              repeat: Infinity,
              delay: star.delay,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Orbital rings - softer colors */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <motion.div
          className="absolute w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/[0.06]"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute w-[800px] h-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-secondary/[0.05]"
          animate={{ rotate: -360 }}
          transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute w-[1000px] h-[1000px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-500/[0.04]"
          animate={{ rotate: 360 }}
          transition={{ duration: 100, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Subtle radial gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background))_70%)]" />
    </div>
  )
}
