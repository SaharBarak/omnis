/**
 * The brand mark: an asterism — you at the core, your kin as stars, the
 * map lines drawn between. Single source for every inline rendering of
 * the logo (nav, login, footer, onboarding, sidebar). Default colors are
 * the fixed brand ramp; pass mono for single-color surfaces (e.g. the
 * white-on-violet sidebar tile).
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
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden>
      <g stroke={line} strokeWidth="0.9" opacity="0.55">
        <line x1="16" y1="16" x2="7" y2="9" />
        <line x1="16" y1="16" x2="25" y2="7" />
        <line x1="16" y1="16" x2="24" y2="24" />
        <line x1="16" y1="16" x2="8" y2="25" />
        <line x1="7" y1="9" x2="25" y2="7" />
      </g>
      <circle cx="16" cy="16" r="3.4" fill={core} />
      <circle cx="7" cy="9" r="2" fill={bright} />
      <circle cx="25" cy="7" r="1.6" fill={soft} />
      <circle cx="24" cy="24" r="1.8" fill={soft} />
      <circle cx="8" cy="25" r="1.4" fill={bright} />
    </svg>
  )
}
