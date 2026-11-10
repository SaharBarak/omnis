'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { ArrowUp } from 'lucide-react'
import c from './close-frame.module.css'
import { BrandLockup } from '@/components/brand-mark'
import { Hung, Notch } from '@/components/bento-lab'
import { PrimaryAction } from '@/components/bento-lab/site'
import { PixelMark, frame as f, scrub, useScrollScene, type PixelMarkHandle } from '@/components/bento-v2'
import { V2_SCENES } from '@/lib/design/v2-scenes'
import type { V2Home } from '@/lib/site/v2-home'
import { v2Href } from '@/lib/site/v2-routes'

/**
 * Close (BENTO_V2.md "Home" 5): the question, the action and the Lantern
 * assembling as the frame scrolls in; the site's links read from the route
 * table; a footer rule that draws itself to the end of the page.
 */
export function CloseFrame({ home, year }: { readonly home: V2Home; readonly year: number }) {
  const mark = useRef<PixelMarkHandle>(null)
  const scene = useScrollScene<HTMLElement>((scope) => {
    if (!scope.desktop) return
    const assembly = { value: 0 }
    mark.current?.set('scroll', 0)
    scrub(scope, V2_SCENES.closeIn).to(assembly, { value: 1, onUpdate: () => mark.current?.set('scroll', assembly.value) }, 0)
    scrub(scope, V2_SCENES.closeLine).fromTo(scope.root.querySelector('[data-line]'), { '--line': 0 }, { '--line': 1 }, 0)
    return () => mark.current?.clear('scroll')
  })

  return (
    <footer ref={scene} id="start" className={c.close} aria-labelledby="v2-close-title">
      <div className={f.frame}>
        <div className={`${f.panel} ${f.art} ${c.main}`}>
          <div className={c.markRoom}>
            <PixelMark ref={mark} spot={c.markSpot} />
          </div>
          <Notch corner="bl" className={`${c.titleNotch} ${f.notchStack}`}>
            <div className={f.notchTitle}>
              <h2 id="v2-close-title" className={f.title}>
                <Hung className={f.line}>What ties</Hung>
                <Hung className={f.bright}>you two?</Hung>
              </h2>
              <p className={f.lead}>Start with one birth date. The map draws in your browser, and nothing is saved until you make an account.</p>
              <div className={f.pills}>
                <PrimaryAction href={v2Href('/map')} intent="forward">
                  Map a birth date
                </PrimaryAction>
                <Link href={v2Href('/pair')} className={`${f.pill} ${f.pillQuiet}`}>
                  Compare two people
                </Link>
              </div>
            </div>
          </Notch>
        </div>

        <nav className={`${f.panel} ${f.pad} ${c.links}`} aria-label="Site">
          <p className={f.small}>One survey map per person, from Dreamspell, Human Design, the Maya Long Count, numerology and astrology, and every tie between two people weighed by how rare it is.</p>
          <div className={c.columns}>
            {home.columns.map((column) => (
              <div key={column.title} className={c.column}>
                <p className={f.eyebrow}>{column.title}</p>
                <ul className={c.list}>
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className={c.link}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>
      </div>

      <div className={c.bottom} data-line>
        <BrandLockup className={c.lockup} />
        <p className={f.caption}>© {year} Pleiad</p>
        <a href="#top" className={f.round} aria-label="Back to the top">
          <ArrowUp size={18} aria-hidden />
        </a>
      </div>
    </footer>
  )
}
