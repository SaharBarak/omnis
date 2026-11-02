import Link from 'next/link'
import type { CSSProperties } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { systemArt } from './art'
import s from './systems.module.css'
import { systemHref } from '../people/hrefs'
import { routesIn, siteHref } from '@/lib/site/routes'

/**
 * Every system page as a tile wearing its own mural, opened on one person
 * when `personId` is given (BENTO_SITE.md: components lead with the visual).
 */
export function SystemTiles({ personId, className }: { readonly personId?: string; readonly className?: string }) {
  return (
    <ul className={[s.systemTiles, className].filter(Boolean).join(' ')}>
      {routesIn('app-systems').map((route) => {
        const art = systemArt(route.path)
        const href = personId ? systemHref(route.path, personId) : siteHref(route.path)
        return (
          <li key={route.path}>
            <Link href={href} className={s.systemTile} style={{ '--accent': art.accent, '--mural': `url("${art.mural}")` } as CSSProperties}>
              <span className={s.systemTileArt} aria-hidden />
              <span className={s.systemTileLabel}>
                <span className={s.systemTileDot} aria-hidden />
                {route.label}
                <ArrowUpRight size={15} aria-hidden className={s.systemTileArrow} />
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
