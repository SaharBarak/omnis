import '@fontsource/space-grotesk/600.css'
import '@fontsource/barlow/500.css'
import { useEffect, useState } from 'react'
import { AbsoluteFill, Easing, Img, Sequence, continueRender, delayRender, interpolate, staticFile, useCurrentFrame } from 'remotion'

/**
 * Pleiad product film, home section 2. Every frame is a real capture of the
 * running app at 2x. Shotcraft rules: one camera move per shot, a hold after
 * each reveal, hard cuts between shots, type and colour from the product's
 * tokens, no randomness.
 */

export const FPS = 30
export const WIDTH = 1600
export const HEIGHT = 1000
const ASPECT = HEIGHT / WIDTH

// Product tokens (src/lib/design/landing-tokens.ts).
const GROUND = '#0B0D16'
const BRAND = '#7D5BC9'
const BRAND_BRIGHT = '#EFEAFA'
const DISPLAY = '"Space Grotesk", system-ui, sans-serif'
const BODY = '"Barlow", system-ui, sans-serif'

interface Cam {
  readonly x: number
  readonly y: number
  /** Width of the source region in view; height follows the 16:10 frame. */
  readonly w: number
}

interface Shot {
  readonly src: string
  readonly size: readonly [number, number]
  readonly duration: number
  readonly from: Cam
  readonly to: Cam
  /** Frames the camera spends moving; the rest of the shot is the hold. */
  readonly move: number
  readonly eyebrow: string
  readonly caption: string
}

const SHOTS: readonly Shot[] = [
  {
    src: '1b-calculate-filled.png',
    size: [2880, 1800],
    duration: 90,
    from: { x: 0, y: 0, w: 2880 },
    to: { x: 560, y: 350, w: 1760 },
    move: 55,
    eyebrow: '01 · One person',
    caption: 'Start with one birth date',
  },
  {
    src: '1c-calculate-result.png',
    size: [2880, 6940],
    duration: 165,
    from: { x: 560, y: 700, w: 1760 },
    to: { x: 560, y: 1600, w: 1760 },
    move: 110,
    eyebrow: '01 · One person',
    caption: 'Kin 60, Galactic Sun, and its oracle',
  },
  {
    src: '2a-compat-filled.png',
    size: [2880, 1800],
    duration: 90,
    from: { x: 360, y: 300, w: 2160 },
    to: { x: 620, y: 760, w: 1640 },
    move: 55,
    eyebrow: '02 · Two people',
    caption: 'Pick any two',
  },
  {
    src: '2b-compat-result.png',
    size: [2880, 5478],
    duration: 105,
    from: { x: 560, y: 1560, w: 1760 },
    to: { x: 560, y: 2100, w: 1760 },
    move: 66,
    eyebrow: '02 · Two people',
    caption: 'Each system scored on its own',
  },
  {
    src: '2b-compat-result.png',
    size: [2880, 5478],
    duration: 105,
    from: { x: 560, y: 3000, w: 1760 },
    to: { x: 730, y: 3160, w: 1400 },
    move: 60,
    eyebrow: '02 · Two people',
    caption: "Ari is Maya's guide",
  },
  {
    src: '3a-today.png',
    size: [2880, 4694],
    duration: 165,
    from: { x: 560, y: 120, w: 1760 },
    to: { x: 560, y: 1560, w: 1760 },
    move: 120,
    eyebrow: '03 · Every day',
    caption: 'Read the day across the calendars',
  },
]

const END_CARD = 60

const starts = SHOTS.reduce<number[]>((acc, shot, i) => [...acc, i === 0 ? 0 : acc[i - 1] + SHOTS[i - 1].duration], [])
const END_AT = starts[starts.length - 1] + SHOTS[SHOTS.length - 1].duration
export const TOTAL = END_AT + END_CARD

const ease = Easing.bezier(0.45, 0, 0.15, 1)

const clampCam = (cam: Cam, [w, h]: readonly [number, number]): Cam => {
  const vh = cam.w * ASPECT
  return { w: cam.w, x: Math.min(Math.max(cam.x, 0), w - cam.w), y: Math.min(Math.max(cam.y, 0), h - vh) }
}

function Screen({ shot }: { shot: Shot }) {
  const frame = useCurrentFrame()
  const t = interpolate(frame, [0, shot.move], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease })
  const cam = clampCam(
    {
      x: shot.from.x + (shot.to.x - shot.from.x) * t,
      y: shot.from.y + (shot.to.y - shot.from.y) * t,
      w: shot.from.w + (shot.to.w - shot.from.w) * t,
    },
    shot.size,
  )
  const k = WIDTH / cam.w
  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: GROUND }}>
      <Img
        src={staticFile(shot.src)}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: shot.size[0],
          height: shot.size[1],
          maxWidth: 'none',
          transformOrigin: '0 0',
          transform: `translate(${-cam.x * k}px, ${-cam.y * k}px) scale(${k})`,
        }}
      />
    </AbsoluteFill>
  )
}

function Caption({ eyebrow, text }: { eyebrow: string; text: string }) {
  const frame = useCurrentFrame()
  const enter = interpolate(frame, [6, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease })
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end' }}>
      <div
        style={{
          height: 340,
          background: `linear-gradient(to top, ${GROUND} 0%, ${GROUND} 50%, ${GROUND}00 100%)`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '0 72px 60px',
        }}
      >
        <div style={{ opacity: enter, transform: `translateY(${(1 - enter) * 10}px)` }}>
          <div style={{ fontFamily: BODY, fontWeight: 500, fontSize: 20, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#A78FDF' }}>{eyebrow}</div>
          <div style={{ marginTop: 10, fontFamily: DISPLAY, fontWeight: 600, fontSize: 56, lineHeight: 1.05, letterSpacing: '-0.03em', color: BRAND_BRIGHT }}>{text}</div>
        </div>
      </div>
    </AbsoluteFill>
  )
}

function EndCard() {
  const frame = useCurrentFrame()
  const enter = interpolate(frame, [0, 16], [0, 1], { extrapolateRight: 'clamp', easing: ease })
  return (
    <AbsoluteFill style={{ backgroundColor: GROUND, alignItems: 'center', justifyContent: 'center', opacity: enter }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
        <div style={{ width: 22, height: 22, borderRadius: '50%', background: BRAND, boxShadow: `0 0 0 10px ${BRAND}33` }} />
        <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 84, letterSpacing: '-0.035em', color: BRAND_BRIGHT }}>Pleiad</div>
      </div>
      <div style={{ marginTop: 18, fontFamily: BODY, fontWeight: 500, fontSize: 26, color: '#A78FDF' }}>pleiad.io</div>
    </AbsoluteFill>
  )
}

const useFonts = () => {
  const [handle] = useState(() => delayRender('fonts'))
  useEffect(() => {
    Promise.all([document.fonts.load(`600 56px ${DISPLAY}`), document.fonts.load(`500 20px ${BODY}`)]).then(
      () => continueRender(handle),
      () => continueRender(handle),
    )
  }, [handle])
}

export function ProductFilm() {
  useFonts()
  return (
    <AbsoluteFill style={{ backgroundColor: GROUND }}>
      {SHOTS.map((shot, i) => (
        <Sequence key={`${shot.src}-${i}`} from={starts[i]} durationInFrames={shot.duration}>
          <Screen shot={shot} />
          <Caption eyebrow={shot.eyebrow} text={shot.caption} />
        </Sequence>
      ))}
      <Sequence from={END_AT} durationInFrames={END_CARD}>
        <EndCard />
      </Sequence>
    </AbsoluteFill>
  )
}
