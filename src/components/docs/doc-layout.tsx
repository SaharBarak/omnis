'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

interface Topic {
  id: string
  title: string
  anchor: string
}

interface Section {
  id: string
  title: string
  description: string
  icon: string
  topics: Topic[]
}

interface DocLayoutProps {
  children: React.ReactNode
  sections: Section[]
  currentSection: string
  accentColor?: string
}

interface TOCItem {
  id: string
  title: string
  level: number
}

// ============================================================================
// Section Icons
// ============================================================================

function SectionIcon({ icon, className }: { icon: string; className?: string }) {
  const iconClass = cn('w-5 h-5', className)

  switch (icon) {
    case 'circles':
      return (
        <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="8" opacity="0.3" />
          <circle cx="12" cy="12" r="5" opacity="0.5" />
          <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'bodygraph':
      return (
        <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="5" r="2.5" />
          <circle cx="8" cy="12" r="2" />
          <circle cx="16" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
          <path d="M12 7.5v9M10 12h4" />
        </svg>
      )
    case 'zodiac':
      return (
        <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4l1.4-1.4M17 7l1.4-1.4" />
        </svg>
      )
    case 'aleph':
      return (
        <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="5" y="5" width="14" height="14" rx="2" />
          <text x="12" y="16" textAnchor="middle" fontSize="10" fill="currentColor" fontFamily="serif">א</text>
        </svg>
      )
    case 'calendar':
      return (
        <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="4" y="5" width="16" height="14" rx="2" />
          <path d="M4 10h16M8 3v4M16 3v4" />
          <circle cx="12" cy="14" r="1.5" fill="currentColor" />
        </svg>
      )
    case 'merge':
      return (
        <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M6 6l6 6-6 6M18 6l-6 6 6 6" />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="8" />
        </svg>
      )
  }
}

// ============================================================================
// Reading Progress Bar
// ============================================================================

function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0
      setProgress(Math.min(100, Math.max(0, scrollPercent)))
    }

    window.addEventListener('scroll', updateProgress, { passive: true })
    updateProgress()

    return () => window.removeEventListener('scroll', updateProgress)
  }, [])

  return (
    <div className="doc-progress">
      <div className="doc-progress-bar" style={{ width: `${progress}%` }} />
    </div>
  )
}

// ============================================================================
// Mobile Drawer
// ============================================================================

interface MobileDrawerProps {
  isOpen: boolean
  onClose: () => void
  sections: Section[]
  currentSection: string
}

function MobileDrawer({ isOpen, onClose, sections, currentSection }: MobileDrawerProps) {
  const pathname = usePathname()

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      <div className="doc-drawer-overlay" onClick={onClose} />
      <div className="doc-drawer">
        <div className="doc-drawer-handle" />
        <div className="px-4 pb-4 max-h-[calc(85vh-4rem)] overflow-y-auto">
          <div className="mb-4">
            <Link
              href="/learn"
              onClick={onClose}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back to Knowledge Base
            </Link>
          </div>

          <div className="space-y-1">
            {sections.map((section) => {
              const isActive = section.id === currentSection

              return (
                <Link
                  key={section.id}
                  href={`/learn/${section.id}`}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-muted text-foreground'
                  )}
                >
                  <SectionIcon icon={section.icon} className={isActive ? 'text-primary' : 'text-muted-foreground'} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{section.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{section.description}</div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}

// ============================================================================
// Mobile Navigation Button
// ============================================================================

interface MobileNavButtonProps {
  section: Section
  onClick: () => void
}

function MobileNavButton({ section, onClick }: MobileNavButtonProps) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-5 py-3 rounded-full bg-card border border-border shadow-earth-lg"
    >
      <SectionIcon icon={section.icon} className="text-primary" />
      <span className="font-medium text-sm">{section.title}</span>
      <svg viewBox="0 0 24 24" className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 9l6 6 6-6" />
      </svg>
    </button>
  )
}

// ============================================================================
// Desktop Sidebar
// ============================================================================

interface DesktopSidebarProps {
  sections: Section[]
  currentSection: string
  tocItems: TOCItem[]
  activeHeading: string
}

function DesktopSidebar({ sections, currentSection, tocItems, activeHeading }: DesktopSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>([currentSection])
  const pathname = usePathname()

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  return (
    <aside className="hidden lg:block w-72 flex-shrink-0">
      <div className="sticky top-24 space-y-8 max-h-[calc(100vh-8rem)] overflow-y-auto pr-4 pb-8">
        {/* Back link */}
        <Link
          href="/learn"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Knowledge Base
        </Link>

        {/* Section navigation */}
        <nav className="space-y-1">
          {sections.map((section) => {
            const isActive = section.id === currentSection
            const isExpanded = expandedSections.includes(section.id)

            return (
              <div key={section.id}>
                <button
                  onClick={() => toggleSection(section.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all',
                    isActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground'
                  )}
                >
                  <SectionIcon icon={section.icon} className={isActive ? 'text-primary' : 'text-muted-foreground'} />
                  <span className="flex-1 font-medium text-sm">{section.title}</span>
                  <svg
                    viewBox="0 0 24 24"
                    className={cn('w-4 h-4 text-muted-foreground transition-transform', isExpanded && 'rotate-90')}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="ml-4 pl-4 border-l border-border mt-1 space-y-0.5">
                    {section.topics.map((topic) => (
                      <Link
                        key={topic.id}
                        href={`/learn/${section.id}#${topic.anchor}`}
                        className={cn(
                          'block px-3 py-1.5 rounded text-sm transition-colors',
                          'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        )}
                      >
                        {topic.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* On this page TOC */}
        {tocItems.length > 0 && (
          <div className="pt-6 border-t border-border">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-3">
              On this page
            </div>
            <nav className="doc-toc">
              {tocItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={cn(
                    'doc-toc-item',
                    item.level > 2 && 'doc-toc-item-nested',
                    activeHeading === item.id && 'active'
                  )}
                >
                  {item.title}
                </a>
              ))}
            </nav>
          </div>
        )}
      </div>
    </aside>
  )
}

// ============================================================================
// Main Layout Component
// ============================================================================

export function DocLayout({ children, sections, currentSection, accentColor }: DocLayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [tocItems, setTocItems] = useState<TOCItem[]>([])
  const [activeHeading, setActiveHeading] = useState('')
  const articleRef = useRef<HTMLElement>(null)

  const currentSectionData = sections.find(s => s.id === currentSection)

  // Extract TOC items from headings
  useEffect(() => {
    if (!articleRef.current) return

    const headings = articleRef.current.querySelectorAll('h2[id], h3[id]')
    const items: TOCItem[] = Array.from(headings).map((heading) => ({
      id: heading.id,
      title: heading.textContent || '',
      level: parseInt(heading.tagName[1])
    }))

    setTocItems(items)
  }, [children])

  // Track active heading on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHeading(entry.target.id)
          }
        })
      },
      { rootMargin: '-80px 0px -80% 0px' }
    )

    if (!articleRef.current) return

    const headings = articleRef.current.querySelectorAll('h2[id], h3[id]')
    headings.forEach((heading) => observer.observe(heading))

    return () => observer.disconnect()
  }, [tocItems])

  // Accent class for section
  const accentClass = `doc-accent-${currentSection}`

  return (
    <div className={cn('min-h-screen bg-background', accentClass)}>
      <ReadingProgress />

      <main className="pt-24 pb-24 lg:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="lg:flex lg:gap-12">
            {/* Desktop Sidebar */}
            <DesktopSidebar
              sections={sections}
              currentSection={currentSection}
              tocItems={tocItems}
              activeHeading={activeHeading}
            />

            {/* Main Content */}
            <article
              ref={articleRef}
              className="min-w-0 flex-1 max-w-3xl"
            >
              {children}
            </article>
          </div>
        </div>
      </main>

      {/* Mobile Navigation */}
      {currentSectionData && (
        <MobileNavButton
          section={currentSectionData}
          onClick={() => setDrawerOpen(true)}
        />
      )}

      <MobileDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sections={sections}
        currentSection={currentSection}
      />
    </div>
  )
}

// ============================================================================
// Doc Page Header
// ============================================================================

interface DocHeaderProps {
  badge: string
  title: string
  subtitle: string
  badgeColor?: 'primary' | 'secondary' | 'accent'
}

export function DocHeader({ badge, title, subtitle, badgeColor = 'primary' }: DocHeaderProps) {
  const colorMap = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    accent: 'bg-accent'
  }

  return (
    <header className="mb-12 sm:mb-16">
      <div className="earth-badge inline-flex mb-4">
        <span className={cn('w-1.5 h-1.5 rounded-full', colorMap[badgeColor])} />
        <span>{badge}</span>
      </div>
      <h1 className="doc-h1">{title}</h1>
      <p className="doc-lead">{subtitle}</p>
    </header>
  )
}

// ============================================================================
// Doc Section Component
// ============================================================================

interface DocSectionProps {
  id: string
  title: string
  children: React.ReactNode
  className?: string
}

export function DocSection({ id, title, children, className }: DocSectionProps) {
  return (
    <section className={cn('mb-12 sm:mb-16', className)}>
      <h2 id={id} className="doc-h2">{title}</h2>
      {children}
    </section>
  )
}

// ============================================================================
// Doc Navigation (prev/next)
// ============================================================================

interface DocNavProps {
  prev?: { href: string; title: string }
  next?: { href: string; title: string }
}

export function DocNav({ prev, next }: DocNavProps) {
  return (
    <nav className="doc-nav">
      {prev ? (
        <Link href={prev.href} className="doc-nav-link group">
          <div className="flex items-center gap-3">
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 text-muted-foreground group-hover:-translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <div>
              <div className="doc-nav-link-label">Previous</div>
              <div className="doc-nav-link-title">{prev.title}</div>
            </div>
          </div>
        </Link>
      ) : (
        <div />
      )}

      {next ? (
        <Link href={next.href} className="doc-nav-link group text-right">
          <div className="flex items-center justify-end gap-3">
            <div>
              <div className="doc-nav-link-label">Next</div>
              <div className="doc-nav-link-title">{next.title}</div>
            </div>
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
      ) : (
        <div />
      )}
    </nav>
  )
}

// ============================================================================
// Quick Stats Grid
// ============================================================================

interface StatItem {
  value: string | number
  label: string
}

interface DocStatsProps {
  stats: StatItem[]
}

export function DocStats({ stats }: DocStatsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 my-8 sm:my-12">
      {stats.map((stat, i) => (
        <div key={i} className="doc-stat">
          <div className="doc-stat-value">{stat.value}</div>
          <div className="doc-stat-label">{stat.label}</div>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// Info Box
// ============================================================================

interface InfoBoxProps {
  title?: string
  variant?: 'default' | 'primary' | 'secondary' | 'accent' | 'warning'
  icon?: React.ReactNode
  children: React.ReactNode
}

export function DocInfoBox({ title, variant = 'default', icon, children }: InfoBoxProps) {
  const variantClass = `doc-infobox-${variant}`

  return (
    <div className={cn('doc-infobox', variantClass)}>
      {(icon || title) && (
        <div className="flex items-start gap-3 mb-3">
          {icon && <div className="flex-shrink-0 mt-0.5">{icon}</div>}
          {title && <div className="font-medium text-foreground">{title}</div>}
        </div>
      )}
      <div className="text-sm text-muted-foreground leading-relaxed">
        {children}
      </div>
    </div>
  )
}

// ============================================================================
// Pull Quote
// ============================================================================

interface PullQuoteProps {
  quote: string
  author?: string
}

export function DocPullQuote({ quote, author }: PullQuoteProps) {
  return (
    <div className="doc-pullquote">
      <blockquote>&quot;{quote}&quot;</blockquote>
      {author && <cite>— {author}</cite>}
    </div>
  )
}
