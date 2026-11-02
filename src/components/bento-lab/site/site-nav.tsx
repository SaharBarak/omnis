import Link from 'next/link'
import { PrimaryAction } from './action'
import s from './site.module.css'
import { TopBar } from './top-bar'
import { primaryNav, siteHref } from '@/lib/site/routes'

/** Marketing bar: the public tools, sign in, start. */
export function SiteNav() {
  return (
    <TopBar
      home={siteHref('/')}
      links={primaryNav().map((r) => ({ href: siteHref(r.path), label: r.label }))}
      actions={
        <Link href={siteHref('/login')} className={`${s.btn} ${s.btnSmall}`}>
          Sign in
        </Link>
      }
      primary={
        <PrimaryAction href={siteHref('/map')} size="small">
          Map a birth date
        </PrimaryAction>
      }
      narrowFooter={
        <Link href={siteHref('/login')} className={s.menuLink}>
          Sign in
        </Link>
      }
    />
  )
}
