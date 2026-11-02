import Link from 'next/link'
import s from './site.module.css'
import { BrandMark } from '@/components/brand-mark'
import { routesIn, siteHref, type NavGroup } from '@/lib/site/routes'

const COLUMNS: readonly { readonly title: string; readonly groups: readonly NavGroup[] }[] = [
  { title: 'Tools', groups: ['tools'] },
  { title: 'Learn', groups: ['learn', 'product'] },
  { title: 'Company', groups: ['company'] },
  { title: 'Legal', groups: ['legal'] },
]

/** Footer columns read straight from the route table. */
export function SiteFooter() {
  return (
    <footer className={`${s.page} ${s.footer}`}>
      <div className={s.footerGrid}>
        <div className={s.footerLead}>
          <Link href={siteHref('/')} className={s.brand}>
            <BrandMark size={26} />
            Pleiad
          </Link>
          <p className={s.footerNote}>
            One map per person: Human Design, the 260-day count, astrology and numerology, and the ties
            between the people you know.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <ul className={s.footerCol}>
              <li className={s.label}>{col.title}</li>
              {routesIn(...col.groups)
                .filter((r) => r.path !== '/')
                .map((r) => (
                  <li key={r.path}>
                    <Link href={siteHref(r.path)}>{r.label}</Link>
                  </li>
                ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className={s.footerBase}>
        <span>Pleiad</span>
        <span>For reflection and conversation. Not medical, legal or financial advice.</span>
      </div>
    </footer>
  )
}
