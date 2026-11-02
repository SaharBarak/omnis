import type { ReactElement } from 'react'
import { BRAND } from './identity'
import { LANTERN, lanternShape, markSvg, type MarkTone } from './mark'

/** The Open Graph card: 1200 × 630, the mark beside the name and its line. */
export const OG_SIZE = Object.freeze({ width: 1200, height: 630 })
/** The mark's height as a share of the card's. */
export const OG_MARK_FILL = 0.56
/** Clear space between the mark and the name, as a share of the mark's height. */
const OG_GAP = 0.3
export const OG_FONT = 'Space Grotesk'

/** The card as `next/og` reads it; the mark rides in as an SVG data URI. */
export function ogCard(tone: MarkTone): ReactElement {
  const markHeight = Math.round(OG_SIZE.height * OG_MARK_FILL)
  const { box } = lanternShape(LANTERN)
  const markWidth = (markHeight * box.width) / box.height
  const svg = markSvg({ fill: 1, ground: 'none', tone })
  const src = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        /* The image is square and the mark stands in its middle, so its side margins count toward the gap. */
        gap: markHeight * OG_GAP - (markHeight - markWidth) / 2,
        background: tone.tile,
        fontFamily: OG_FONT,
      }}
    >
      <img src={src} width={markHeight} height={markHeight} alt="" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: markHeight / 14 }}>
        <div style={{ fontSize: markHeight * 0.42, fontWeight: 700, letterSpacing: '-0.02em', color: tone.base, lineHeight: 1 }}>{BRAND.name}</div>
        <div style={{ fontSize: markHeight * 0.1, fontWeight: 500, color: tone.frame, maxWidth: 620, lineHeight: 1.25, textWrap: 'balance' }}>{BRAND.tagline}</div>
      </div>
    </div>
  )
}
