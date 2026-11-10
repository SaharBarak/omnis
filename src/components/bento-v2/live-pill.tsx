import type { ReactNode } from 'react'
import f from './frame/frame.module.css'
import { beat } from '@/components/bento-lab/motion/loops'

/** A quiet pill whose dot beats while it is on screen: something here is now (BENTO_MOTION.md "Loops", status pulse). */
export function LivePill({ children }: { readonly children: ReactNode }) {
  return (
    <span className={`${f.pill} ${f.pillQuiet} ${f.live}`} {...beat}>
      {children}
    </span>
  )
}
