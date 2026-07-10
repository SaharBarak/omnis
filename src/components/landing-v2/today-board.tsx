'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { MURAL_GROUND } from '@/lib/design/system-flavors'
import { TYPE } from '@/lib/design/landing-tokens'

// ============================================
// TODAY BOARD — the split-flap set piece (Railway homage).
// One moment, read through five traditions — live values flip in.
// Spec: HOMEPAGE_SPEC §12, MOTION_SPEC §11.
// ============================================

const FLAP_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ·°'

interface BoardRow {
  readonly label: string
  readonly value: string
}

function FlapCell({ target, delay }: { readonly target: string; readonly delay: number }) {
  const [char, setChar] = useState(' ')
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  useEffect(() => {
    if (!inView) return
    let flips = 0
    const maxFlips = 4 + Math.floor(Math.random() * 4)
    const timer = setInterval(() => {
      flips += 1
      if (flips >= maxFlips) {
        setChar(target)
        clearInterval(timer)
      } else {
        setChar(FLAP_CHARS[Math.floor(Math.random() * FLAP_CHARS.length)])
      }
    }, 60 + delay)
    return () => clearInterval(timer)
  }, [inView, target, delay])

  return (
    <span
      ref={ref}
      className="inline-flex h-9 w-6 items-center justify-center rounded-[3px] border border-white/10 bg-surface-2 font-mono text-sm text-white/90 md:h-11 md:w-7 md:text-base"
      style={{ transformStyle: 'preserve-3d' }}
    >
      <motion.span
        key={char}
        initial={{ rotateX: -75, opacity: 0.4 }}
        animate={{ rotateX: 0, opacity: 1 }}
        transition={{ duration: 0.09 }}
      >
        {char}
      </motion.span>
    </span>
  )
}

function FlapRow({ row, rowIndex }: { readonly row: BoardRow; readonly rowIndex: number }) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
      <span className="w-24 shrink-0 font-mono text-[11px] uppercase tracking-[0.22em] text-white/50 md:w-32">
        {row.label}
      </span>
      <span className="flex gap-[3px]">
        {row.value.split('').map((c, i) => (
          <FlapCell key={`${row.label}-${i}`} target={c} delay={rowIndex * 18 + i * 6} />
        ))}
      </span>
    </div>
  )
}

export interface TodayBoardData {
  readonly kin: string
  readonly moon: string
  readonly sun: string
  readonly gate: string
  readonly hebrewDate: string
}

export function TodayBoard({ data }: { readonly data: TodayBoardData }) {
  const rows: readonly BoardRow[] = [
    { label: 'Kin', value: data.kin.toUpperCase() },
    { label: 'Moon', value: data.moon.toUpperCase() },
    { label: 'Sun', value: data.sun.toUpperCase() },
    { label: 'Gate', value: data.gate.toUpperCase() },
    { label: 'Hebrew', value: data.hebrewDate.toUpperCase() },
  ]

  return (
    <section
      id="today"
      className="relative py-28 md:py-36"
      style={{ backgroundColor: MURAL_GROUND }}
    >
      <div className="mx-auto max-w-content px-6 text-center">
        <motion.h2
          className={TYPE.section}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          Today, across the systems.
        </motion.h2>
        <motion.p
          className="mt-4 text-lg text-white/70"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          One moment, read through five traditions — live.
        </motion.p>

        <div className="mx-auto mt-14 inline-flex flex-col gap-4 rounded-xl border border-white/10 bg-surface p-6 text-left md:p-10">
          {rows.map((row, i) => (
            <FlapRow key={row.label} row={row} rowIndex={i} />
          ))}
          <p className="mt-2 text-center font-mono text-[11px] tracking-[0.18em] text-white/35">
            (THE CALENDARS NEVER STOP)
          </p>
        </div>
      </div>
    </section>
  )
}
