import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Appearance } from '../site/appearance'
import { PageHead } from '../site/page-head'
import site from '../site/site.module.css'

/** A record that is absent, deleted, or someone else's: one answer for all three. */
export function RecordMissing({
  eyebrow,
  title,
  body,
  back,
  backLabel,
  appearance,
}: {
  readonly eyebrow: string
  readonly title: string
  readonly body: string
  readonly back: string
  readonly backLabel: string
  readonly appearance?: Appearance
}) {
  return (
    <PageHead eyebrow={eyebrow} title={title} lead={body} appearance={appearance}>
      <Link href={back} className={site.btn}>
        <ArrowLeft size={16} aria-hidden />
        {backLabel}
      </Link>
    </PageHead>
  )
}
