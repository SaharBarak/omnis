'use client'

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

// ============================================
// AMBIENT VIDEO — MOTION_SPEC playback contract in one place:
// poster still fallback, reduced-motion → still, Save-Data → still,
// IntersectionObserver pause when offscreen.
// ============================================

interface AmbientVideoProps {
  readonly webmSrc: string
  readonly mp4Src: string
  readonly poster: string
  readonly className?: string
}

function prefersStill(): boolean {
  if (typeof navigator === 'undefined') return false
  const connection = (navigator as { connection?: { saveData?: boolean } }).connection
  return connection?.saveData === true
}

export function AmbientVideo({ webmSrc, mp4Src, poster, className }: AmbientVideoProps) {
  const reducedMotion = useReducedMotion()
  const [stillOnly, setStillOnly] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    setStillOnly(prefersStill())
  }, [])

  // Pause when offscreen, resume when visible.
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => undefined)
        } else {
          video.pause()
        }
      },
      { threshold: 0.05 },
    )
    observer.observe(video)
    return () => observer.disconnect()
  }, [stillOnly, reducedMotion])

  if (reducedMotion || stillOnly) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={poster} alt="" className={className} />
  }

  return (
    <video
      ref={videoRef}
      className={className}
      autoPlay
      muted
      loop
      playsInline
      poster={poster}
    >
      <source src={webmSrc} type="video/webm" />
      <source src={mp4Src} type="video/mp4" />
    </video>
  )
}
