import Svg, { Circle, Line } from 'react-native-svg'

/**
 * The asterism — you at the core, kin as stars, map lines between.
 * Verbatim port of src/components/brand-mark.tsx (web). Colors are
 * hard-coded to the brand ramp by design; `mono` swaps to a single color.
 */

interface BrandMarkProps {
  size?: number
  mono?: string
}

export function BrandMark({ size = 28, mono }: BrandMarkProps) {
  const line = mono ?? '#A78FDF'
  const core = mono ?? '#7D5BC9'
  const bright = mono ?? '#EFEAFA'
  const soft = mono ?? '#A78FDF'
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Line x1={16} y1={16} x2={7} y2={9} stroke={line} strokeWidth={0.9} opacity={0.55} />
      <Line x1={16} y1={16} x2={25} y2={7} stroke={line} strokeWidth={0.9} opacity={0.55} />
      <Line x1={16} y1={16} x2={24} y2={24} stroke={line} strokeWidth={0.9} opacity={0.55} />
      <Line x1={16} y1={16} x2={8} y2={25} stroke={line} strokeWidth={0.9} opacity={0.55} />
      <Line x1={7} y1={9} x2={25} y2={7} stroke={line} strokeWidth={0.9} opacity={0.55} />
      <Circle cx={16} cy={16} r={3.4} fill={core} />
      <Circle cx={7} cy={9} r={2} fill={bright} />
      <Circle cx={25} cy={7} r={1.6} fill={soft} />
      <Circle cx={24} cy={24} r={1.8} fill={soft} />
      <Circle cx={8} cy={25} r={1.4} fill={bright} />
    </Svg>
  )
}
