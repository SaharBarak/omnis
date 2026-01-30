'use client'

import { useEffect, useRef, useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

// Seeded random for consistent star positions
function seededRandom(seed: number) {
  const x = Math.sin(seed * 9999) * 10000
  return x - Math.floor(x)
}

export function ThreeBackground() {
  const prefersReducedMotion = useReducedMotion()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Generate star positions (reduced from 150 to 85 for performance)
  const stars = useMemo(() => {
    return Array.from({ length: 85 }, (_, i) => ({
      x: seededRandom(i * 1) * 100,
      y: seededRandom(i * 2) * 100,
      size: 1 + seededRandom(i * 3) * 2,
      opacity: 0.2 + seededRandom(i * 4) * 0.5,
      twinkleSpeed: 2 + seededRandom(i * 5) * 3,
      twinkleDelay: seededRandom(i * 6) * 5,
    }))
  }, [])

  // Canvas animation for stars with visibility-based pausing
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || prefersReducedMotion) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    let animationId: number
    let time = 0
    let isPaused = document.visibilityState === 'hidden'

    const animate = () => {
      if (isPaused) {
        animationId = requestAnimationFrame(animate)
        return
      }

      time += 0.016
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      stars.forEach((star) => {
        const twinkle = Math.sin((time + star.twinkleDelay) * star.twinkleSpeed) * 0.5 + 0.5
        const alpha = star.opacity * (0.5 + twinkle * 0.5)

        ctx.beginPath()
        ctx.arc(
          (star.x / 100) * canvas.width,
          (star.y / 100) * canvas.height,
          star.size,
          0,
          Math.PI * 2
        )
        ctx.fillStyle = `rgba(201, 168, 108, ${alpha})`
        ctx.fill()
      })

      animationId = requestAnimationFrame(animate)
    }

    const handleVisibilityChange = () => {
      isPaused = document.visibilityState === 'hidden'
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    animate()

    return () => {
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      cancelAnimationFrame(animationId)
    }
  }, [stars, prefersReducedMotion])

  if (prefersReducedMotion) {
    return (
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-background via-background to-primary/5" />
    )
  }

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Gradient base */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />

      {/* Star canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 opacity-60" />

      {/* Orbital rings - slowed rotation (300s, 400s, 500s) and reduced opacity (/6, /5, /3) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <motion.div
          className="absolute w-[500px] h-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/[0.06]"
          animate={{ rotate: 360 }}
          transition={{ duration: 300, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute w-[700px] h-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-secondary/[0.05]"
          animate={{ rotate: -360 }}
          transition={{ duration: 400, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute w-[900px] h-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-500/[0.03]"
          animate={{ rotate: 360 }}
          transition={{ duration: 500, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Center glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-primary/5 blur-3xl" />

      {/* Vignette overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background))_70%)]" />
    </div>
  )
}
