import Link from 'next/link'
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
        <Link href={siteHref('/map')} className={`${s.btn} ${s.btnSmall} ${s.btnSolid}`}>
          Map a birth date
        </Link>
      }
      narrowFooter={
        <Link href={siteHref('/login')} className={s.menuLink}>
          Sign in
        </Link>
      }
    />
  )
}
