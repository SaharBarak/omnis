'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { TYPE } from '@/lib/design/landing-tokens'

// ============================================
// NAV — translucent over the mural, densifies after scroll.
// ============================================

export function NavV2() {
  const [dense, setDense] = useState(false)

  useEffect(() => {
    const onScroll = () => setDense(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        dense ? 'border-b border-white/10 bg-ground/90 backdrop-blur-md' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-content items-center justify-between px-6">
        <Link href="/" className={TYPE.card}>
          Omnis
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-white/70 md:flex">
          <Link href="/calculate" className="transition-colors hover:text-white">
            Your reading
          </Link>
          <Link href="/learn" className="transition-colors hover:text-white">
            Knowledge
          </Link>
          <Link href="/pricing" className="transition-colors hover:text-white">
            Pricing
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden text-sm text-white/70 transition-colors hover:text-white md:block"
          >
            Sign in
          </Link>
          <Button
            asChild
            size="sm"
            className="rounded-full bg-gold px-5 font-semibold text-ground transition-transform hover:bg-gold-soft active:scale-[0.98]"
          >
            <Link href="/login">Open your map</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
