/**
 * The brand mark: the Six-System Seal — a seed-of-life rosette with the self as
 * a bright star at the core and the six wisdom systems as nodes on the petals.
 * Single source for every inline rendering of the logo (nav, login, footer,
 * onboarding, sidebar) and the shape behind the favicon / app icons. Default
 * colors are the fixed brand ramp; pass mono for single-color surfaces (e.g.
 * the white-on-violet sidebar tile). No gradients, so it is safe to render many
 * times on one page without id collisions.
 */
export function BrandMark({
  size = 28,
  className,
  mono = false,
}: {
  size?: number
  className?: string
  mono?: boolean
}) {
  const line = mono ? 'currentColor' : '#A78FDF'
  const core = mono ? 'currentColor' : '#7D5BC9'
  const bright = mono ? 'currentColor' : '#EFEAFA'
  const soft = mono ? 'currentColor' : '#A78FDF'

  // Seed-of-life rosette: the central circle plus six around it, each of the
  // same radius centred one radius out along the six hexagonal directions.
  const rosette: ReadonlyArray<readonly [number, number]> = [
    [16, 16],
    [16, 10.5],
    [20.763, 13.25],
    [20.763, 18.75],
    [16, 21.5],
    [11.237, 18.75],
    [11.237, 13.25],
  ]
  // The six system-nodes sit at the petal tips (two radii out); alternating
  // bright / soft so they read as distinct points at any size.
  const nodes: ReadonlyArray<readonly [number, number, string, number]> = [
    [16, 5, bright, 1],
    [25.526, 10.5, soft, 0.85],
    [25.526, 21.5, bright, 1],
    [16, 27, soft, 0.85],
    [6.474, 21.5, bright, 1],
    [6.474, 10.5, soft, 0.85],
  ]

  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden>
      <g stroke={line} fill="none">
        <circle cx="16" cy="16" r="12.2" strokeWidth="0.4" opacity="0.36" />
        {rosette.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="5.5" strokeWidth="0.5" opacity="0.4" />
        ))}
      </g>
      {nodes.map(([x, y, c, o], i) => (
        <circle key={i} cx={x} cy={y} r={i % 2 === 0 ? 1.15 : 0.95} fill={c} opacity={o} />
      ))}
      {/* Self at the core: a four-point star. */}
      <path
        d="M16 12.7L16.672 15.328L19.3 16L16.672 16.672L16 19.3L15.328 16.672L12.7 16L15.328 15.328Z"
        fill={core}
      />
      <circle cx="16" cy="16" r="1" fill={bright} />
    </svg>
  )
}
