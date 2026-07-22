'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TYPE } from '@/lib/design/landing-tokens'
import { BrandMark } from '@/components/brand-mark'

// ============================================
// NAV — translucent over the mural, densifies after scroll.
// Phone widths get a disclosure menu: the redesign shipped without one,
// which left Pricing/Knowledge/Sign in unreachable on mobile.
// ============================================

const LINKS = [
  { label: 'Your reading', href: '/calculate' },
  { label: 'Knowledge', href: '/learn' },
  { label: 'Pricing', href: '/pricing' },
] as const

export function NavV2() {
  const [dense, setDense] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setDense(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Open menu: lock body scroll, close on Escape.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        dense || open ? 'border-b border-white/10 bg-ground/90 backdrop-blur-md' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-content items-center justify-between px-6">
        <Link href="/" className={`flex items-center gap-2.5 ${TYPE.card}`}>
          <BrandMark size={26} />
          Pleiad
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-white/70 md:flex">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-white">
              {link.label}
            </Link>
          ))}
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
            className="rounded-xl bg-brand px-5 font-semibold text-white transition-transform hover:bg-brand-soft active:scale-[0.98]"
          >
            <Link href="/login">Open your map</Link>
          </Button>
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-lg border border-white/15 text-white/80 transition-colors hover:text-white md:hidden"
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-white/10 px-6 py-4 md:hidden">
          <ul className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block rounded-lg px-3 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/5 hover:text-white"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/login"
                className="block rounded-lg px-3 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/5 hover:text-white"
                onClick={() => setOpen(false)}
              >
                Sign in
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  )
}
