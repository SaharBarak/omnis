'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, CalendarDays, CircleDot, LayoutGrid, LogOut, Settings, Sparkles, Users, type LucideIcon } from 'lucide-react'
import s from './dash.module.css'
import { forgetSketch } from './keep-actions'
import { BrandLockup } from '@/components/brand-mark'
import { MotionToggle, ThemeToggle } from '@/components/bento-lab'
import { frame as f } from '@/components/bento-v2'
import { useAuth } from '@/lib/hooks/use-auth'
import { usePeopleCount } from '@/lib/hooks/use-people'
import { isCurrentLink, routesIn } from '@/lib/site/routes'
import { v2Href } from '@/lib/site/v2-routes'

export interface V2ShellUser {
  readonly email: string
  readonly name: string | null
}

/** Each app page's icon in the rail; a page without one takes the system mark. */
const ICON: Readonly<Record<string, LucideIcon>> = {
  '/app': LayoutGrid,
  '/app/people': Users,
  '/app/groups': CircleDot,
  '/app/calendar': CalendarDays,
  '/app/library': BookOpen,
  '/app/settings': Settings,
}

const railOf = (group: 'app' | 'app-systems' | 'app-account') =>
  routesIn(group)
    .filter((route) => !route.pattern)
    .map((route) => ({ path: route.path, href: v2Href(route.path), label: route.label, icon: ICON[route.path] ?? Sparkles }))

const APP = railOf('app')
const SYSTEMS = railOf('app-systems')
const ACCOUNT = railOf('app-account')

function RailLink({ item, current, badge }: { readonly item: (typeof APP)[number]; readonly current: boolean; readonly badge?: number }) {
  const Icon = item.icon
  return (
    <Link href={item.href} className={s.railLink} aria-current={current ? 'page' : undefined}>
      <Icon size={17} aria-hidden />
      <span>{item.label}</span>
      {badge ? <span className={s.badge}>{badge}</span> : null}
    </Link>
  )
}

/**
 * The v2 signed-in frame (BENTO_V2.md "Dashboard"): the reference portal's
 * rail, read from the route table, beside the page. Pages v2 has not built
 * open in the bento site.
 */
export function V2Shell({ user, people, children }: { readonly user: V2ShellUser; readonly people: number; readonly children: ReactNode }) {
  const pathname = usePathname() ?? ''
  const count = usePeopleCount(people)
  const { signOut } = useAuth()
  /** Forgets any kept map first (a failure there never blocks signing out), then signs out. */
  const leave = async () => {
    await forgetSketch().catch(() => undefined)
    await signOut(v2Href('/')).catch((error: unknown) => console.error('Sign-out failed:', error))
  }
  const shown = user.name ?? user.email
  return (
    <div className={s.app}>
      <aside className={`${f.panel} ${s.rail}`} aria-label="App">
        <div className={s.railHead}>
          <Link href={v2Href('/')} className={s.brand} aria-label="Pleiad, home">
            <BrandLockup />
          </Link>
          <span className={s.railTools}>
            <ThemeToggle className={`${f.pill} ${s.railIcon}`} />
            <MotionToggle className={`${f.pill} ${s.railIcon}`} />
          </span>
        </div>
        <nav aria-label="Your pages" className={s.railNav}>
          {APP.map((item) => (
            <RailLink key={item.href} item={item} current={isCurrentLink(pathname, item.href, item.path === '/app')} badge={item.path === '/app/people' ? count : undefined} />
          ))}
          <p className={`${f.eyebrow} ${s.railGroup}`}>Systems</p>
          {SYSTEMS.map((item) => (
            <RailLink key={item.href} item={item} current={isCurrentLink(pathname, item.href)} />
          ))}
        </nav>
        <div className={`${f.inset} ${s.account}`}>
          <span className={s.avatar} aria-hidden>
            {shown.slice(0, 1).toUpperCase()}
          </span>
          <span className={s.accountText}>
            <span className={s.accountName}>{shown}</span>
            {ACCOUNT.map((item) => (
              <Link key={item.href} href={item.href} className={f.caption}>
                {item.label}
              </Link>
            ))}
          </span>
          <button type="button" className={`${f.pill} ${s.railIcon}`} aria-label="Sign out" onClick={() => void leave()}>
            <LogOut size={15} aria-hidden />
          </button>
        </div>
      </aside>
      <main id="main" className={s.main}>
        {children}
      </main>
    </div>
  )
}
