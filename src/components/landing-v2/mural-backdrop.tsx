import Image from 'next/image'
import type { CSSProperties, ReactNode } from 'react'

// ============================================
// MURAL BACKDROP — a mural slice (or ambient video) returned to the
// page as partial atmosphere: a masked region feathered to nothing on
// every exposed edge, so the asset melts into MURAL_GROUND instead of
// sitting in a box. Decorative only — aria-hidden, pointer-events-none,
// zero JS. Drop it directly after <StarParallax /> inside a `relative`
// overflow-hidden <main>; the page's `relative` content stacks above it.
//
// Blend note: gold-on-black motifs (thread-of-light, traveler-glyph)
// use `blend` — mix-blend-screen drops their black field entirely, so
// only the light lands on the page. The mask + opacity live ON the img
// element itself: a masked/translucent WRAPPER would form an isolated
// stacking context and screen-blend against transparency (a no-op),
// bringing the black square back.
// ============================================

type Placement =
  | 'top'
  | 'bottom'
  | 'left-edge'
  | 'right-edge'
  | 'top-right'
  | 'center-vein'
  | 'halo-right'

/** Region the asset occupies — always partial, never a full-bleed box. */
const REGION: Record<Placement, string> = {
  top: 'inset-x-0 top-0 h-[34rem] md:h-[42rem]',
  bottom: 'inset-x-0 bottom-0 h-[30rem] md:h-[38rem]',
  'left-edge': 'inset-y-0 left-0 w-[55%] max-w-[34rem]',
  'right-edge': 'inset-y-0 right-0 w-[55%] max-w-[34rem]',
  'top-right': 'right-0 top-0 h-[30rem] w-[80%] max-w-[46rem] md:h-[38rem]',
  'center-vein': 'left-1/2 top-16 ml-[-7rem] h-[46rem] w-56 md:ml-[-10rem] md:w-80',
  'halo-right': 'right-[-4rem] top-20 h-[24rem] w-[24rem] md:right-0 md:h-[30rem] md:w-[30rem]',
}

/** Feather every edge that faces page content; viewport edges stay hard. */
const MASK: Record<Placement, string> = {
  top: 'linear-gradient(to bottom, black 0%, black 38%, transparent 100%)',
  bottom: 'linear-gradient(to top, black 0%, black 32%, transparent 100%)',
  'left-edge': 'radial-gradient(120% 85% at 0% 50%, black 0%, black 28%, transparent 74%)',
  'right-edge': 'radial-gradient(120% 85% at 100% 50%, black 0%, black 28%, transparent 74%)',
  'top-right': 'radial-gradient(110% 115% at 100% 0%, black 0%, black 26%, transparent 72%)',
  'center-vein': 'radial-gradient(58% 46% at 50% 44%, black 0%, black 30%, transparent 78%)',
  'halo-right': 'radial-gradient(closest-side at 50% 50%, black 0%, black 30%, transparent 82%)',
}

interface MuralBackdropProps {
  readonly placement: Placement
  /** Image asset. Omit when passing an <AmbientVideo> as children. */
  readonly src?: string
  /** 0–1. Kept low on purpose — this is weather, not content. */
  readonly opacity?: number
  /** mix-blend-screen: for light-on-black motifs whose field must vanish. */
  readonly blend?: boolean
  /** Extra classes for the img (e.g. object-contain for emblems). */
  readonly imgClassName?: string
  /** Ambient video (or other media) rendered inside the masked region. */
  readonly children?: ReactNode
}

export function MuralBackdrop({
  placement,
  src,
  opacity = 0.4,
  blend = false,
  imgClassName = 'object-cover',
  children,
}: MuralBackdropProps) {
  const mask = MASK[placement]
  const maskStyle: CSSProperties = {
    maskImage: mask,
    WebkitMaskImage: mask,
    opacity,
  }

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute select-none ${REGION[placement]}`}
    >
      {src ? (
        <Image
          src={src}
          alt=""
          fill
          sizes="(max-width: 768px) 90vw, 55vw"
          className={`${imgClassName} ${blend ? 'mix-blend-screen' : ''}`}
          style={maskStyle}
        />
      ) : (
        <div className="absolute inset-0" style={maskStyle}>
          {children}
        </div>
      )}
    </div>
  )
}
