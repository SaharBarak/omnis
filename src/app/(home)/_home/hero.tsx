'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Sparkles } from 'lucide-react'
import h from './hero.module.css'
import { BrandLockup } from '@/components/brand-mark'
import { Hung, MotionToggle, Notch, ThemeToggle, kit } from '@/components/bento-lab'
import { PrimaryAction } from '@/components/bento-lab/site'
import { DayRows, DayStage, KinFace, LivePill, PixelMark, frame as f, scrub, useScrollScene, useStage, type PixelMarkHandle } from '@/components/bento-v2'
import { V2_MOTION, V2_SCENES } from '@/lib/design/v2-scenes'
import type { V2DayRow } from '@/lib/site/v2-day'
import type { V2Home } from '@/lib/site/v2-home'
import { v2Href } from '@/lib/site/v2-routes'
import { Spelled } from '@/lib/site/number-words'

const delay = (i: number) => ({ '--i': i }) as CSSProperties

const NAV = [
  { href: '#map', label: 'The map' },
  { href: '#why', label: 'Why' },
] as const

/**
 * Hero (BENTO_V2.md "Home" 1): the pixel Lantern assembling at the centre
 * of the room the title leaves in the art panel, nav and title cut into its corners, today's kin on the gold tile,
 * the day across the calendars beside it. The Lantern's room is a stage
 * ("The stage"): the calendar of the row or kin under the pointer is drawn
 * there, and the Lantern gives way and returns. Scrolling out takes the mark
 * apart and lifts the side column away; a row's board, hung from where its
 * row stood, closes as the column leaves its rest, and the stage empties.
 */
export function Hero({ home, systems }: { readonly home: V2Home; readonly systems: number }) {
  const mark = useRef<PixelMarkHandle>(null)
  const [atRest, setAtRest] = useState(true)
  const stage = useStage<V2DayRow>(!atRest)
  const held = stage.shown !== null
  useEffect(() => {
    mark.current?.to('stage', held ? 0 : 1, held ? V2_MOTION.stageOutMs : V2_MOTION.stageInMs)
  }, [held])
  const closeKey = atRest ? 'rest' : 'scrolled'
  const scene = useScrollScene<HTMLElement>((scope) => {
    if (!scope.desktop) return
    const { root } = scope
    const assembly = { value: 1 }
    const settle = () => {
      mark.current?.set('scroll', assembly.value)
      setAtRest(assembly.value === 1)
    }
    scrub(scope, V2_SCENES.heroOut)
      .to(assembly, { value: 0, onUpdate: settle }, 0)
      .to(root.querySelector('[data-hero-side]'), { yPercent: V2_MOTION.heroSideShift, opacity: V2_MOTION.scrubFloor }, 0)
      .to(root.querySelector('[data-hero-type]'), { yPercent: V2_MOTION.heroTypeShift, opacity: V2_MOTION.scrubFloor }, 0)
    return () => mark.current?.clear('scroll')
  })

  return (
    <section ref={scene} id="top" className={f.frame} aria-labelledby="v2-hero-title">
      <div className={`${f.panel} ${f.art} ${h.main}`}>
        <div className={h.markRoom}>
          <PixelMark ref={mark} spot={h.markSpot} className={h.markBox} intro />
          <DayStage row={stage.shown} className={h.markSpot} onPointerEnter={stage.hold} onPointerLeave={stage.release} />
        </div>

        <Link href={v2Href('/')} className={`${h.brand} ${kit.rise}`} style={delay(1)} aria-label="Pleiad, home">
          <BrandLockup />
        </Link>

        <Notch corner="tr" className={`${h.navNotch} ${f.notchStack}`}>
          <nav aria-label="Primary" className={`${f.notchContent} ${kit.rise}`} style={delay(2)}>
            {NAV.map((item) => (
              <a key={item.href} href={item.href} className={f.pill}>
                {item.label}
              </a>
            ))}
            <ThemeToggle className={`${f.pill} ${f.pillIcon}`} />
            <MotionToggle className={`${f.pill} ${f.pillIcon}`} />
            <Link href={v2Href('/app')} className={f.round} aria-label="Open your map">
              <ArrowUpRight size={18} aria-hidden />
            </Link>
          </nav>
        </Notch>

        <Notch corner="bl" className={`${h.titleNotch} ${f.notchStack}`}>
          <div className={f.notchTitle} data-hero-type>
            <span className={`${f.pill} ${f.pillQuiet} ${kit.rise}`} style={delay(3)}>
              <Sparkles size={14} aria-hidden /> {Spelled(systems)} systems, one map
            </span>
            <h1 id="v2-hero-title" className={`${f.title} ${f.titleDisplay} ${kit.rise}`} style={delay(4)}>
              <Hung className={f.line}>Map every person.</Hung>
              <Hung className={f.bright}>See every tie.</Hung>
            </h1>
            <div className={`${h.actionRow} ${kit.rise}`} style={delay(5)}>
              <PrimaryAction href={v2Href('/map')} intent="forward">
                Map a birth date
              </PrimaryAction>
              <p className={f.small}>Dreamspell, Human Design, the Maya Long Count, numerology and astrology, drawn from one birth date. Add a second person and every tie is weighed by how rare it is.</p>
            </div>
          </div>
        </Notch>
      </div>

      <div className={f.column} data-hero-side>
        <div className={`${f.panel} ${f.accent} ${f.pad} ${h.today} ${kit.rise}`} style={delay(2)}>
          <KinFace kin={home.kin} head={<LivePill>Today&apos;s kin</LivePill>} closeKey={closeKey} stage={stage.port} />
          <Notch corner="br" className={h.todayNotch}>
            <div className={f.notchContent}>
              <Link href={v2Href('/today')} className={f.round} aria-label="Today across the calendars">
                <ArrowUpRight size={18} aria-hidden />
              </Link>
            </div>
          </Notch>
        </div>

        <div className={`${f.panel} ${f.pad} ${f.grow} ${h.feedPanel} ${kit.rise}`} style={delay(3)}>
          <p className={f.eyebrow}>The day, across the calendars</p>
          <DayRows rows={home.day} fit closeKey={closeKey} stage={stage.port} />
        </div>
      </div>
    </section>
  )
}
