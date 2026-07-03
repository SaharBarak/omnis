'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { MURAL_GROUND } from '@/lib/design/system-flavors'
import { TYPE } from '@/lib/design/landing-tokens'
import { AmbientVideo } from './ambient-video'
import { Magnetic } from './magnetic'

// ============================================
// PORTAL CTA — the boarding door (Railway's "All Aboard", ours in stone).
// Dawn light breathes inside the arch; the thread ends at the threshold.
// Spec: HOMEPAGE_SPEC §15, MOTION_SPEC §13.
// ============================================

export function PortalCta() {
  return (
    <section
      className="relative overflow-hidden py-28 md:py-40"
      style={{ backgroundColor: MURAL_GROUND }}
    >
      <div className="mx-auto flex max-w-content flex-col items-center gap-14 px-6 md:flex-row md:justify-center md:gap-20">
        {/* The doorway */}
        <motion.div
          className="relative w-full max-w-sm overflow-hidden rounded-t-[10rem] rounded-b-2xl border border-white/10 shadow-2xl"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        >
          <AmbientVideo
            webmSrc="/videos/redesign/portal-loop.webm"
            mp4Src="/videos/redesign/portal-loop.mp4"
            poster="/images/redesign/mural/portal-cta.webp"
            className="h-auto w-full"
          />
        </motion.div>

        {/* The invitation */}
        <div className="max-w-md text-center md:text-left">
          <motion.h2
            className={TYPE.section}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            The map starts with one birthday. Yours.
          </motion.h2>
          <motion.p
            className="mt-5 text-lg text-white/70"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Add yourself first. Then the people who shape your days. Omnis
            remembers them, connects them, and lets the map grow with your life.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Magnetic className="mt-8">
              <Button
                asChild
                size="lg"
                className="animate-glow-pulse rounded-full bg-gold px-10 text-base font-semibold text-ground transition-transform hover:bg-gold-soft active:scale-[0.98]"
              >
                <Link href="/login">Open the map</Link>
              </Button>
            </Magnetic>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
