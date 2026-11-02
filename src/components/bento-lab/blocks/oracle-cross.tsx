import b from './blocks.module.css'
import type { GlyphRef, MayaLayer } from '@/lib/atlas/types'

const Seat = ({ role, seal, area, lit }: { role: string; seal: GlyphRef; area: string; lit?: boolean }) => (
  <figure className={`${b.seat} ${lit ? b.seatLit : ''}`} style={{ gridArea: area }}>
    { }
    <img src={seal.src} alt="" width={40} height={40} className={b.seatGlyph} />
    <figcaption>
      <strong>{seal.name}</strong>
      <span>{role}</span>
    </figcaption>
  </figure>
)

/** The Dreamspell oracle: guide above, analog right, antipode left, occult below, the kin's own seal in the middle. */
export function OracleCross({ maya }: { readonly maya: MayaLayer }) {
  return (
    <div className={b.cross} role="group" aria-label={`Oracle of kin ${maya.kin}`}>
      <Seat role="Guide" seal={maya.oracle.guide} area="guide" />
      <Seat role="Antipode" seal={maya.oracle.antipode} area="antipode" />
      <Seat role={`Kin ${maya.kin}`} seal={maya.seal} area="self" lit />
      <Seat role="Analog" seal={maya.oracle.analog} area="analog" />
      <Seat role="Occult" seal={maya.oracle.occult} area="occult" />
    </div>
  )
}
