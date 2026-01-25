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
    { label: 'Gematria', href: '/learn/gematria' },
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
    <footer className="border-t border-border bg-card/50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Top section */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-accent text-xl">*</span>
              <span className="font-bold">OMNIS</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your cosmic blueprint
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold mb-4 text-sm">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Email signup */}
        <div className="glass rounded-xl p-6 mb-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-semibold mb-1">Get Daily Kin in Your Inbox</h4>
              <p className="text-sm text-muted-foreground">
                Start your day with cosmic guidance. Free forever.
              </p>
            </div>

            {subscribed ? (
              <div className="text-green-500 font-medium">
                You&apos;re subscribed! Check your inbox.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col gap-2 w-full md:w-auto">
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full md:w-64"
                    required
                    disabled={loading}
                  />
                  <Button type="submit" variant="outline" disabled={loading}>
                    {loading ? 'Subscribing...' : 'Subscribe'}
                  </Button>
                </div>
                {error && (
                  <p className="text-red-500 text-sm">{error}</p>
                )}
              </form>
            )}
          </div>
        </div>

        {/* Bottom section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>&copy; 2026 Omnis. All rights reserved.</p>

          <div className="flex items-center gap-4">
            <span>Made with ♡ for seekers</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
