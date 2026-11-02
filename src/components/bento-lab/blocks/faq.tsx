'use client'

import { useState, type MouseEvent, type SyntheticEvent } from 'react'
import { m } from 'framer-motion'
import b from './blocks.module.css'
import { useMotionAllowed } from '../motion'
import { CURVE, DURATION, seconds } from '@/lib/design/motion-tokens'

export interface FaqItem {
  readonly question: string
  readonly answer: string
}

const OPEN = { height: 'auto', opacity: 1 }
const SHUT = { height: 0, opacity: 0 }

/**
 * One question as a native disclosure: it opens without script, the browser's
 * find-in-page reaches closed answers, and the summary carries the expanded
 * state. With motion on, a press opens the answer with height and fade
 * together (settle token, standard curve, no bounce) and closes it on the
 * quick token before the disclosure shuts.
 */
function Question({ item }: { item: FaqItem }) {
  const allowed = useMotionAllowed()
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const shown = open && !closing

  const press = (event: MouseEvent) => {
    if (!allowed) return
    event.preventDefault()
    if (shown) {
      setClosing(true)
      return
    }
    setClosing(false)
    setOpen(true)
  }

  const sync = (event: SyntheticEvent<HTMLDetailsElement>) => {
    const now = event.currentTarget.open
    if (now === open) return
    setOpen(now)
    setClosing(false)
  }

  return (
    <details className={b.faqItem} open={open} onToggle={sync} data-closing={closing || undefined}>
      <summary className={b.faqQ} onClick={press}>
        <span>{item.question}</span>
        <span className={b.faqIcon} aria-hidden />
      </summary>
      {allowed ? (
        <m.div
          className={b.faqA}
          initial={false}
          animate={shown ? OPEN : SHUT}
          transition={{ duration: seconds(shown ? DURATION.settle : DURATION.quick), ease: CURVE.standard }}
          onAnimationComplete={() => {
            if (!closing) return
            setClosing(false)
            setOpen(false)
          }}
        >
          <p>{item.answer}</p>
        </m.div>
      ) : (
        <div className={b.faqA}>
          <p>{item.answer}</p>
        </div>
      )}
    </details>
  )
}

/** Questions as disclosure rows (storyboard 8). Readable and operable without script. */
export function FaqList({ items }: { readonly items: readonly FaqItem[] }) {
  return (
    <div className={b.faq}>
      {items.map((item) => (
        <Question key={item.question} item={item} />
      ))}
    </div>
  )
}
