/**
 * The brand mark: rings of people around a core. Single source for every
 * inline rendering of the logo (nav, login, footer, sidebar). Colors are
 * fixed to the brand ramp, independent of the surrounding theme.
 */
export function BrandMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden>
      <circle cx="16" cy="16" r="14" fill="none" stroke="#A78FDF" strokeWidth="1.4" opacity="0.45" />
      <circle cx="16" cy="16" r="9" fill="none" stroke="#A78FDF" strokeWidth="1.4" opacity="0.7" />
      <circle cx="16" cy="16" r="4" fill="#7D5BC9" />
    </svg>
  )
}
