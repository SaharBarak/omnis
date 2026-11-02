import { linearSrgb, oklabOfLinearSrgb, type Oklch, type Vec3 } from './color'

/**
 * How far apart two colours look to a reader with full colour vision and to
 * readers with each dichromacy. The simulation is Machado, Oliveira and
 * Fernandes (2009) at severity 1.0, applied to linear-light sRGB; distance
 * is Euclidean in OKLab (ΔE OK, on the 0..1 scale). The data-visualisation
 * thresholds in BENTO_COLOR.md are calibrated to this model, so swapping the
 * model means recalibrating them.
 */

export const VISIONS = ['normal', 'protan', 'deutan', 'tritan'] as const
export type Vision = (typeof VISIONS)[number]
export type Dichromacy = Exclude<Vision, 'normal'>
export const DICHROMACIES: readonly Dichromacy[] = ['protan', 'deutan', 'tritan']

type Mat3 = readonly [Vec3, Vec3, Vec3]

const MACHADO: Readonly<Record<Dichromacy, Mat3>> = {
  protan: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deutan: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritan: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
}

const unit = (x: number): number => Math.min(1, Math.max(0, x))

const through = (m: Mat3, [r, g, b]: Vec3): Vec3 => [
  unit(m[0][0] * r + m[0][1] * g + m[0][2] * b),
  unit(m[1][0] * r + m[1][1] * g + m[1][2] * b),
  unit(m[2][0] * r + m[2][1] * g + m[2][2] * b),
]

/** The colour's OKLab coordinates as each vision perceives it, computed once per colour. */
export type Seen = Readonly<Record<Vision, Vec3>>

export function seen(color: Oklch): Seen {
  const rgb = linearSrgb(color)
  return {
    normal: oklabOfLinearSrgb(rgb),
    protan: oklabOfLinearSrgb(through(MACHADO.protan, rgb)),
    deutan: oklabOfLinearSrgb(through(MACHADO.deutan, rgb)),
    tritan: oklabOfLinearSrgb(through(MACHADO.tritan, rgb)),
  }
}

export const apart = (a: Seen, b: Seen, vision: Vision): number =>
  Math.hypot(a[vision][0] - b[vision][0], a[vision][1] - b[vision][1], a[vision][2] - b[vision][2])

/** The smallest distance any dichromacy sees between the two. */
export const apartDichromat = (a: Seen, b: Seen): number => Math.min(...DICHROMACIES.map((vision) => apart(a, b, vision)))
