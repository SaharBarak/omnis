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
  /**
   * Generated loops rarely seam cleanly — ping-pong reverses playback at
   * each end instead of hard-cutting back to frame zero (MOTION_SPEC B2).
   */
  readonly pingPong?: boolean
}

function prefersStill(): boolean {
  if (typeof navigator === 'undefined') return false
  const connection = (navigator as { connection?: { saveData?: boolean } }).connection
  return connection?.saveData === true
}

export function AmbientVideo({
  webmSrc,
  mp4Src,
  poster,
  className,
  pingPong = true,
}: AmbientVideoProps) {
  const reducedMotion = useReducedMotion()
  const [stillOnly, setStillOnly] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    setStillOnly(prefersStill())
  }, [])

  // Ping-pong: reverse direction near each end via rAF-driven currentTime.
  useEffect(() => {
    const video = videoRef.current
    if (!video || !pingPong || reducedMotion || stillOnly) return
    let direction = 1
    let rafId = 0
    let lastTs = 0
    const tick = (ts: number) => {
      // Reverse by scrubbing currentTime; halt while offscreen (IO sets flag).
      if (direction === -1 && video.dataset.offscreen !== '1') {
        const dt = lastTs ? (ts - lastTs) / 1000 : 0
        video.currentTime = Math.max(0, video.currentTime - dt)
        if (video.currentTime <= 0.05) {
          direction = 1
          video.play().catch(() => undefined)
        }
      }
      lastTs = ts
      rafId = requestAnimationFrame(tick)
    }
    const onTimeUpdate = () => {
      if (direction === 1 && video.duration && video.currentTime >= video.duration - 0.08) {
        direction = -1
        video.pause()
      }
    }
    // Any external play (e.g. IO bringing it back onscreen) resets to forward.
    const onPlay = () => {
      direction = 1
    }
    video.addEventListener('timeupdate', onTimeUpdate)
    video.addEventListener('play', onPlay)
    rafId = requestAnimationFrame(tick)
    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate)
      video.removeEventListener('play', onPlay)
      cancelAnimationFrame(rafId)
    }
  }, [pingPong, reducedMotion, stillOnly])

  // Pause when offscreen, resume when visible.
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.dataset.offscreen = '0'
          video.play().catch(() => undefined)
        } else {
          video.dataset.offscreen = '1'
          video.pause()
        }
      },
      { threshold: 0.05 },
    )
    observer.observe(video)
    return () => observer.disconnect()
  }, [stillOnly, reducedMotion])

  if (reducedMotion || stillOnly) {
     
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
