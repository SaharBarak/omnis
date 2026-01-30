'use client'

import { useRef, useEffect, useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

// Seal colors based on Dreamspell color families
const SEAL_COLORS: Record<number, { hex: string; class: string }> = {
  1: { hex: '#C75B3A', class: 'text-red-500' },
  2: { hex: '#9CA3AF', class: 'text-stone-400' },
  3: { hex: '#4A6FA5', class: 'text-blue-500' },
  4: { hex: '#D4A84B', class: 'text-amber-500' },
  5: { hex: '#C75B3A', class: 'text-red-500' },
  6: { hex: '#9CA3AF', class: 'text-stone-400' },
  7: { hex: '#4A6FA5', class: 'text-blue-500' },
  8: { hex: '#D4A84B', class: 'text-amber-500' },
  9: { hex: '#C75B3A', class: 'text-red-500' },
  10: { hex: '#9CA3AF', class: 'text-stone-400' },
  11: { hex: '#4A6FA5', class: 'text-blue-500' },
  12: { hex: '#D4A84B', class: 'text-amber-500' },
  13: { hex: '#C75B3A', class: 'text-red-500' },
  14: { hex: '#9CA3AF', class: 'text-stone-400' },
  15: { hex: '#4A6FA5', class: 'text-blue-500' },
  16: { hex: '#D4A84B', class: 'text-amber-500' },
  17: { hex: '#C75B3A', class: 'text-red-500' },
  18: { hex: '#9CA3AF', class: 'text-stone-400' },
  19: { hex: '#4A6FA5', class: 'text-blue-500' },
  20: { hex: '#D4A84B', class: 'text-amber-500' },
}

interface OracleCanvasProps {
  kin: number
  sealNumber: number
  className?: string
}

export function OracleCanvas({ kin, sealNumber, className }: OracleCanvasProps) {
  const prefersReducedMotion = useReducedMotion()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const color = SEAL_COLORS[sealNumber] || SEAL_COLORS[1]

  // Generate seal positions
  const sealPositions = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => {
      const angle = (i / 20) * Math.PI * 2 - Math.PI / 2
      return {
        angle,
        isActive: i + 1 === sealNumber,
        color: SEAL_COLORS[i + 1]?.hex || '#D4A84B',
      }
    })
  }, [sealNumber])

  // Canvas animation with visibility-based pausing
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = Math.min(canvas.offsetWidth, canvas.offsetHeight)
    canvas.width = size * 2
    canvas.height = size * 2
    ctx.scale(2, 2) // Retina

    const centerX = size / 2
    const centerY = size / 2
    const outerRadius = size * 0.42
    const middleRadius = size * 0.32
    const innerRadius = size * 0.22

    let rotation = 0
    let animationId: number
    let isPaused = document.visibilityState === 'hidden'

    const draw = () => {
      if (isPaused && !prefersReducedMotion) {
        animationId = requestAnimationFrame(draw)
        return
      }

      ctx.clearRect(0, 0, size, size)

      // Outer ring
      ctx.beginPath()
      ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2)
      ctx.strokeStyle = `${color.hex}20`
      ctx.lineWidth = 1
      ctx.stroke()

      // Middle ring with rotation
      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.rotate(prefersReducedMotion ? 0 : rotation)

      // Seal markers - increased inactive opacity from 40% (40) to 60% (99)
      sealPositions.forEach((seal) => {
        const x = Math.cos(seal.angle) * middleRadius
        const y = Math.sin(seal.angle) * middleRadius
        const radius = seal.isActive ? 6 : 2

        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fillStyle = seal.isActive ? seal.color : `${seal.color}99`
        ctx.fill()
      })

      ctx.restore()

      // Inner ring
      ctx.beginPath()
      ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2)
      ctx.strokeStyle = `${color.hex}15`
      ctx.lineWidth = 1
      ctx.stroke()

      // Center glow
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, innerRadius * 0.8)
      gradient.addColorStop(0, `${color.hex}30`)
      gradient.addColorStop(1, `${color.hex}00`)
      ctx.beginPath()
      ctx.arc(centerX, centerY, innerRadius * 0.8, 0, Math.PI * 2)
      ctx.fillStyle = gradient
      ctx.fill()

      if (!prefersReducedMotion) {
        rotation += 0.002
        animationId = requestAnimationFrame(draw)
      }
    }

    const handleVisibilityChange = () => {
      isPaused = document.visibilityState === 'hidden'
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    draw()

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (animationId) cancelAnimationFrame(animationId)
    }
  }, [sealPositions, color, prefersReducedMotion])

  return (
    <div className={cn('relative w-full h-full flex items-center justify-center', className)}>
      {/* Canvas for rings */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Center kin number with Framer Motion */}
      <motion.div
        className="relative z-10 flex flex-col items-center justify-center"
        animate={prefersReducedMotion ? {} : { y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Hexagon SVG */}
        <svg viewBox="0 0 100 100" className="w-24 h-24 sm:w-28 sm:h-28">
          <defs>
            <linearGradient id={`hexGrad-${kin}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color.hex} stopOpacity="0.4" />
              <stop offset="100%" stopColor={color.hex} stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <polygon
            points="50,5 90,27.5 90,72.5 50,95 10,72.5 10,27.5"
            fill={`url(#hexGrad-${kin})`}
            stroke={color.hex}
            strokeWidth="1.5"
            strokeOpacity="0.6"
          />
        </svg>

        {/* Kin number overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={cn('text-4xl sm:text-5xl font-bold', color.class)}
            style={{ color: color.hex }}
          >
            {kin}
          </span>
        </div>
      </motion.div>
    </div>
  )
}
