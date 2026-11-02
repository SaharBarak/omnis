'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { ChevronDown, LogOut, Plus } from 'lucide-react'
import s from './app.module.css'
import kit from '../kit.module.css'
import { Disclosure } from '../site/disclosure'
import { SiteFooter } from '../site/site-footer'
import site from '../site/site.module.css'
import { TopBar } from '../site/top-bar'
import { useAuth } from '@/lib/hooks/use-auth'
import { routesIn, siteHref } from '@/lib/site/routes'

export interface ShellUser {
  readonly email: string
  readonly name: string | null
}

const APP_HOME = siteHref('/app')
const ADD_PERSON = `${siteHref('/app/people')}?add=1`

const links = routesIn('app').map((r) => ({ href: siteHref(r.path), label: r.label, exact: siteHref(r.path) === APP_HOME }))
const systems = routesIn('app-systems').map((r) => ({ href: siteHref(r.path), label: r.label }))
const account = routesIn('app-account').map((r) => ({ href: siteHref(r.path), label: r.label }))

function SignOut({ className }: { readonly className: string }) {
  const { signOut } = useAuth()
  return (
    <button type="button" className={className} onClick={() => void signOut(siteHref('/'))}>
      <LogOut size={15} aria-hidden />
      Sign out
    </button>
  )
}

/** The account's menu in the bar: who is signed in, the account's pages, sign out. */
function AccountMenu({ user }: { readonly user: ShellUser }) {
  const shown = user.name ?? user.email
  return (
    <Disclosure
      className={site.navMenu}
      summaryClassName={s.accountSummary}
      panelClassName={`${site.navMenuPanel} ${s.accountPanel} ${kit.glass}`}
      label={`Account: ${shown}`}
      summary={
        <>
          <span className={s.avatar} aria-hidden>
            {shown.slice(0, 1).toUpperCase()}
          </span>
          <ChevronDown size={14} aria-hidden className={site.navMenuChevron} />
        </>
      }
    >
      <span className={s.accountName} title={user.email}>
        {shown}
      </span>
      <ul className={site.navMenuList}>
        {account.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className={site.navMenuLink}>
              {item.label}
            </Link>
          </li>
        ))}
        <li>
          <SignOut className={`${site.navMenuLink} ${s.signOut}`} />
        </li>
      </ul>
    </Disclosure>
  )
}

/**
 * The signed-in frame (BENTO_SITE.md "Shell"): the same glass bar as the
 * site, read from the route table, over the page and the site footer.
 */
export function AppShell({ user, children }: { readonly user: ShellUser; readonly children: ReactNode }) {
  return (
    <>
      <TopBar
        home={APP_HOME}
        label="App"
        links={links}
        menus={[{ label: 'Systems', items: systems }]}
        actions={<AccountMenu user={user} />}
        primary={
          <Link href={ADD_PERSON} className={`${site.btn} ${site.btnSmall} ${site.btnSolid}`}>
            <Plus size={15} aria-hidden />
            Add a person
          </Link>
        }
        narrowFooter={
          <div className={site.menuGroup}>
            <span className={site.menuGroupTitle}>{user.name ?? user.email}</span>
            <ul className={site.menuList}>
              {account.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={site.menuLink}>
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <SignOut className={`${site.menuLink} ${s.signOut}`} />
              </li>
            </ul>
          </div>
        }
      />
      <main id="main" className={`${s.main} ${site.underBar}`}>
        {children}
      </main>
      <SiteFooter />
    </>
  )
}
