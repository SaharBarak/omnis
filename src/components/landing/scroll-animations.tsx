'use client'

import { useRef, ReactNode } from 'react'
import { motion, useScroll, useTransform, useInView, MotionValue } from 'framer-motion'

// ============================================
// SCROLL PROGRESS BAR — fixed at top of page
// ============================================

export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll()

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] bg-primary z-[60] origin-left"
      style={{ scaleX: scrollYProgress }}
    />
  )
}

// ============================================
// PARALLAX — element moves at different rate than scroll
// ============================================

interface ParallaxProps {
  children: ReactNode
  /** Speed multiplier. 0 = fixed, 0.5 = half speed, 1 = normal, -0.5 = reverse */
  speed?: number
  className?: string
}

export function Parallax({ children, speed = 0.5, className = '' }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  // Map scroll progress to y translation
  const y = useTransform(scrollYProgress, [0, 1], [speed * -80, speed * 80])

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div style={{ y }}>
        {children}
      </motion.div>
    </div>
  )
}

// ============================================
// SCROLL SCALE — elements grow/shrink as they scroll
// ============================================

interface ScrollScaleProps {
  children: ReactNode
  /** Scale range: [start, end]. Default [0.92, 1] — grows to full size */
  scaleRange?: [number, number]
  className?: string
}

export function ScrollScale({ children, scaleRange = [0.92, 1], className = '' }: ScrollScaleProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'center center'],
  })

  const scale = useTransform(scrollYProgress, [0, 1], scaleRange)
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0.4, 1])

  return (
    <motion.div ref={ref} style={{ scale, opacity }} className={className}>
      {children}
    </motion.div>
  )
}

// ============================================
// SCROLL FADE — progressive opacity on scroll
// ============================================

interface ScrollFadeProps {
  children: ReactNode
  /** Direction: 'up' fades in while moving up, 'down' fades while scrolling down */
  direction?: 'up' | 'down'
  /** Translation distance in px */
  distance?: number
  className?: string
}

export function ScrollFade({ children, direction = 'up', distance = 40, className = '' }: ScrollFadeProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'center center'],
  })

  const y = useTransform(
    scrollYProgress,
    [0, 1],
    direction === 'up' ? [distance, 0] : [-distance, 0]
  )
  const opacity = useTransform(scrollYProgress, [0, 0.6], [0, 1])

  return (
    <motion.div ref={ref} style={{ y, opacity }} className={className}>
      {children}
    </motion.div>
  )
}

// ============================================
// SCROLL REVEAL — intersection-based with configurable animation
// ============================================

interface ScrollRevealProps {
  children: ReactNode
  /** Animation variant */
  variant?: 'fade' | 'slide-up' | 'slide-left' | 'slide-right' | 'scale'
  /** Delay in seconds */
  delay?: number
  /** Duration in seconds */
  duration?: number
  className?: string
  /** Only animate once */
  once?: boolean
}

const revealVariants = {
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  'slide-up': {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0 },
  },
  'slide-left': {
    hidden: { opacity: 0, x: -24 },
    visible: { opacity: 1, x: 0 },
  },
  'slide-right': {
    hidden: { opacity: 0, x: 24 },
    visible: { opacity: 1, x: 0 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
  },
}

export function ScrollReveal({
  children,
  variant = 'slide-up',
  delay = 0,
  duration = 0.5,
  className = '',
  once = true,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={revealVariants[variant]}
      transition={{ duration, delay, ease: [0.4, 0, 0.2, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ============================================
// STAGGER GROUP — children animate in sequence on scroll
// ============================================

interface StaggerGroupProps {
  children: ReactNode
  /** Delay between each child */
  staggerDelay?: number
  className?: string
}

export function StaggerGroup({ children, staggerDelay = 0.06, className = '' }: StaggerGroupProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: staggerDelay, delayChildren: 0.05 },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ============================================
// SCROLL-LINKED SIZE — element scales based on scroll position
// ============================================

interface ScrollSizeProps {
  children: ReactNode
  /** How the element grows: width and/or height */
  axis?: 'both' | 'width' | 'height'
  /** Size range as percentages [start%, end%] */
  range?: [number, number]
  className?: string
}

export function ScrollSize({ children, axis = 'both', range = [85, 100], className = '' }: ScrollSizeProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'center center'],
  })

  const size = useTransform(scrollYProgress, [0, 1], [`${range[0]}%`, `${range[1]}%`])

  const style: Record<string, MotionValue<string>> = {}
  if (axis === 'both' || axis === 'width') style.width = size
  if (axis === 'both' || axis === 'height') style.height = size

  return (
    <div ref={ref} className={`flex justify-center ${className}`}>
      <motion.div style={style}>
        {children}
      </motion.div>
    </div>
  )
}

// ============================================
// HERO PARALLAX — specialized for hero sections
// Foreground scrolls normally, background scrolls slower
// ============================================

interface HeroParallaxProps {
  children: ReactNode
  backgroundElement?: ReactNode
  /** Background scroll speed (0.3 = 30% of scroll speed) */
  backgroundSpeed?: number
  className?: string
}

export function HeroParallax({
  children,
  backgroundElement,
  backgroundSpeed = 0.3,
  className = '',
}: HeroParallaxProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })

  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', `${backgroundSpeed * 100}%`])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '20%'])

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      {/* Background layer — moves slower */}
      {backgroundElement && (
        <motion.div className="absolute inset-0 z-0" style={{ y: bgY }}>
          {backgroundElement}
        </motion.div>
      )}

      {/* Content layer — fades and shifts as user scrolls past */}
      <motion.div className="relative z-10" style={{ y: contentY, opacity: contentOpacity }}>
        {children}
      </motion.div>
    </div>
  )
}
