import type { InputHTMLAttributes, ReactNode } from 'react'
import s from './site.module.css'

export interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  readonly id: string
  readonly label: ReactNode
  readonly hint?: ReactNode
  readonly error?: string | null
}

/** Label above, input, then hint or error. */
export function Field({ id, label, hint, error, ...input }: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  return (
    <div className={s.field}>
      <label htmlFor={id} className={s.label}>
        {label}
      </label>
      <input
        id={id}
        className={s.input}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        {...input}
      />
      {error ? (
        <span id={errorId} className={s.error}>
          {error}
        </span>
      ) : (
        hint && (
          <span id={hintId} className={s.hint}>
            {hint}
          </span>
        )
      )}
    </div>
  )
}
