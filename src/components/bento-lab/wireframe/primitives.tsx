import type { CSSProperties, ReactNode } from 'react'
import s from './wireframe.module.css'

/**
 * Greyscale wireframe primitives. A numbered `n` tag marks a slot; the
 * figure's legend states what the built page must put in that slot.
 */

const cx = (...names: readonly (string | false | undefined)[]): string => names.filter(Boolean).join(' ')

const Tag = ({ n }: { readonly n?: number }) => (n === undefined ? null : <span className={s.n}>{n}</span>)

interface BoxProps {
  readonly children?: ReactNode
  readonly n?: number
  readonly cols?: string
  readonly rows?: string
  readonly gap?: number
  readonly area?: string
  readonly align?: CSSProperties['alignItems']
  readonly frame?: 'solid' | 'dashed'
  readonly h?: number
  readonly style?: CSSProperties
}

export function Box({ children, n, cols, rows, gap = 12, area, align, frame, h, style }: BoxProps) {
  return (
    <div
      className={cx(s.box, frame === 'solid' && s.frame, frame === 'dashed' && s.dashed)}
      style={{
        gridTemplateColumns: cols,
        gridTemplateRows: rows,
        gap,
        gridArea: area,
        alignItems: align,
        minHeight: h,
        ...style,
      }}
    >
      <Tag n={n} />
      {children}
    </div>
  )
}

export function Ph({ label, h = 120, round, n, style }: { readonly label?: string; readonly h?: number; readonly round?: boolean; readonly n?: number; readonly style?: CSSProperties }) {
  return (
    <div className={cx(s.ph, round && s.round)} style={{ minHeight: h, ...style }}>
      <Tag n={n} />
      {label && <span className={s.cap}>{label}</span>}
    </div>
  )
}

export function Lines({ widths = [100, 92, 64] }: { readonly widths?: readonly number[] }) {
  return (
    <div className={s.lines}>
      {widths.map((w, i) => (
        <span key={i} className={s.line} style={{ width: `${w}%` }} />
      ))}
    </div>
  )
}

export function Title({ widths = [86, 64], size = 'md', n }: { readonly widths?: readonly number[]; readonly size?: 'sm' | 'md' | 'lg'; readonly n?: number }) {
  return (
    <div className={cx(s.title, size === 'lg' && s.titleLg, size === 'sm' && s.titleSm)} style={{ position: 'relative' }}>
      <Tag n={n} />
      {widths.map((w, i) => (
        <span key={i} className={s.titleLine} style={{ width: `${w}%` }} />
      ))}
    </div>
  )
}

export function Pill({ children, solid, icon, n }: { readonly children?: ReactNode; readonly solid?: boolean; readonly icon?: boolean; readonly n?: number }) {
  return (
    <span className={cx(s.pill, solid && s.pillSolid)} style={{ position: 'relative' }}>
      <Tag n={n} />
      {icon && <span className={s.ico} />}
      {children}
    </span>
  )
}

export function Field({ label, hint, n }: { readonly label: string; readonly hint: string; readonly n?: number }) {
  return (
    <div className={cx(s.box, s.field)}>
      <Tag n={n} />
      <span className={s.label}>{label}</span>
      <span className={s.input}>{hint}</span>
    </div>
  )
}

export const Label = ({ children }: { readonly children: ReactNode }) => <span className={s.label}>{children}</span>
export const Num = ({ children }: { readonly children: ReactNode }) => <span className={s.num}>{children}</span>
/** A value in a component's anatomy: `lead` for the strong line, `sm` for a support. */
export const Value = ({ children, size = 'lead' }: { readonly children: ReactNode; readonly size?: 'lead' | 'sm' }) => (
  <span className={s.value} data-size={size}>
    {children}
  </span>
)
export const Row = ({ children, gap = 8 }: { readonly children: ReactNode; readonly gap?: number }) => (
  <div className={s.row} style={{ gap }}>
    {children}
  </div>
)
export const Rule = () => <div className={s.rule} />

export interface Slot {
  readonly n: number
  readonly text: string
}

interface FigureProps {
  readonly id: string
  readonly code: string
  readonly title: string
  readonly serves: string
  readonly slots: readonly Slot[]
  readonly narrow?: boolean
  readonly children: ReactNode
}

export function Figure({ id, code, title, serves, slots, narrow, children }: FigureProps) {
  return (
    <section id={id} className={s.figure} aria-labelledby={`${id}-title`}>
      <header className={s.head}>
        <span>
          <b id={`${id}-title`}>
            {code} · {title}
          </b>
        </span>
        <span>{serves}</span>
      </header>
      <div className={s.scroller}>
        <div className={cx(s.sheet, narrow && s.sheetNarrow)}>{children}</div>
      </div>
      <ol className={s.legend}>
        {slots.map((slot) => (
          <li key={slot.n}>
            <span className={s.legendKey}>{slot.n}</span>
            {slot.text}
          </li>
        ))}
      </ol>
    </section>
  )
}

export { s as wf }
