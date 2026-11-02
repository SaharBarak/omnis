'use client'

import Link from 'next/link'
import { useState, type ReactNode } from 'react'
import { Plus } from 'lucide-react'
import s from './bento.module.css'
import { MotionToggle, PixelVideo, kit } from '@/components/bento-lab'
import type { LabMedia } from '@/lib/data/lab-media'

interface HeroMediaProps {
  readonly media: readonly LabMedia[]
  readonly children: ReactNode
}

/** The tall media card: scene switcher in the top notch, the page's motion pause, and server-rendered overlays. */
export function HeroMedia({ media, children }: HeroMediaProps) {
  const [active, setActive] = useState(0)
  const current = media[active] ?? media[0]

  return (
    <div className={s.hero}>
      <div className={s.heroFrame}>
        {current && <PixelVideo media={current} preload="auto" />}
        <div className={s.heroScrim} />
        <div className={s.tab}>
          <div className={s.tabInner} role="group" aria-label="Background scene">
            {media.map((item, index) => (
              <button
                key={item.mp4}
                type="button"
                className={s.thumb}
                style={{ backgroundImage: `url(${item.poster})` }}
                aria-pressed={index === active}
                onClick={() => setActive(index)}
              >
                <span className={kit.srOnly}>{item.label}</span>
              </button>
            ))}
            <Link href="/calculate" className={s.tabAdd} aria-label="Add a person">
              <Plus size={14} aria-hidden />
            </Link>
          </div>
        </div>
        <div className={s.corner}>
          <MotionToggle className={kit.iconButton} />
        </div>
      </div>
      {children}
    </div>
  )
}
