'use client'

import { motion } from 'framer-motion'

import { NewsletterSignup } from './newsletter-signup'
import { GetTheApp } from '@/components/billing/get-the-app'
import { TYPE } from '@/lib/design/landing-tokens'
import { MURAL_GROUND } from '@/lib/design/system-flavors'


// ============================================
// DOWNLOAD CTA — the app is pre-launch. This section captures the waitlist +
// the newsletter into the same Resend audience: get the daily kin by email now,
// be first to know when iOS/Android ships. GetTheApp renders "coming soon"
// until NEXT_PUBLIC_APP_STORE_URL / PLAY_STORE_URL are set, then lights up
// automatically — no dead links ship.
// ============================================

export function DownloadCta() {
  return (
    <section
      id="download"
      className="relative overflow-hidden py-24 md:py-32"
      style={{ backgroundColor: MURAL_GROUND }}
    >
      <motion.div
        className="mx-auto max-w-content px-6 text-center"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
      >
        <p className={`${TYPE.eyebrow} mb-4 text-brand-soft`}>The app</p>
        <h2 className={`${TYPE.section} mb-4`}>Carry the sky in your pocket.</h2>
        <p className="mx-auto mb-8 max-w-xl text-white/60">
          Pleiad for iOS and Android is coming soon. Get today&apos;s Kin and the
          sky&apos;s phenomena by email now, and be first through the door when the
          app lands.
        </p>

        <div className="mb-10 flex justify-center">
          <GetTheApp className="justify-center" />
        </div>

        <NewsletterSignup />
      </motion.div>
    </section>
  )
}
