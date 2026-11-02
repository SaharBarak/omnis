'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, type ReactNode } from 'react'

export interface DisclosureProps {
  /** What the summary shows; give icon-only summaries a `label`. */
  readonly summary: ReactNode
  readonly label?: string
  readonly className?: string
  readonly summaryClassName?: string
  readonly panelClassName?: string
  readonly children: ReactNode
}

/**
 * A menu that opens from its summary (native `details`). It closes on Escape,
 * returning focus to the summary, on a pointer down outside it, when one of
 * its links is followed and when the route changes.
 */
export function Disclosure({ summary, label, className, summaryClassName, panelClassName, children }: DisclosureProps) {
  const ref = useRef<HTMLDetailsElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    ref.current?.removeAttribute('open')
  }, [pathname])

  useEffect(() => {
    const details = ref.current
    if (!details) return
    const close = (refocus: boolean) => {
      if (!details.open) return
      details.open = false
      if (refocus) details.querySelector('summary')?.focus()
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close(details.contains(document.activeElement))
    }
    const onPointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !details.contains(event.target)) close(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [])

  return (
    <details ref={ref} className={className}>
      <summary className={summaryClassName} aria-label={label}>
        {summary}
      </summary>
      <div
        className={panelClassName}
        onClick={(event) => {
          if (event.target instanceof Element && event.target.closest('a')) ref.current?.removeAttribute('open')
        }}
      >
        {children}
      </div>
    </details>
  )
}
