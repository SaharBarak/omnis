'use client'

/**
 * SVG moon disc for a given Sun→Moon elongation angle (0 = new, 180 = full).
 * The lit region is a half-disc on the lit side plus/minus an elliptical
 * terminator whose x-radius follows cos(angle).
 */
export function MoonGlyph({
  angle,
  size = 48,
  className,
}: {
  angle: number
  size?: number
  className?: string
}) {
  const r = 45
  const c = 50
  const rad = (angle * Math.PI) / 180
  const rx = r * Math.abs(Math.cos(rad))
  const waxing = angle % 360 < 180
  const gibbous = ((angle % 360) + 360) % 360 > 90 && ((angle % 360) + 360) % 360 < 270

  // Outer edge runs down the lit side; the terminator arc returns to the top.
  const s1 = waxing ? 1 : 0
  const s2 = waxing ? (gibbous ? 1 : 0) : gibbous ? 0 : 1
  const litPath = `M ${c} ${c - r} A ${r} ${r} 0 0 ${s1} ${c} ${c + r} A ${rx} ${r} 0 0 ${s2} ${c} ${c - r} Z`

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`Moon at ${Math.round(angle)}°`}
    >
      <circle cx={c} cy={c} r={r} fill="#1a1d2e" stroke="rgba(239,234,250,0.25)" strokeWidth="2" />
      <path d={litPath} fill="#EFEAFA" opacity="0.92" />
    </svg>
  )
}
