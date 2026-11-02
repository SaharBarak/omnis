/**
 * Colour math for palettes authored in OKLCH (CSS Color 4): conversion to
 * sRGB and Display P3, the CSS Color 4 gamut-mapping algorithm, and WCAG 2
 * contrast. Pure and dependency-free; matrices are the ones published in the
 * CSS Color 4 sample code and by Björn Ottosson (OKLab).
 */

export interface Oklch {
  readonly l: number
  readonly c: number
  readonly h: number
}

export type Vec3 = readonly [number, number, number]
type Mat3 = readonly [Vec3, Vec3, Vec3]

export type Gamut = 'srgb' | 'p3'

const mul = (m: Mat3, v: Vec3): Vec3 => [
  m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
  m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
  m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
]

const LAB_TO_LMS: Mat3 = [
  [1, 0.3963377774, 0.2158037573],
  [1, -0.1055613458, -0.0638541728],
  [1, -0.0894841775, -1.291485548],
]
const LMS_TO_SRGB: Mat3 = [
  [4.0767416621, -3.3077115913, 0.2309699292],
  [-1.2684380046, 2.6097574011, -0.3413193965],
  [-0.0041960863, -0.7034186147, 1.707614701],
]
const SRGB_TO_LMS: Mat3 = [
  [0.4122214708, 0.5363325363, 0.0514459929],
  [0.2119034982, 0.6806995451, 0.1073969566],
  [0.0883024619, 0.2817188376, 0.6299787005],
]
const LMS_TO_LAB: Mat3 = [
  [0.2104542553, 0.793617785, -0.0040720468],
  [1.9779984951, -2.428592205, 0.4505937099],
  [0.0259040371, 0.7827717662, -0.808675766],
]
const SRGB_TO_XYZ: Mat3 = [
  [0.41239079926595934, 0.357584339383878, 0.1804807884018343],
  [0.21263900587151027, 0.715168678767756, 0.07219231536073371],
  [0.01933081871559182, 0.11919477979462598, 0.9505321522496607],
]
const XYZ_TO_SRGB: Mat3 = [
  [3.2409699419045226, -1.537383177570094, -0.4986107602930034],
  [-0.9692436362808796, 1.8759675015077202, 0.04155505740717559],
  [0.05563007969699366, -0.20397695888897652, 1.0569715142428786],
]
const P3_TO_XYZ: Mat3 = [
  [0.4865709486482162, 0.26566769316909306, 0.1982172852343625],
  [0.2289745640697488, 0.6917385218365064, 0.079286914093745],
  [0, 0.04511338185890264, 1.043944368900976],
]
const XYZ_TO_P3: Mat3 = [
  [2.493496911941425, -0.9313836179191239, -0.40271078445071684],
  [-0.8294889695615747, 1.7626640603183463, 0.023624685841943577],
  [0.03584583024378447, -0.07617238926804182, 0.9568845240076872],
]

const toLab = ({ l, c, h }: Oklch): Vec3 => {
  const rad = (h * Math.PI) / 180
  return [l, c * Math.cos(rad), c * Math.sin(rad)]
}

const toLch = ([l, a, b]: Vec3): Oklch => {
  const h = (Math.atan2(b, a) * 180) / Math.PI
  return { l, c: Math.hypot(a, b), h: h < 0 ? h + 360 : h }
}

const labToLinearSrgb = (lab: Vec3): Vec3 => {
  const [l, m, s] = mul(LAB_TO_LMS, lab)
  return mul(LMS_TO_SRGB, [l ** 3, m ** 3, s ** 3])
}

const linearSrgbToLab = (rgb: Vec3): Vec3 => {
  const [l, m, s] = mul(SRGB_TO_LMS, rgb)
  return mul(LMS_TO_LAB, [Math.cbrt(l), Math.cbrt(m), Math.cbrt(s)])
}

const SPACES: Readonly<Record<Gamut, { readonly fromLab: (lab: Vec3) => Vec3; readonly toLab: (rgb: Vec3) => Vec3 }>> = {
  srgb: { fromLab: labToLinearSrgb, toLab: linearSrgbToLab },
  p3: {
    fromLab: (lab) => mul(XYZ_TO_P3, mul(SRGB_TO_XYZ, labToLinearSrgb(lab))),
    toLab: (rgb) => linearSrgbToLab(mul(XYZ_TO_SRGB, mul(P3_TO_XYZ, rgb))),
  },
}

/** The sRGB transfer curve; Display P3 shares it. */
const encode = (x: number): number => {
  const a = Math.abs(x)
  return Math.sign(x) * (a <= 0.0031308 ? 12.92 * a : 1.055 * a ** (1 / 2.4) - 0.055)
}

const decode = (x: number): number => {
  const a = Math.abs(x)
  return Math.sign(x) * (a <= 0.04045 ? a / 12.92 : ((a + 0.055) / 1.055) ** 2.4)
}

const GAMUT_EPSILON = 0.000075
const inGamut = (rgb: Vec3): boolean => rgb.every((x) => x >= -GAMUT_EPSILON && x <= 1 + GAMUT_EPSILON)
const clip = (rgb: Vec3): Vec3 => [Math.min(1, Math.max(0, rgb[0])), Math.min(1, Math.max(0, rgb[1])), Math.min(1, Math.max(0, rgb[2]))]
const deltaEOK = (a: Vec3, b: Vec3): number => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])

/** Encoded (gamma) channels, 0..1. */
const encoded = (lab: Vec3, gamut: Gamut): Vec3 => {
  const [r, g, b] = SPACES[gamut].fromLab(lab)
  return [encode(r), encode(g), encode(b)]
}

const fromEncoded = (rgb: Vec3, gamut: Gamut): Vec3 => SPACES[gamut].toLab([decode(rgb[0]), decode(rgb[1]), decode(rgb[2])])

const JND = 0.02
const CHROMA_EPSILON = 0.0001

/**
 * CSS Color 4 gamut mapping: keep lightness and hue, reduce chroma until the
 * clipped colour is within one just-noticeable difference. Returns encoded
 * channels in the target gamut.
 */
export function gamutMap(color: Oklch, gamut: Gamut): Vec3 {
  if (color.l >= 1) return [1, 1, 1]
  if (color.l <= 0) return [0, 0, 0]
  const origin = encoded(toLab(color), gamut)
  if (inGamut(origin)) return clip(origin)
  const at = (c: number): Vec3 => encoded(toLab({ ...color, c }), gamut)
  let clipped = clip(origin)
  if (deltaEOK(fromEncoded(clipped, gamut), toLab(color)) < JND) return clipped
  let min = 0
  let max = color.c
  let minInGamut = true
  while (max - min > CHROMA_EPSILON) {
    const chroma = (min + max) / 2
    const current = at(chroma)
    if (minInGamut && inGamut(current)) {
      min = chroma
      continue
    }
    clipped = clip(current)
    const e = deltaEOK(fromEncoded(clipped, gamut), toLab({ ...color, c: chroma }))
    if (e < JND) {
      if (JND - e < CHROMA_EPSILON) return clipped
      minInGamut = false
      min = chroma
    } else {
      max = chroma
    }
  }
  return clipped
}

const byte = (x: number): string => Math.round(x * 255).toString(16).padStart(2, '0')
const fixed = (x: number): string => String(Number(x.toFixed(4)))

export const toHex = (color: Oklch): string => {
  const [r, g, b] = gamutMap(color, 'srgb')
  return `#${byte(r)}${byte(g)}${byte(b)}`
}

export const toOklch = (color: Oklch): string => `oklch(${fixed(color.l)} ${fixed(color.c)} ${fixed(color.h)})`

export const hexToOklch = (hex: string): Oklch => {
  const n = Number.parseInt(hex.replace('#', ''), 16)
  return toLch(fromEncoded([((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255], 'srgb'))
}

/** Linear-light sRGB channels of the colour as it renders: gamut-mapped and quantised to the 8 bits a hex carries. */
export const linearSrgb = (color: Oklch): Vec3 => gamutMap(color, 'srgb').map((x) => decode(Math.round(x * 255) / 255)) as unknown as Vec3

/** OKLab coordinates of linear-light sRGB channels. */
export const oklabOfLinearSrgb = (rgb: Vec3): Vec3 => linearSrgbToLab(rgb)

/** WCAG 2 relative luminance of the colour as it renders in sRGB, so a solved contrast holds for the emitted hex. */
export const luminance = (color: Oklch): number => {
  const [r, g, b] = linearSrgb(color)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG 2 contrast ratio, 1..21. */
export const contrast = (a: Oklch, b: Oklch): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const LIGHTNESS_EPSILON = 0.001

/**
 * The lightness nearest to `preferred` (moving towards `towards`, 0 or 1) at
 * which the colour reaches `ratio` against every backdrop. Hue and chroma are
 * kept; chroma is gamut-mapped at render.
 */
export function solveLightness(color: Oklch, backdrops: readonly Oklch[], ratio: number, towards: 0 | 1): Oklch {
  const passes = (l: number): boolean => backdrops.every((b) => contrast({ ...color, l }, b) >= ratio)
  if (passes(color.l)) return color
  let near = color.l
  let far: number = towards
  if (!passes(far)) return { ...color, l: far }
  while (Math.abs(far - near) > LIGHTNESS_EPSILON) {
    const mid = (near + far) / 2
    if (passes(mid)) far = mid
    else near = mid
  }
  return { ...color, l: far }
}

/** CSS `color-mix(in oklab, a, b share)`: `share` of the way from a to b in OKLab. */
export const mix = (a: Oklch, b: Oklch, share: number): Oklch => {
  const [x, y] = [toLab(a), toLab(b)]
  return toLch([x[0] + (y[0] - x[0]) * share, x[1] + (y[1] - x[1]) * share, x[2] + (y[2] - x[2]) * share])
}

/** Shortest distance between two hues on the wheel, in degrees. */
export const hueDistance = (a: number, b: number): number => {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

/** Perceptual distance (ΔE OK) between two colours as they render in a gamut. */
export const difference = (a: Oklch, b: Oklch, gamut: Gamut = 'srgb'): number =>
  deltaEOK(fromEncoded(gamutMap(a, gamut), gamut), fromEncoded(gamutMap(b, gamut), gamut))

