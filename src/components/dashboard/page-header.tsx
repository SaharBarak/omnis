'use client'

import { type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Eyebrow } from '@/components/app-kit'
import { useFavorites } from '@/lib/hooks/use-favorites'

interface PageHeaderProps {
  title: string
  subtitle?: string
  /** Date/time display above the title */
  meta?: string
  actions?: ReactNode
  className?: string
}

/**
 * The star that bookmarks the current route (#78). It rides PageHeader so
 * every authed page gets it for free; favorites live on the profile and
 * surface in the sidebar's Favorites group.
 */
function FavoriteStar({ title }: { title: string }) {
  const pathname = usePathname()
  const { isFavorite, toggle, loaded } = useFavorites()
  if (!loaded || !pathname?.startsWith('/app')) return null
  const active = isFavorite(pathname)
  return (
    <button
      type="button"
      aria-label={active ? `Remove ${title} from favorites` : `Add ${title} to favorites`}
      aria-pressed={active}
      onClick={() => void toggle({ href: pathname, title })}
      className={cn(
        'mt-1 rounded-full p-1.5 transition-colors active:scale-[0.95]',
        active ? 'text-amber-300/90' : 'text-white/25 hover:text-white/60'
      )}
    >
      <Star className="size-4" fill={active ? 'currentColor' : 'none'} />
    </button>
  )
}

/**
 * Page header — kit grammar: mono micro-caps eyebrow above a
 * font-display title, four-step white text ramp. Shared by every
 * authed page, so the API stays stable.
 */
export function PageHeader({
  title,
  subtitle,
  meta,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div>
        {meta && <Eyebrow className="mb-1.5 block">{meta}</Eyebrow>}
        <div className="flex items-start gap-1.5">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-white/90 sm:text-3xl">
            {title}
          </h1>
          <FavoriteStar title={title} />
        </div>
        {subtitle && <p className="mt-0.5 text-white/50">{subtitle}</p>}
      </div>
      {actions && <div className="mt-3 flex gap-2 sm:mt-0">{actions}</div>}
    </div>
  )
}
