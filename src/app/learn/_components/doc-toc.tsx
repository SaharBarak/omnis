'use client'

/**
 * Table of contents for the /learn guide pages — the guides run 17–28k px
 * tall, so the DocSection h2s each page declares get two entry points:
 *
 * - DocToc: sticky rail beside the article on xl+ viewports, with a cheap
 *   rAF-throttled scroll-spy highlight in the guide's flavor accent.
 * - DocTocInline: collapsed <details> jump list for narrow viewports,
 *   rendered by DocShell under the guide strip.
 */

import { useEffect, useState } from 'react'

import { TYPE } from '@/lib/design/landing-tokens'

export interface TocItem {
  /** Anchor id of the DocSection h2 this entry jumps to. */
  readonly id: string
  readonly label: string
}

/** Smooth-scroll to the section; scroll-mt on the h2 handles the nav offset. */
function jumpTo(event: React.MouseEvent<HTMLAnchorElement>, id: string) {
  const el = document.getElementById(id)
  if (!el) return
  event.preventDefault()
  el.scrollIntoView({ behavior: 'smooth' })
  window.history.replaceState(null, '', `#${id}`)
}

/** Sticky sidebar variant (xl+). Active section tinted with the flavor accent. */
export function DocToc({
  items,
  accentSoft,
}: {
  readonly items: readonly TocItem[]
  readonly accentSoft: string
}) {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    let ticking = false

    const update = () => {
      ticking = false
      // The active section is the last heading above the reading line.
      let current: string | null = null
      for (const item of items) {
        const el = document.getElementById(item.id)
        if (el && el.getBoundingClientRect().top <= 144) current = item.id
      }
      setActive(current)
    }
    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(update)
      }
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [items])

  return (
    <nav aria-label="On this page">
      <p className={`${TYPE.eyebrow} text-white/35`}>On this page</p>
      <ul className="mt-4 border-l border-white/10">
        {items.map((item) => {
          const isActive = active === item.id
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={(e) => jumpTo(e, item.id)}
                aria-current={isActive ? 'true' : undefined}
                className={`-ml-px block border-l py-1.5 pl-4 text-[13px] leading-snug transition-colors ${
                  isActive
                    ? 'border-current'
                    : 'border-transparent text-white/50 hover:text-white'
                }`}
                style={isActive ? { color: accentSoft } : undefined}
              >
                {item.label}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/** Collapsed jump list for viewports without room for the rail (below xl). */
export function DocTocInline({ items }: { readonly items: readonly TocItem[] }) {
  return (
    <details className="group mb-10 rounded-2xl border border-white/10 bg-surface xl:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 [&::-webkit-details-marker]:hidden">
        <span className={`${TYPE.eyebrow} text-white/50`}>On this page</span>
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4 text-white/35 transition-transform duration-200 group-open:rotate-180"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </summary>
      <ul className="space-y-1 border-t border-white/10 px-5 py-4">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={(e) => jumpTo(e, item.id)}
              className="block py-1 text-sm text-white/70 transition-colors hover:text-white"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </details>
  )
}
