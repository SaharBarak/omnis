'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'
import { Moon, Sun } from 'lucide-react'
import { DEFAULT_THEME, labRoot, readTheme, subscribeTheme, writeTheme } from './lab-state'

/** Light-theme switch for the nearest lab root; the choice is remembered per viewer. */
export function ThemeToggle({ className }: { readonly className?: string }) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => DEFAULT_THEME)
  const light = theme === 'light'

  useEffect(() => {
    labRoot(buttonRef.current).setAttribute('data-theme', theme)
  }, [theme])

  return (
    <button
      ref={buttonRef}
      type="button"
      className={className}
      aria-label="Light theme"
      aria-pressed={light}
      onClick={() => writeTheme(light ? 'dark' : 'light')}
    >
      {light ? <Moon size={14} aria-hidden /> : <Sun size={14} aria-hidden />}
    </button>
  )
}
