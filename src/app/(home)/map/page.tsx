import type { Metadata } from 'next'
import Link from 'next/link'
import d from './_draw/draw.module.css'
import { DrawMap } from './_draw/draw-map'
import { ThemeToggle } from '@/components/bento-lab'
import { frame as f } from '@/components/bento-v2'
import { BrandLockup } from '@/components/brand-mark'
import { buildPersonAtlas } from '@/lib/atlas/build'
import { demoPerson } from '@/lib/atlas/demo'
import { isoDay } from '@/lib/atlas/light'
import { v2Href } from '@/lib/site/v2-routes'

export const metadata: Metadata = { title: 'Draw your map' }

export const revalidate = 3600

/**
 * Draw your map (docs/redesign/BENTO_V2.md "Draw your map"): three steps
 * over one live plate, the map drawn before any sign-in, and "Keep this map"
 * handing it to the account. The sample map is drawn here, so the first
 * paint is whole; the visitor's map is drawn in the browser.
 */
export default function DrawMapPage() {
  const today = isoDay(new Date())
  const sample = demoPerson('maya')
  return (
    <main id="main" className={d.page}>
      <nav className={d.top} aria-label="Pleiad">
        <Link href={v2Href('/')} className={d.brand} aria-label="Pleiad, home">
          <BrandLockup />
        </Link>
        <span className={f.pills}>
          <ThemeToggle className={`${f.pill} ${f.pillIcon}`} />
          <Link href={v2Href('/app')} className={`${f.pill} ${f.pillQuiet}`}>
            Sign in
          </Link>
        </span>
      </nav>
      <header className={d.head}>
        <h1 className={f.title}>Draw your map.</h1>
        <p className={f.lead}>Type a birth date. The kin, the gates and the sky appear before you sign in.</p>
      </header>
      <DrawMap sample={sample} seed={buildPersonAtlas(sample.input, today)} today={today} />
    </main>
  )
}
