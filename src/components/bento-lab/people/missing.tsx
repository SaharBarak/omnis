import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PageHead } from '../site/page-head'
import site from '../site/site.module.css'

/** A record that is absent, deleted, or someone else's: one answer for all three. */
export function RecordMissing({
  eyebrow,
  title,
  body,
  back,
  backLabel,
}: {
  readonly eyebrow: string
  readonly title: string
  readonly body: string
  readonly back: string
  readonly backLabel: string
}) {
  return (
    <PageHead eyebrow={eyebrow} title={title} lead={body}>
      <Link href={back} className={site.btn}>
        <ArrowLeft size={16} aria-hidden />
        {backLabel}
      </Link>
    </PageHead>
  )
}
