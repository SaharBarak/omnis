'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface AnimatedCardProps {
  children: ReactNode
  className?: string
  delay?: number
  hover?: boolean
}

export function AnimatedCard({ children, className, delay = 0, hover = true }: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={hover ? {
        y: -3,
        scale: 1.005,
        transition: { type: "spring", stiffness: 400, damping: 25 }
      } : undefined}
      whileFocus={hover ? {
        y: -3,
        scale: 1.005,
        transition: { type: "spring", stiffness: 400, damping: 25 }
      } : undefined}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm',
        'shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-2px_rgba(0,0,0,0.08)]',
        'dark:shadow-[0_1px_2px_rgba(0,0,0,0.1),0_4px_20px_-2px_rgba(0,0,0,0.25)]',
        'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        'focus-within:ring-2 focus-within:ring-primary/50',
        'transition-shadow duration-200',
        className
      )}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" aria-hidden="true" />
      {children}
    </motion.div>
  )
}

interface StatCardProps {
  label: string
  value: number | string
  icon: ReactNode
  href?: string
  delay?: number
  trend?: 'up' | 'down' | 'neutral'
  color?: 'primary' | 'secondary' | 'accent' | 'amber'
}

export function StatCard({ label, value, icon, delay = 0, color = 'primary' }: StatCardProps) {
  const colorClasses = {
    primary: 'from-primary/20 to-primary/5 text-primary',
    secondary: 'from-secondary/20 to-secondary/5 text-secondary',
    accent: 'from-accent/20 to-accent/5 text-accent',
    amber: 'from-amber-500/20 to-amber-500/5 text-amber-600',
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.35,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{
        scale: 1.025,
        transition: { type: "spring", stiffness: 400, damping: 20 }
      }}
      whileFocus={{
        scale: 1.025,
        transition: { type: "spring", stiffness: 400, damping: 20 }
      }}
      role="link"
      tabIndex={0}
      aria-label={`${value} ${label}`}
      className="group relative p-4 lg:p-5 rounded-xl cursor-pointer overflow-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      {/* Background gradient on hover */}
      <motion.div
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        className={cn(
          'absolute inset-0 bg-gradient-to-br rounded-xl transition-opacity',
          colorClasses[color]
        )}
        aria-hidden="true"
      />

      <div className="relative flex items-center gap-3">
        <div className={cn(
          'flex items-center justify-center w-10 h-10 rounded-xl bg-muted/50',
          'group-hover:bg-white/20 group-focus-visible:bg-white/20 transition-colors'
        )} aria-hidden="true">
          {icon}
        </div>
        <div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.1 }}
            className="text-2xl font-heading font-semibold text-foreground tabular-nums"
          >
            {value}
          </motion.p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    </motion.div>
  )
}

interface GlassCardProps {
  children: ReactNode
  className?: string
  delay?: number
}

export function GlassCard({ children, className, delay = 0 }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={cn(
        'relative overflow-hidden rounded-3xl',
        'bg-gradient-to-br from-card/90 via-card/70 to-card/50',
        'backdrop-blur-xl border border-white/10',
        'shadow-[0_2px_4px_rgba(0,0,0,0.02),0_8px_32px_-8px_rgba(0,0,0,0.12),inset_0_1px_0_0_rgba(255,255,255,0.1)]',
        'dark:shadow-[0_2px_4px_rgba(0,0,0,0.08),0_12px_40px_-8px_rgba(0,0,0,0.35),inset_0_1px_0_0_rgba(255,255,255,0.05)]',
        className
      )}
    >
      {/* Glass shine effect */}
      <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-gradient-to-br from-white/5 via-transparent to-transparent rotate-12 pointer-events-none" aria-hidden="true" />
      {children}
    </motion.div>
  )
}

export function AnimatedText({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={className}
    >
      {children}
    </motion.span>
  )
}

export function StaggerContainer({
  children,
  className,
  staggerDelay = 0.1,
}: {
  children: ReactNode
  className?: string
  staggerDelay?: number
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.5,
            ease: [0.25, 0.46, 0.45, 0.94],
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
