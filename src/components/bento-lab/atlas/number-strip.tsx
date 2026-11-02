import s from './atlas.module.css'
import type { NumberLayer } from '@/lib/atlas/types'

/** The number layer: the core numbers as a strip under the wheel. */
export function NumberStrip({ number, className }: { readonly number: NumberLayer; readonly className?: string }) {
  const cells = [
    { label: 'Life path', value: number.lifePath },
    { label: 'Birthday', value: number.birthday },
    { label: 'Expression', value: number.expression },
    { label: 'Personal year', value: number.personalYear },
  ] as const
  return (
    <dl className={[s.strip, s.tokens, className].filter(Boolean).join(' ')} style={{ margin: 0 }}>
      {cells.map((c) => (
        <div key={c.label} className={s.stripCell}>
          <dt className={s.stripLabel}>{c.label}</dt>
          <dd className={s.stripValue} style={{ margin: 0 }}>
            {c.value ?? <span className={s.stripLabel}>Add a name</span>}
          </dd>
        </div>
      ))}
    </dl>
  )
}
