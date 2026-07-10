'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Header, Footer } from '@/components/landing'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    setLoading(true)
    // Simulate submission - in production, this would send to an API
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSubmitted(true)
    setLoading(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16 px-6">
        <div className="max-w-2xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-10">
            <div className="earth-badge inline-flex mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Get in Touch</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-heading text-foreground mb-4">Contact Us</h1>
            <p className="text-lg text-muted-foreground">
              Have questions? We&apos;d love to hear from you.
            </p>
          </div>

          {submitted ? (
            /* Success Message */
            <div className="earth-card bg-card p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-heading mb-4">Message Sent!</h2>
              <p className="text-muted-foreground mb-6">
                Thank you for reaching out. We&apos;ll get back to you as soon as possible.
              </p>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-lg border border-border px-6 py-3 font-medium hover:bg-muted/50 transition-colors"
              >
                Return to Home
              </Link>
            </div>
          ) : (
            /* Contact Form */
            <div className="earth-card bg-card p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your name"
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      className="bg-background border-border"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    name="subject"
                    type="text"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="What's this about?"
                    className="bg-background border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us more..."
                    rows={5}
                    className="flex min-h-[80px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </div>
          )}

          {/* Alternative Contact */}
          <div className="mt-10 text-center">
            <p className="text-muted-foreground mb-4">
              You can also reach us directly at:
            </p>
            <a
              href="mailto:hello@pleiad.io"
              className="text-primary hover:underline font-medium"
            >
              hello@pleiad.io
            </a>
          </div>

          {/* FAQ Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Looking for answers? Check our{' '}
              <Link href="/#faq" className="text-primary hover:underline">
                FAQ section
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
