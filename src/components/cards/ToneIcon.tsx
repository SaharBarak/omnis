import Image from 'next/image'
import { getToneGlyphPath } from '@/lib/dreamspell-assets'

const SIZE_MAP = {
  xs: 20,
  sm: 28,
  md: 40,
  lg: 56,
} as const

export interface ToneIconProps {
  toneNumber: number
  size?: keyof typeof SIZE_MAP
  className?: string
}

export function ToneIcon({
  toneNumber,
  size = 'md',
  className = '',
}: ToneIconProps) {
  const pixels = SIZE_MAP[size]

  return (
    <Image
      src={getToneGlyphPath(toneNumber)}
      alt={`Tone ${toneNumber}`}
      width={pixels}
      height={pixels}
      className={className}
      loading="lazy"
      unoptimized
    />
  )
}
