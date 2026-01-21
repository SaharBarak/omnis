import Image from 'next/image'

// Dreamspell seal filenames (number to filename mapping)
const DREAMSPELL_FILENAMES: Record<number, string> = {
  1: '01-dragon',
  2: '02-wind',
  3: '03-night',
  4: '04-seed',
  5: '05-serpent',
  6: '06-world-bridger',
  7: '07-hand',
  8: '08-star',
  9: '09-moon',
  10: '10-dog',
  11: '11-monkey',
  12: '12-human',
  13: '13-skywalker',
  14: '14-wizard',
  15: '15-eagle',
  16: '16-warrior',
  17: '17-earth',
  18: '18-mirror',
  19: '19-storm',
  20: '20-sun',
}

// Tzolkin sign filenames (number to filename mapping)
const TZOLKIN_FILENAMES: Record<number, string> = {
  1: '01-imix',
  2: '02-ik',
  3: '03-akbal',
  4: '04-kan',
  5: '05-chikchan',
  6: '06-kimi',
  7: '07-manik',
  8: '08-lamat',
  9: '09-muluk',
  10: '10-ok',
  11: '11-chuwen',
  12: '12-eb',
  13: '13-ben',
  14: '14-ix',
  15: '15-men',
  16: '16-kib',
  17: '17-kaban',
  18: '18-etznab',
  19: '19-kawak',
  20: '20-ajaw',
}

const SIZE_MAP = {
  sm: 32,
  md: 48,
  lg: 64,
} as const

export interface SealIconProps {
  sealNumber: number
  size?: 'sm' | 'md' | 'lg'
  system?: 'dreamspell' | 'tzolkin'
  className?: string
}

export function SealIcon({
  sealNumber,
  size = 'md',
  system = 'dreamspell',
  className = '',
}: SealIconProps) {
  const pixels = SIZE_MAP[size]
  const filenames = system === 'dreamspell' ? DREAMSPELL_FILENAMES : TZOLKIN_FILENAMES
  const filename = filenames[sealNumber]
  const folder = system === 'dreamspell' ? 'dreamspell/seals' : 'tzolkin/signs'
  const src = `/icons/${folder}/${filename}.svg`

  return (
    <Image
      src={src}
      alt={`${system} ${system === 'dreamspell' ? 'seal' : 'sign'} ${sealNumber}`}
      width={pixels}
      height={pixels}
      className={className}
      loading="lazy"
    />
  )
}
