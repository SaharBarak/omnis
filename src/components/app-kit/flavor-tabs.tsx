'use client'

/**
 * Flavored segmented tabs — the web port of packages/mobile/src/
 * components/person/flavor-tabs.tsx. A horizontally scrolling pill row;
 * the active pill carries its system's folklore accent, and a hairline
 * under the row crossfades to the active accent (200ms). The moving
 * pill background is a framer-motion layoutId shared element.
 */

import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { SPRING } from './motion'
import { getFlavor, type AppFlavorKey } from './primitives'

export interface FlavorTab {
  readonly key: string
  readonly label: string
  readonly flavor: AppFlavorKey
}

export function FlavorTabs({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: readonly FlavorTab[]
  active: string
  onChange: (key: string) => void
  className?: string
}) {
  const reduced = useReducedMotion()
  const activeTab = tabs.find((t) => t.key === active) ?? tabs[0]
  const activeAccent = getFlavor(activeTab.flavor).accent

  return (
    <div className={cn('flex flex-col gap-0', className)}>
      <div
        role="tablist"
        aria-label="Reading systems"
        className="scroll-hide -mx-1 flex gap-1 overflow-x-auto px-1 pb-2"
      >
        {tabs.map((tab) => {
          const accent = getFlavor(tab.flavor).accent
          const isActive = tab.key === activeTab.key
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.key)}
              className={cn(
                'relative shrink-0 rounded-full px-4 py-1.5',
                'font-mono text-[11px] uppercase tracking-[0.2em]',
                'transition-colors duration-normal',
                isActive ? 'text-white/90' : 'text-white/50 hover:text-white/70'
              )}
              style={isActive ? { color: accent } : undefined}
            >
              {isActive && (
                <motion.span
                  layoutId="flavor-tab-pill"
                  transition={reduced ? { duration: 0 } : SPRING}
                  className="absolute inset-0 rounded-full border"
                  style={{
                    borderColor: `${accent}55`,
                    backgroundColor: `${accent}14`,
                  }}
                  aria-hidden
                />
              )}
              <span className="relative">{tab.label}</span>
            </button>
          )
        })}
      </div>
      <div
        aria-hidden
        className="h-px w-full transition-colors duration-normal"
        style={{
          background: `linear-gradient(90deg, ${activeAccent}59, ${activeAccent}14 60%, transparent)`,
        }}
      />
    </div>
  )
}
