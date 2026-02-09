'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

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
          {/* Kin badge */}
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
            <span className="text-base font-bold text-primary">{kin}</span>
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <p className="font-medium text-foreground truncate">{name}</p>
            <p className="text-sm text-muted-foreground truncate">{signature}</p>
          </div>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex gap-1.5 mt-3 flex-wrap">
            {tags.slice(0, 2).map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="text-[10px] px-2 py-0.5"
                style={{
                  backgroundColor: `${tag.color}15`,
                  color: tag.color,
                  borderColor: `${tag.color}30`,
                }}
              >
                {tag.name}
              </Badge>
            ))}
            {tags.length > 2 && (
              <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                +{tags.length - 2}
              </Badge>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
