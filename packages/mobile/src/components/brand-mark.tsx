import Svg, { Path } from 'react-native-svg'

import { MARK_ASPECT, MARK_PARTS, MARK_PATHS, MARK_TONES, MARK_VIEWBOX } from './brand-mark.gen'
import { useTheme } from '@/theme/m3'

/**
 * The Lantern, Pleiad's mark (docs/redesign/BRAND_MARK.md). The drawing and
 * its tones are generated from the web's src/lib/brand by
 * `npm run brand:icons`; this only paints them. `size` is the mark's height.
 * `mono` paints every part one colour; the cuts are holes, so the lit window
 * still reads.
 */

interface BrandMarkProps {
  size?: number
  mono?: string
}

export function BrandMark({ size = 28, mono }: BrandMarkProps) {
  const { dark } = useTheme()
  const tone = MARK_TONES[dark ? 'dark' : 'light']
  return (
    <Svg width={size * MARK_ASPECT} height={size} viewBox={MARK_VIEWBOX}>
      {MARK_PARTS.map((part) => (
        <Path key={part} d={MARK_PATHS[part]} fill={mono ?? tone[part]} />
      ))}
    </Svg>
  )
}
