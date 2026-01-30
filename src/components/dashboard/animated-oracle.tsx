'use client'

import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

// Generate deterministic random using seed
function seededRandom(seed: number) {
  const x = Math.sin(seed * 9999) * 10000
  return x - Math.floor(x)
}

// Dreamspell seal colors mapped to seal numbers
const SEAL_COLORS: Record<number, { bg: string; text: string; glow: string }> = {
  1: { bg: 'bg-red-500', text: 'text-red-500', glow: 'shadow-red-500/50' },
  2: { bg: 'bg-stone-200', text: 'text-stone-600', glow: 'shadow-stone-300/50' },
  3: { bg: 'bg-blue-500', text: 'text-blue-500', glow: 'shadow-blue-500/50' },
  4: { bg: 'bg-yellow-400', text: 'text-yellow-500', glow: 'shadow-yellow-400/50' },
  5: { bg: 'bg-red-500', text: 'text-red-500', glow: 'shadow-red-500/50' },
  6: { bg: 'bg-stone-200', text: 'text-stone-600', glow: 'shadow-stone-300/50' },
  7: { bg: 'bg-blue-500', text: 'text-blue-500', glow: 'shadow-blue-500/50' },
  8: { bg: 'bg-yellow-400', text: 'text-yellow-500', glow: 'shadow-yellow-400/50' },
  9: { bg: 'bg-red-500', text: 'text-red-500', glow: 'shadow-red-500/50' },
  10: { bg: 'bg-stone-200', text: 'text-stone-600', glow: 'shadow-stone-300/50' },
  11: { bg: 'bg-blue-500', text: 'text-blue-500', glow: 'shadow-blue-500/50' },
  12: { bg: 'bg-yellow-400', text: 'text-yellow-500', glow: 'shadow-yellow-400/50' },
  13: { bg: 'bg-red-500', text: 'text-red-500', glow: 'shadow-red-500/50' },
  14: { bg: 'bg-stone-200', text: 'text-stone-600', glow: 'shadow-stone-300/50' },
  15: { bg: 'bg-blue-500', text: 'text-blue-500', glow: 'shadow-blue-500/50' },
  16: { bg: 'bg-yellow-400', text: 'text-yellow-500', glow: 'shadow-yellow-400/50' },
  17: { bg: 'bg-red-500', text: 'text-red-500', glow: 'shadow-red-500/50' },
  18: { bg: 'bg-stone-200', text: 'text-stone-600', glow: 'shadow-stone-300/50' },
  19: { bg: 'bg-blue-500', text: 'text-blue-500', glow: 'shadow-blue-500/50' },
  20: { bg: 'bg-yellow-400', text: 'text-yellow-500', glow: 'shadow-yellow-400/50' },
}

interface AnimatedOracleProps {
  kin: number
  sealNumber: number
  className?: string
}

export function AnimatedOracle({ kin, sealNumber, className }: AnimatedOracleProps) {
  const prefersReducedMotion = useReducedMotion()
  const colors = SEAL_COLORS[sealNumber] || SEAL_COLORS[1]

  // Generate seal positions around the circle
  const sealPositions = useMemo(() => {
    return [...Array(20)].map((_, i) => {
      const angle = (i / 20) * 360 - 90 // Start from top
      const radius = 42 // percentage from center
      const x = 50 + radius * Math.cos((angle * Math.PI) / 180)
      const y = 50 + radius * Math.sin((angle * Math.PI) / 180)
      return { x, y, isActive: i + 1 === sealNumber }
    })
  }, [sealNumber])

  // Pre-compute particle positions - reduce count for performance
  const particles = useMemo(() => {
    if (prefersReducedMotion) return []
    return [...Array(8)].map((_, i) => ({
      left: 20 + seededRandom(i * 10) * 60,
      top: 20 + seededRandom(i * 20) * 60,
      duration: 5 + seededRandom(i * 30) * 3, // Slower, more meditative
      delay: seededRandom(i * 40) * 4,
    }))
  }, [prefersReducedMotion])

  // Static version for reduced motion preference
  if (prefersReducedMotion) {
    return (
      <div className={cn('relative w-full h-full flex items-center justify-center', className)} aria-label={`Kin ${kin}, Seal ${sealNumber}`}>
        {/* Outer glow */}
        <div className={cn('absolute w-56 h-56 rounded-full blur-3xl opacity-20', colors.bg)} aria-hidden="true" />
        {/* Static rings */}
        <div className="absolute w-52 h-52 rounded-full border border-primary/15" aria-hidden="true" />
        <div className="absolute w-44 h-44 rounded-full border border-muted-foreground/20" aria-hidden="true" />
        <div className="absolute w-32 h-32 rounded-full border border-secondary/20" aria-hidden="true" />
        {/* Center glyph */}
        <div className="relative z-10">
          <svg viewBox="0 0 100 100" className="w-24 h-24" aria-hidden="true">
            <defs>
              <linearGradient id="hexGradientStatic" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            <polygon
              points="50,3 93,25 93,75 50,97 7,75 7,25"
              fill="url(#hexGradientStatic)"
              stroke="hsl(var(--primary))"
              strokeWidth="1"
              strokeOpacity="0.5"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn('text-4xl font-heading font-bold', colors.text)}>{kin}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('relative w-full h-full flex items-center justify-center', className)} aria-label={`Kin ${kin}, Seal ${sealNumber}`}>
      {/* Outer glow */}
      <div className={cn(
        'absolute w-56 h-56 rounded-full blur-3xl opacity-20',
        colors.bg
      )} />

      {/* Outer ring - slower, more meditative rotation */}
      <motion.div
        className="absolute w-52 h-52 rounded-full border border-primary/15"
        animate={{ rotate: 360 }}
        transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
      >
        {/* Particles on outer ring */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-primary/40"
            style={{
              left: `${50 + 48 * Math.cos((i / 8) * Math.PI * 2)}%`,
              top: `${50 + 48 * Math.sin((i / 8) * Math.PI * 2)}%`,
              transform: 'translate(-50%, -50%)',
            }}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.25,
            }}
          />
        ))}
      </motion.div>

      {/* Middle ring with seal markers - counter-rotating, elegant pace */}
      <motion.div
        className="absolute w-44 h-44 rounded-full"
        animate={{ rotate: -360 }}
        transition={{ duration: 180, repeat: Infinity, ease: 'linear' }}
      >
        {sealPositions.map((pos, i) => (
          <motion.div
            key={i}
            className={cn(
              'absolute rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300',
              pos.isActive ? cn('w-4 h-4', colors.bg, 'shadow-lg', colors.glow) : 'w-1.5 h-1.5 bg-muted-foreground/30'
            )}
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
            }}
            animate={pos.isActive ? { scale: [1, 1.2, 1] } : {}}
            transition={pos.isActive ? { duration: 2, repeat: Infinity } : {}}
          />
        ))}
      </motion.div>

      {/* Inner ring - slowest, most meditative */}
      <motion.div
        className="absolute w-32 h-32 rounded-full border border-secondary/20"
        animate={{ rotate: 360 }}
        transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
      />

      {/* Center glyph - gentle breathing motion */}
      <motion.div
        className="relative z-10"
        animate={{ y: [0, -6, 0], scale: [1, 1.02, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Hexagon background */}
        <div className="relative">
          <svg viewBox="0 0 100 100" className="w-24 h-24">
            <defs>
              <linearGradient id="hexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            <polygon
              points="50,3 93,25 93,75 50,97 7,75 7,25"
              fill="url(#hexGradient)"
              stroke="hsl(var(--primary))"
              strokeWidth="1"
              strokeOpacity="0.5"
            />
          </svg>

          {/* Kin number */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn(
              'text-4xl font-heading font-bold',
              colors.text
            )}>
              {kin}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Floating particles */}
      {particles.map((particle, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-primary/20"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
          }}
        />
      ))}
    </div>
  )
}
