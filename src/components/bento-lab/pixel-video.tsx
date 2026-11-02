'use client'

import { useEffect, useRef } from 'react'
import { REDUCED_MOTION, labRoot, motionAllowed, watchLabRoot } from './lab-state'
import styles from './kit.module.css'
import type { LabMedia } from '@/lib/data/lab-media'

interface PixelVideoProps {
  readonly media: LabMedia
  /** `auto` for the focal video only; secondary media waits for metadata. */
  readonly preload?: 'auto' | 'metadata'
  readonly className?: string
}

const ASSEMBLE_MS = 1300
const START_BLOCK = 44
const DPR_CAP = 1.5

interface Crop {
  readonly sx: number
  readonly sy: number
  readonly sw: number
  readonly sh: number
}

/** object-fit: cover, as a source rectangle. */
const coverCrop = (srcW: number, srcH: number, boxW: number, boxH: number): Crop => {
  const scale = Math.max(boxW / srcW, boxH / srcH)
  const sw = boxW / scale
  const sh = boxH / scale
  return { sx: (srcW - sw) / 2, sy: (srcH - sh) / 2, sw, sh }
}

const easeOutCubic = (p: number): number => 1 - (1 - p) ** 3

/**
 * Decorative looping video that assembles out of pixel blocks: the poster
 * pixelates in first, the live frame takes over once it decodes, and the
 * canvas hides itself at one-pixel blocks. The assemble replays on each scene
 * change by design. Playback follows visibility, the lab's pause control and
 * the OS reduced-motion setting; reduced motion holds the poster.
 */
export function PixelVideo({ media, preload = 'metadata', className }: PixelVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const root = labRoot(video)
    let visible = false

    const sync = (): void => {
      if (visible && motionAllowed(root)) video.play().catch(() => undefined)
      else video.pause()
    }

    const viewObserver = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false
      sync()
    })
    viewObserver.observe(video)
    const stopWatching = watchLabRoot(root, sync)

    return () => {
      viewObserver.disconnect()
      stopWatching()
    }
  }, [media])

  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    const tiny = document.createElement('canvas')
    const tinyCtx = tiny.getContext('2d')
    if (!video || !canvas || !ctx || !tinyCtx) return

    const motion = window.matchMedia(REDUCED_MOTION)
    const poster = new Image()
    poster.src = media.poster
    let raf = 0
    let started = 0
    let boxW = 0
    let boxH = 0

    const finish = (): void => {
      cancelAnimationFrame(raf)
      canvas.hidden = true
    }

    const measure = (): void => {
      const box = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP)
      boxW = Math.max(1, Math.round(box.width * dpr))
      boxH = Math.max(1, Math.round(box.height * dpr))
      canvas.width = boxW
      canvas.height = boxH
    }

    const frameSource = (): { el: CanvasImageSource; w: number; h: number } | null => {
      if (video.readyState >= 2 && video.videoWidth > 0) return { el: video, w: video.videoWidth, h: video.videoHeight }
      if (poster.complete && poster.naturalWidth > 0) return { el: poster, w: poster.naturalWidth, h: poster.naturalHeight }
      return null
    }

    const step = (now: number): void => {
      started ||= now
      const progress = Math.min(1, (now - started) / ASSEMBLE_MS)
      const block = Math.max(1, Math.round(START_BLOCK + (1 - START_BLOCK) * easeOutCubic(progress)))
      const frame = frameSource()

      if (frame) {
        const tw = Math.max(1, Math.ceil(boxW / block))
        const th = Math.max(1, Math.ceil(boxH / block))
        if (tiny.width !== tw || tiny.height !== th) {
          tiny.width = tw
          tiny.height = th
        }
        const { sx, sy, sw, sh } = coverCrop(frame.w, frame.h, boxW, boxH)
        tinyCtx.drawImage(frame.el, sx, sy, sw, sh, 0, 0, tw, th)
        ctx.imageSmoothingEnabled = false
        ctx.drawImage(tiny, 0, 0, tw, th, 0, 0, boxW, boxH)
      }

      canvas.style.opacity = String(progress < 0.82 ? 1 : 1 - (progress - 0.82) / 0.18)
      if (progress < 1) raf = requestAnimationFrame(step)
      else finish()
    }

    if (motion.matches) {
      finish()
      return
    }

    const sizeObserver = new ResizeObserver(measure)
    sizeObserver.observe(canvas)
    motion.addEventListener('change', finish)
    measure()
    canvas.hidden = false
    canvas.style.opacity = '1'
    raf = requestAnimationFrame(step)

    return () => {
      cancelAnimationFrame(raf)
      sizeObserver.disconnect()
      motion.removeEventListener('change', finish)
    }
  }, [media])

  return (
    <div className={[styles.media, className].filter(Boolean).join(' ')} aria-hidden="true">
      <video
        key={media.mp4}
        ref={videoRef}
        className={styles.mediaVideo}
        poster={media.poster}
        muted
        loop
        playsInline
        preload={preload}
      >
        <source src={media.webm} type="video/webm" />
        <source src={media.mp4} type="video/mp4" />
      </video>
      <canvas ref={canvasRef} className={styles.mediaCanvas} />
    </div>
  )
}
