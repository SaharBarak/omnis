'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import s from './site.module.css'
import { isCurrentLink } from '@/lib/site/routes'

export interface NavItem {
  readonly href: string
  readonly label: string
  /** Current only on an exact match: a group's root, whose pages all sit under it. */
  readonly exact?: boolean
}

/** Links, marking the current page. */
export function NavLinks({ items, className, linkClassName }: { readonly items: readonly NavItem[]; readonly className?: string; readonly linkClassName?: string }) {
  const pathname = usePathname()
  return (
    <ul className={className}>
      {items.map((item) => (
        <li key={item.href}>
          <Link href={item.href} className={linkClassName ?? s.navLink} aria-current={isCurrentLink(pathname, item.href, item.exact) ? 'page' : undefined}>
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  )
}
