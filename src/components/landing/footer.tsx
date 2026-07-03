'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const footerLinks = {
  Product: [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: "Today's Kin", href: '/today' },
    { label: 'Calculator', href: '/calculate' },
  ],
  Learn: [
    { label: 'Dreamspell', href: '/learn/dreamspell' },
    { label: 'Human Design', href: '/learn/human-design' },
    { label: 'Astrology', href: '/learn/astrology' },
    { label: 'Kabbalah', href: '/learn/gematria' },
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ],
  Legal: [
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
  ],
}

export function Footer() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || loading) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() })
      })

      const data = await response.json()

      if (response.ok) {
        setSubscribed(true)
      } else {
        setError(data.error || 'Failed to subscribe. Please try again.')
      }
    } catch {
      setError('An error occurred. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <footer className="border-t border-border bg-background">
      <div className="max-w-content mx-auto px-6 py-14 lg:py-16">
        {/* Newsletter */}
        <div className="mb-12 pb-12 border-b border-border">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-heading text-foreground mb-2">Daily galactic signature</h3>
              <p className="text-muted-foreground">The day&apos;s kin, seal, tone, and affirmation in your inbox each morning. Free.</p>
            </div>

            {subscribed ? (
              <div className="flex items-center gap-3 px-4 py-2.5 border border-border">
                <span className="text-sm text-foreground">Subscribed. Check your inbox tomorrow morning.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col gap-2 w-full lg:w-auto">
                <div className="flex gap-3">
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full lg:w-64 h-11 bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary rounded-lg"
                    required
                    disabled={loading}
                  />
                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-11 px-5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-colors duration-200"
                  >
                    {loading ? 'Subscribing...' : 'Subscribe'}
                  </Button>
                </div>
                {error && (
                  <p className="text-destructive text-sm">{error}</p>
                )}
              </form>
            )}
          </div>
        </div>

        {/* Links grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="group flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 flex items-center justify-center">
                <svg viewBox="0 0 32 32" className="w-7 h-7">
                  <circle cx="16" cy="16" r="14" fill="none" stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.3" />
                  <circle cx="16" cy="16" r="9" fill="none" stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.5" />
                  <circle cx="16" cy="16" r="4" fill="hsl(var(--primary))" />
                </svg>
              </div>
              <span className="text-lg font-heading text-foreground group-hover:text-primary transition-colors duration-200">OmnisX</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Six wisdom systems. One view.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground mb-4">{category}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-foreground/70 hover:text-foreground transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">&copy; 2026 OmnisX. All rights reserved.</p>
          <p className="text-sm text-muted-foreground italic">Time is not money. Time is Art.</p>
        </div>
      </div>
    </footer>
  )
}
