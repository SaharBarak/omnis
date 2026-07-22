'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Pill } from '@/components/app-kit'

interface Tag {
  id: string
  name: string
  color: string
}

interface PersonPreviewProps {
  id: string
  name: string
  kin: number
  signature: string // e.g. "Rhythmic Serpent"
  tags?: Tag[]
  className?: string
}

/**
 * Person card — tokened kin disc (brand alpha, mono tabular numeral)
 * and tag pills through the kit's accent-alpha pattern. Tag colors are
 * user data, passed to Pill's accent prop, never hand-mixed hex styles.
 */
export function PersonPreview({
  id,
  name,
  kin,
  signature,
  tags = [],
  className,
}: PersonPreviewProps) {
  return (
    <Link href={`/app/people/${id}`}>
      <div className={cn('interactive-card p-4', className)}>
        <div className="flex items-center gap-3">
          {/* Kin disc */}
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/[0.08]">
            <span className="font-mono text-base text-brand-bright [font-variant-numeric:tabular-nums]">
              {kin}
            </span>
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-white/90">{name}</p>
            <p className="truncate text-sm text-white/50">{signature}</p>
          </div>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.slice(0, 2).map((tag) => (
              <Pill
                key={tag.id}
                accent={tag.color}
                className="px-2.5 py-0.5 text-[10px] tracking-[0.14em]"
              >
                {tag.name}
              </Pill>
            ))}
            {tags.length > 2 && (
              <Pill className="px-2.5 py-0.5 text-[10px] tracking-[0.14em]">
                +{tags.length - 2}
              </Pill>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
