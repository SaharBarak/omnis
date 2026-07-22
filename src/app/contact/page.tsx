'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NavV2, FooterV2, StarParallax, MuralBackdrop, AmbientVideo } from '@/components/landing-v2'
import { TYPE } from '@/lib/design/landing-tokens'
import { MURAL_GROUND } from '@/lib/design/system-flavors'
import { getTodayAcrossSystems, getFooterLiveLine } from '@/lib/today-board'

const INPUT_CLASSES = 'h-11 bg-white/[0.04] border-white/15 text-white placeholder:text-white/30'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Computed after mount: timezone/ICU-dependent — SSR rendering it
  // guarantees hydration text mismatches.
  const [liveLine, setLiveLine] = useState('')
  useEffect(() => {
    setLiveLine(getFooterLiveLine(getTodayAcrossSystems()))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          message: formData.subject
            ? `[${formData.subject}]\n\n${formData.message}`
            : formData.message,
        }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(data?.error ?? 'Sending failed. Email us directly instead.')
      }
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sending failed. Email us directly instead.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <div className="min-h-[100dvh]" style={{ backgroundColor: MURAL_GROUND }}>
      <NavV2 />
      <main className="relative overflow-hidden pb-24 pt-32 sm:pt-40">
        <StarParallax />

        {/* The portal doorway breathing at the page's right edge — reaching out. */}
        <MuralBackdrop placement="right-edge" opacity={0.3}>
          <AmbientVideo
            webmSrc="/videos/redesign/portal-loop.webm"
            mp4Src="/videos/redesign/portal-loop.mp4"
            poster="/images/redesign/mural/portal-cta.webp"
            className="h-full w-full object-cover"
          />
        </MuralBackdrop>

        {/* Hero */}
        <section className="relative mx-auto max-w-content px-6 text-center">
          <p className={`${TYPE.eyebrow} text-brand`}>Contact</p>
          <h1 className={`${TYPE.hero} mx-auto mt-4 max-w-3xl`}>
            Get in touch.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/70">
            Have questions? We&apos;d love to hear from you.
          </p>
        </section>

        <div className="relative mx-auto mt-14 max-w-2xl px-6">
          {submitted ? (
            /* Success Message */
            <div className="rounded-2xl border border-white/10 bg-surface p-6 text-center md:p-8">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-brand/50 bg-brand/15">
                <svg className="h-8 w-8 text-brand-soft" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="font-display text-2xl text-white">Message Sent!</h2>
              <p className="mt-4 text-white/70">
                Thank you for reaching out. We&apos;ll get back to you as soon as possible.
              </p>
              <Link
                href="/"
                className="mt-6 inline-flex items-center justify-center rounded-xl border border-white/15 px-6 py-3 font-medium text-white/80 transition-colors hover:bg-white/5 active:scale-[0.98]"
              >
                Return to Home
              </Link>
            </div>
          ) : (
            /* Contact Form */
            <div className="rounded-2xl border border-white/10 bg-surface p-6 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white/70">Name</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your name"
                      className={INPUT_CLASSES}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white/70">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      className={INPUT_CLASSES}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-white/70">Subject</Label>
                  <Input
                    id="subject"
                    name="subject"
                    type="text"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="What's this about?"
                    className={INPUT_CLASSES}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-white/70">Message</Label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us more..."
                    rows={5}
                    className="flex min-h-[80px] w-full rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <Button
                  type="submit"
                  className="h-11 w-full rounded-xl bg-brand text-white hover:bg-brand-soft active:scale-[0.98]"
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send message'}
                </Button>
                {error && (
                  <p className="text-center text-sm text-red-400/90">{error}</p>
                )}
                <p className="text-center text-xs text-white/40">
                  We reply within two business days.
                </p>
              </form>
            </div>
          )}

          {/* Alternative Contact */}
          <div className="mt-10 text-center">
            <p className="text-white/50">
              You can also reach us directly at:
            </p>
            <a
              href="mailto:hello@pleiad.io"
              className="mt-2 inline-block font-medium text-brand-soft hover:underline"
            >
              hello@pleiad.io
            </a>
          </div>

          {/* FAQ Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-white/50">
              Looking for answers? Check our{' '}
              <Link href="/#faq" className="text-brand-soft hover:underline">
                FAQ section
              </Link>
            </p>
          </div>
        </div>
      </main>
      <FooterV2 liveLine={liveLine} />
    </div>
  )
}
