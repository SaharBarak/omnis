import Link from 'next/link'
import type { ReactNode } from 'react'
import styles from './lab.module.css'
import { siteHref } from '@/lib/site/routes'

const LAB_ROUTES = [
  { href: '/lab/bento-a', label: 'A · three columns' },
  { href: '/lab/bento-v2', label: 'B · notched media' },
  { href: siteHref('/'), label: 'Full site' },
  { href: '/', label: 'Live homepage' },
] as const

/** The two hero experiments the site grew from (docs/redesign/BENTO_HERO_LAB.md). */
export default function ExperimentsLayout({ children }: { readonly children: ReactNode }) {
  return (
    <>
      <nav className={styles.strip} aria-label="Lab compositions">
        <span className={styles.stripTitle}>Pleiad · bento lab</span>
        <ul className={styles.stripLinks}>
          {LAB_ROUTES.map((route) => (
            <li key={route.href}>
              <Link href={route.href}>{route.label}</Link>
            </li>
          ))}
        </ul>
      </nav>
      {children}
    </>
  )
}
