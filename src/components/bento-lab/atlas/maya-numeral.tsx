import type { Point } from './geometry'
import { barDot, rowsOf } from '@/lib/atlas/maya-numeral'

/**
 * How a Maya numeral is drawn, as fractions of its width (the step) and of
 * its step (dot, bar and shell): the atlas tone mark's proportions, held once.
 */
const NUMERAL = Object.freeze({
  /** The pitch between rows and between dots. */
  step: 1 / 4,
  dotRadius: 0.4,
  /** A dot's centre below its row's top. */
  dotDrop: 0.375,
  barHeight: 0.6,
  /** The shell: half its width and half its height, and its stroke. */
  shellRx: 0.4,
  shellRy: 0.45,
  shellStroke: 0.3,
})

/** The pitch between a numeral's rows, for a numeral `width` wide. */
export const numeralStep = (width: number): number => width * NUMERAL.step

/** How far down its row the last row's ink reaches, in steps: a bar's height, a dot's foot, or the shell's foot. */
const lastInk = ({ bars, shell }: ReturnType<typeof barDot>): number =>
  shell ? 0.5 + NUMERAL.shellRy : bars > 0 ? NUMERAL.barHeight : NUMERAL.dotDrop + NUMERAL.dotRadius

/** The numeral's inked height: every row but the last at the full step, then the last row's ink. */
export const numeralHeight = (value: number, width: number): number => {
  const numeral = barDot(value)
  return ((rowsOf(numeral) - 1) + lastInk(numeral)) * numeralStep(width)
}

/** One Maya numeral, `top` at its first row and centred on `x`; dots above bars, a shell for zero. */
export function MayaNumeral({ value, x, top, width, className }: { readonly value: number; readonly x: number; readonly top: number; readonly width: number; readonly className?: string }) {
  const { bars, dots, shell } = barDot(value)
  const step = numeralStep(width)
  const bar = step * NUMERAL.barHeight
  if (shell) {
    return (
      <ellipse
        cx={x}
        cy={top + step / 2}
        rx={width * NUMERAL.shellRx}
        ry={step * NUMERAL.shellRy}
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth={step * NUMERAL.shellStroke}
      />
    )
  }
  return (
    <g className={className}>
      {Array.from({ length: dots }, (_, i) => (
        <circle key={`d${i}`} cx={x + (i - (dots - 1) / 2) * step} cy={top + step * NUMERAL.dotDrop} r={step * NUMERAL.dotRadius} />
      ))}
      {Array.from({ length: bars }, (_, i) => (
        <rect key={`b${i}`} x={x - width / 2} y={top + (dots > 0 ? step : 0) + i * step} width={width} height={bar} rx={bar / 2} />
      ))}
    </g>
  )
}

/** A numeral centred on a point, as the atlas sets the tone above the person's seal. */
export function CentredNumeral({ value, point, width, className }: { readonly value: number; readonly point: Point; readonly width: number; readonly className?: string }) {
  return <MayaNumeral value={value} x={point[0]} top={point[1] - numeralHeight(value, width) / 2} width={width} className={className} />
}
