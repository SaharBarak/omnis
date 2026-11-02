import { DEFAULT_PALETTE, PALETTE_IDS, isPaletteId, type PaletteId } from '@/lib/design/palette-ids'

/**
 * Per-viewer lab state kept as attributes on the lab root, so CSS, canvases
 * and videos all read one source: `data-theme` (dark | light, remembered),
 * `data-palette` (remembered) and `data-motion` (running | paused, this visit
 * only).
 */

export type LabTheme = 'dark' | 'light'

export const THEME_ROOT = '[data-lab]'
export const THEME_STORAGE_KEY = 'pleiad.lab.theme'
export const PALETTE_STORAGE_KEY = 'pleiad.lab.palette'
export const DEFAULT_THEME: LabTheme = 'dark'
export const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

const THEME_EVENT = 'pleiad:lab-theme'
const MOTION_EVENT = 'pleiad:lab-motion'
const PALETTE_EVENT = 'pleiad:lab-palette'

/** Runs inline before first paint so a remembered theme or palette never flashes the default. */
export const THEME_BOOT_SCRIPT = `(function(){try{var r=document.currentScript.parentElement;if(localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)})==='light'){r.setAttribute('data-theme','light')}var p=localStorage.getItem(${JSON.stringify(PALETTE_STORAGE_KEY)});if(${JSON.stringify(
  PALETTE_IDS,
)}.indexOf(p)>=0){r.setAttribute('data-palette',p)}}catch(e){}})()`

export const labRoot = (from: Element | null): Element => from?.closest(THEME_ROOT) ?? document.documentElement

export const readTheme = (): LabTheme => {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) === 'light' ? 'light' : DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

export const writeTheme = (theme: LabTheme): void => remember(THEME_STORAGE_KEY, theme, THEME_EVENT)

export const subscribeTheme = (onChange: () => void): (() => void) => {
  window.addEventListener('storage', onChange)
  window.addEventListener(THEME_EVENT, onChange)
  return () => {
    window.removeEventListener('storage', onChange)
    window.removeEventListener(THEME_EVENT, onChange)
  }
}

const remember = (key: string, value: string, event: string): void => {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Private mode or blocked storage: the choice lasts for this visit only.
  }
  window.dispatchEvent(new Event(event))
}

export const readPaletteChoice = (): PaletteId => {
  try {
    const stored = window.localStorage.getItem(PALETTE_STORAGE_KEY)
    return isPaletteId(stored) ? stored : DEFAULT_PALETTE
  } catch {
    return DEFAULT_PALETTE
  }
}

export const writePaletteChoice = (palette: PaletteId): void => remember(PALETTE_STORAGE_KEY, palette, PALETTE_EVENT)

export const subscribePaletteChoice = (onChange: () => void): (() => void) => {
  window.addEventListener('storage', onChange)
  window.addEventListener(PALETTE_EVENT, onChange)
  return () => {
    window.removeEventListener('storage', onChange)
    window.removeEventListener(PALETTE_EVENT, onChange)
  }
}

export const isMotionPaused = (root: Element): boolean => root.getAttribute('data-motion') === 'paused'

export const setMotionPaused = (root: Element, paused: boolean): void => {
  root.setAttribute('data-motion', paused ? 'paused' : 'running')
  window.dispatchEvent(new Event(MOTION_EVENT))
}

export const subscribeMotion = (onChange: () => void): (() => void) => {
  window.addEventListener(MOTION_EVENT, onChange)
  return () => window.removeEventListener(MOTION_EVENT, onChange)
}

/** Watches the root's theme, palette and motion attributes plus the OS reduced-motion setting. */
export function watchLabRoot(root: Element, onChange: () => void): () => void {
  const motion = window.matchMedia(REDUCED_MOTION)
  const attributes = new MutationObserver(onChange)
  attributes.observe(root, { attributes: true, attributeFilter: ['data-theme', 'data-palette', 'data-motion'] })
  motion.addEventListener('change', onChange)
  return () => {
    attributes.disconnect()
    motion.removeEventListener('change', onChange)
  }
}

export const motionAllowed = (root: Element): boolean =>
  !window.matchMedia(REDUCED_MOTION).matches && !isMotionPaused(root)
