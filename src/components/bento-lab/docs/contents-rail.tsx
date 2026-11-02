import kit from '../kit.module.css'
import d from './docs.module.css'

export interface RailItem {
  readonly id: string
  readonly label: string
}

/** Sticky list of in-page links; a chip row on narrow screens. */
export function ContentsRail({ items, className }: { readonly items: readonly RailItem[]; readonly className?: string }) {
  return (
    <nav aria-label="On this page" className={[d.rail, className].filter(Boolean).join(' ')}>
      <span className={kit.eyebrow}>On this page</span>
      <ul className={d.railList}>
        {items.map((item) => (
          <li key={item.id}>
            <a href={`#${item.id}`} className={d.railLink}>
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
