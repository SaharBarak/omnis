'use client'

import Link from 'next/link'
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ChevronDown, X, Menu } from 'lucide-react'

// ============================================
// DROPDOWN DATA
// ============================================

const systemsItems = [
  {
    name: 'Human Design',
    description: 'Bodygraph, type, strategy & authority',
    href: '/learn/human-design',
  },
  {
    name: 'Dreamspell',
    description: 'Galactic signature, kin & oracle',
    href: '/learn/dreamspell',
  },
  {
    name: 'Astrology',
    description: 'Natal chart, planets & houses',
    href: '/learn/astrology',
  },
  {
    name: 'Tzolkin',
    description: 'Traditional Mayan sacred calendar',
    href: '/learn/tzolkin',
  },
  {
    name: 'Gematria',
    description: 'Hebrew numerology & letter values',
    href: '/learn/gematria',
  },
]

const learnItems = [
  { name: 'Overview', description: 'Introduction to all systems', href: '/learn' },
  { name: 'Integration', description: 'How the systems connect', href: '/learn/integration' },
  { name: "Today's Kin", description: 'Daily galactic signature', href: '/today' },
  { name: 'Calculate', description: 'Run a calculation', href: '/calculate' },
]

const aboutItems = [
  { name: 'About Omnis', description: 'Our mission and story', href: '/about' },
  { name: 'Contact', description: 'Get in touch', href: '/contact' },
  { name: 'Pricing', description: 'Plans and features', href: '#pricing' },
]

type DropdownKey = 'systems' | 'learn' | 'about' | null

// ============================================
// MEGA-MENU PANEL
// ============================================

function MegaMenuPanel({ activeDropdown, onClose }: { activeDropdown: DropdownKey; onClose: () => void }) {
  if (!activeDropdown) return null

  return (
    <AnimatePresence>
      {activeDropdown && (
        <motion.div
          key={activeDropdown}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="absolute top-full left-0 w-full bg-background border-b border-border"
        >
          <div className="max-w-content mx-auto px-6 py-8">
            {activeDropdown === 'systems' && (
              <div className="grid md:grid-cols-2 gap-10">
                {/* Left column — system links */}
                <div className="space-y-1">
                  <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-4">Systems</div>
                  {systemsItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className="block py-3 px-4 -mx-4 hover:bg-muted/30 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      <div className="font-medium text-foreground">{item.name}</div>
                      <div className="text-sm text-muted-foreground mt-0.5">{item.description}</div>
                    </Link>
                  ))}
                </div>
                {/* Right column — featured */}
                <div>
                  <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-4">Featured</div>
                  <Link
                    href="/learn"
                    onClick={onClose}
                    className="group block p-6 border border-border hover:border-primary/30 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    <div className="font-medium text-foreground mb-1">Five systems, one place</div>
                    <div className="text-sm text-muted-foreground mb-4">
                      Explore how Human Design, Dreamspell, Astrology, Tzolkin, and Gematria work together.
                    </div>
                    <span className="text-sm text-primary group-hover:underline">Explore all systems &rarr;</span>
                  </Link>
                </div>
              </div>
            )}

            {activeDropdown === 'learn' && (
              <div className="max-w-md space-y-1">
                <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-4">Learn</div>
                {learnItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className="block py-3 px-4 -mx-4 hover:bg-muted/30 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    <div className="font-medium text-foreground">{item.name}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">{item.description}</div>
                  </Link>
                ))}
              </div>
            )}

            {activeDropdown === 'about' && (
              <div className="max-w-md space-y-1">
                <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-4">About</div>
                {aboutItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className="block py-3 px-4 -mx-4 hover:bg-muted/30 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    <div className="font-medium text-foreground">{item.name}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">{item.description}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ============================================
// MOBILE MENU
// ============================================

function MobileMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)

  const toggleGroup = (group: string) => {
    setExpandedGroup(prev => prev === group ? null : group)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 lg:hidden"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-background border-l border-border overflow-y-auto"
          >
            <div className="flex items-center justify-between h-16 px-6 border-b border-border">
              <span className="text-sm font-heading font-semibold text-foreground">Menu</span>
              <button
                onClick={onClose}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="p-6 space-y-2">
              {/* Systems group */}
              <div>
                <button
                  onClick={() => toggleGroup('systems')}
                  className="flex items-center justify-between w-full py-3 text-sm font-medium text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  Systems
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${expandedGroup === 'systems' ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {expandedGroup === 'systems' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pl-4 pb-2 space-y-1">
                        {systemsItems.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                            className="block py-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                          >
                            {item.name}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Learn group */}
              <div>
                <button
                  onClick={() => toggleGroup('learn')}
                  className="flex items-center justify-between w-full py-3 text-sm font-medium text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  Learn
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${expandedGroup === 'learn' ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {expandedGroup === 'learn' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pl-4 pb-2 space-y-1">
                        {learnItems.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                            className="block py-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                          >
                            {item.name}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* About group */}
              <div>
                <button
                  onClick={() => toggleGroup('about')}
                  className="flex items-center justify-between w-full py-3 text-sm font-medium text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  About
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${expandedGroup === 'about' ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {expandedGroup === 'about' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pl-4 pb-2 space-y-1">
                        {aboutItems.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                            className="block py-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                          >
                            {item.name}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Divider + CTA */}
              <div className="pt-6 mt-4 border-t border-border space-y-3">
                <Link
                  href="/login"
                  onClick={onClose}
                  className="block py-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  Sign In
                </Link>
                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium h-11 rounded-none transition-all duration-200 active:scale-[0.98]"
                  asChild
                >
                  <Link href="/login" onClick={onClose}>Get Your Chart</Link>
                </Button>
              </div>
            </nav>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ============================================
// HEADER
// ============================================

export function Header() {
  const [activeDropdown, setActiveDropdown] = useState<DropdownKey>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const dropdownTriggers: { key: DropdownKey; label: string }[] = [
    { key: 'systems', label: 'Systems' },
    { key: 'learn', label: 'Learn' },
    { key: 'about', label: 'About' },
  ]

  const handleMouseEnter = useCallback((key: DropdownKey) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
    setActiveDropdown(key)
  }, [])

  const handleMouseLeave = useCallback(() => {
    closeTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null)
    }, 150)
  }, [])

  const handleClose = useCallback(() => {
    setActiveDropdown(null)
  }, [])

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveDropdown(null)
        setIsMobileMenuOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setActiveDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <>
      <header
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border"
        onMouseLeave={handleMouseLeave}
      >
        <div className="max-w-content mx-auto px-6">
          <div className="flex items-center justify-between h-16 lg:h-18">
            {/* Logo */}
            <Link href="/" className="group flex items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
              <div className="w-8 h-8 flex items-center justify-center">
                <svg viewBox="0 0 32 32" className="w-7 h-7">
                  <circle cx="16" cy="16" r="14" fill="none" stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.3" />
                  <circle cx="16" cy="16" r="9" fill="none" stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.5" />
                  <circle cx="16" cy="16" r="4" fill="hsl(var(--primary))" />
                </svg>
              </div>
              <span className="text-xl font-heading font-medium text-foreground group-hover:text-primary transition-colors duration-200">
                Omnis
              </span>
            </Link>

            {/* Desktop Nav — center */}
            <nav className="hidden lg:flex items-center gap-1">
              {dropdownTriggers.map(({ key, label }) => (
                <button
                  key={key}
                  onMouseEnter={() => handleMouseEnter(key)}
                  onClick={() => setActiveDropdown(prev => prev === key ? null : key)}
                  className={`flex items-center gap-1 px-4 py-2 text-sm font-sans transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                    activeDropdown === key
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  aria-expanded={activeDropdown === key}
                >
                  {label}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdown === key ? 'rotate-180' : ''}`} />
                </button>
              ))}
            </nav>

            {/* Desktop CTA — right */}
            <div className="hidden lg:flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Sign In
              </Link>
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-5 h-9 rounded-none transition-all duration-200 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                asChild
              >
                <Link href="/login">Get Your Chart</Link>
              </Button>
            </div>

            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 text-muted-foreground hover:text-foreground transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mega-menu dropdown panels */}
        <MegaMenuPanel activeDropdown={activeDropdown} onClose={handleClose} />

        {/* Active dropdown bottom accent line */}
        {activeDropdown && (
          <div className="hidden lg:flex max-w-content mx-auto px-6">
            {/* Accent handled by border-b of parent */}
          </div>
        )}
      </header>

      {/* Mobile menu */}
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </>
  )
}
