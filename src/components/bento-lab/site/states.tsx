import type { CSSProperties, ReactNode } from 'react'
import s from './site.module.css'
import kit from '../kit.module.css'

/** Placeholder shaped like the content it stands in for. */
export function Skeleton({ width = '100%', height = 16, style }: { readonly width?: number | string; readonly height?: number | string; readonly style?: CSSProperties }) {
  return <div className={s.skeleton} style={{ width, height, ...style }} aria-hidden />
}

export function EmptyState({ title, children, action }: { readonly title: string; readonly children?: ReactNode; readonly action?: ReactNode }) {
  return (
    <div className={s.state}>
      <h3 className={s.h3}>{title}</h3>
      {children && <p className={s.body}>{children}</p>}
      {action}
    </div>
  )
}

export function ErrorState({ title, children, action }: { readonly title: string; readonly children?: ReactNode; readonly action?: ReactNode }) {
  return (
    <div className={`${s.state} ${s.stateError}`} role="alert">
      <h3 className={s.h3}>{title}</h3>
      {children && <p className={s.body}>{children}</p>}
      {action}
    </div>
  )
}

/** Visible while content loads; announced once to screen readers. */
export function Loading({ label, children }: { readonly label: string; readonly children: ReactNode }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className={kit.srOnly}>{label}</span>
      {children}
    </div>
  )
}
