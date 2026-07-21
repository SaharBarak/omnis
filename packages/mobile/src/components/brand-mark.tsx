import Svg, { Circle, Path } from 'react-native-svg'

/**
 * The Six-System Seal — a seed-of-life rosette with the self as a bright star
 * at the core and the six wisdom systems as nodes on the petals. Port of
 * src/components/brand-mark.tsx (web). Colors are the brand ramp by design;
 * `mono` swaps to a single color for single-color surfaces.
 */

interface BrandMarkProps {
  size?: number
  mono?: string
}

// Seed-of-life rosette: the central circle plus six around it.
const ROSETTE: ReadonlyArray<readonly [number, number]> = [
  [16, 16],
  [16, 10.5],
  [20.763, 13.25],
  [20.763, 18.75],
  [16, 21.5],
  [11.237, 18.75],
  [11.237, 13.25],
]
// The six system-nodes at the petal tips; alternating bright / soft.
const NODES: ReadonlyArray<readonly [number, number, boolean]> = [
  [16, 5, true],
  [25.526, 10.5, false],
  [25.526, 21.5, true],
  [16, 27, false],
  [6.474, 21.5, true],
  [6.474, 10.5, false],
]
const STAR =
  'M16 12.7L16.672 15.328L19.3 16L16.672 16.672L16 19.3L15.328 16.672L12.7 16L15.328 15.328Z'

export function BrandMark({ size = 28, mono }: BrandMarkProps) {
  const line = mono ?? '#A78FDF'
  const core = mono ?? '#7D5BC9'
  const bright = mono ?? '#EFEAFA'
  const soft = mono ?? '#A78FDF'
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Circle cx={16} cy={16} r={12.2} stroke={line} strokeWidth={0.4} opacity={0.36} />
      {ROSETTE.map(([cx, cy], i) => (
        <Circle
          key={`r${i}`}
          cx={cx}
          cy={cy}
          r={5.5}
          stroke={line}
          strokeWidth={0.5}
          opacity={0.4}
        />
      ))}
      {NODES.map(([cx, cy, isBright], i) => (
        <Circle
          key={`n${i}`}
          cx={cx}
          cy={cy}
          r={isBright ? 1.15 : 0.95}
          fill={isBright ? bright : soft}
          opacity={isBright ? 1 : 0.85}
        />
      ))}
      <Path d={STAR} fill={core} />
      <Circle cx={16} cy={16} r={1} fill={bright} />
    </Svg>
  )
}
