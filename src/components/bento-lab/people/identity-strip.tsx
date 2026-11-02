import p from './people.module.css'
import site from '../site/site.module.css'
import { missingOf, MISSING_LABEL } from '@/lib/atlas/app/saved-person'
import type { PersonWithTags } from '@/lib/hooks/use-people'

/** T10 slot 1: Hebrew name, tags, and what the person's data still lacks. */
export function IdentityStrip({ person }: { readonly person: PersonWithTags }) {
  const missing = missingOf(person)
  return (
    <div className={p.identity}>
      {person.hebrew_name && (
        <span dir="rtl" lang="he">
          {person.hebrew_name}
        </span>
      )}
      {person.tags.map((t) => (
        <span key={t.id} className={site.chip}>
          <span className={site.dot} style={{ background: t.color }} aria-hidden />
          {t.name}
        </span>
      ))}
      {missing.length === 0 ? (
        <span className={p.miniChip}>Complete: date, time, place, Hebrew name</span>
      ) : (
        missing.map((m) => (
          <span key={m} className={p.miniChip}>
            {MISSING_LABEL[m]}
          </span>
        ))
      )}
    </div>
  )
}
