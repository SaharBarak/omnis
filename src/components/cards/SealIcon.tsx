import Image from 'next/image'
import { getSealGlyphPath, getSmallSealGlyphPath, getMayaTzolkinGlyphPath } from '@/lib/dreamspell-assets'

const SIZE_MAP = {
  xs: 24,
  sm: 32,
  md: 48,
  lg: 64,
  xl: 80,
} as const

export interface SealIconProps {
  sealNumber: number
  size?: keyof typeof SIZE_MAP
  system?: 'dreamspell' | 'tzolkin'
  className?: string
}

export function SealIcon({
  sealNumber,
  size = 'md',
  system = 'dreamspell',
  className = '',
}: SealIconProps) {
  const pixels = SIZE_MAP[size]

  // Use starroot glyph GIFs for dreamspell, MayaTzolkin PNGs for tzolkin
  const src = system === 'dreamspell'
    ? (pixels <= 32 ? getSmallSealGlyphPath(sealNumber) : getSealGlyphPath(sealNumber))
    : getMayaTzolkinGlyphPath(sealNumber)

  return (
    <Image
      src={src}
      alt={`${system} ${system === 'tzolkin' ? 'sign' : 'seal'} ${sealNumber}`}
      width={pixels}
      height={pixels}
      className={className}
      loading="lazy"
      unoptimized
    />
  )
}
