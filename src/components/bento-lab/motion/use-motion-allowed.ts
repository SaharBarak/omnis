'use client'

import { useSyncExternalStore } from 'react'
import { THEME_ROOT, motionAllowed, subscribeMotion, watchLabRoot } from '../lab-state'

const root = (): Element => document.querySelector(THEME_ROOT) ?? document.documentElement

const subscribe = (onChange: () => void): (() => void) => {
  const stopRoot = watchLabRoot(root(), onChange)
  const stopPause = subscribeMotion(onChange)
  return () => {
    stopRoot()
    stopPause()
  }
}

/**
 * The one motion switch: the OS reduced-motion setting and the lab's pause,
 * read from the lab root (lab-state.ts). False on the server, so the first
 * render is the final frame.
 */
export const useMotionAllowed = (): boolean => useSyncExternalStore(subscribe, () => motionAllowed(root()), () => false)
