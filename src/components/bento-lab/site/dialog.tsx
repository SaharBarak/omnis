'use client'

import { useId, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { X } from 'lucide-react'
import s from './site.module.css'
import kit from '../kit.module.css'

/**
 * A button that opens a modal dialog (the platform's `<dialog>`, shown with
 * `showModal`, so focus is held inside it, Escape closes it and focus goes
 * back to the button): its title names it, a close button sits by the
 * title, and its body is given a way to close it. Each opening draws a
 * fresh body, committed before the dialog shows, so the platform's first
 * focus lands in the body that stays.
 */
export function DialogButton({
  label,
  title,
  className = `${s.btn} ${s.btnSmall}`,
  children,
}: {
  /** The button's contents (an icon and words). */
  readonly label: ReactNode
  readonly title: string
  /** The button's look: a head's small button unless given. */
  readonly className?: string
  readonly children: (close: () => void) => ReactNode
}) {
  const titleId = useId()
  const [dialog, setDialog] = useState<HTMLDialogElement | null>(null)
  const [opened, setOpened] = useState(0)
  const close = () => dialog?.close()
  const open = () => {
    flushSync(() => setOpened((n) => n + 1))
    dialog?.showModal()
  }
  return (
    <>
      <button type="button" className={className} aria-haspopup="dialog" onClick={open}>
        {label}
      </button>
      <dialog ref={setDialog} className={`${kit.glass} ${s.dialog}`} aria-labelledby={titleId}>
        <div className={s.dialogHead}>
          <h2 id={titleId} className={s.dialogTitle}>
            {title}
          </h2>
          <button type="button" className={kit.iconButton} aria-label="Close" onClick={close}>
            <X size={16} aria-hidden />
          </button>
        </div>
        {opened > 0 && <div key={opened}>{children(close)}</div>}
      </dialog>
    </>
  )
}
