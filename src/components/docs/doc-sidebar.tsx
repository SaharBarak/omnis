'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

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

interface DocSidebarProps {
  sections: Section[]
  currentSection?: string
  onTopicClick?: (anchor: string) => void
}

// Icons for each section
function SectionIcon({ icon, className }: { icon: string; className?: string }) {
  switch (icon) {
    case 'circles':
      return (
        <svg viewBox="0 0 24 24" className={cn('w-5 h-5', className)} fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="8" opacity="0.3" />
          <circle cx="12" cy="12" r="5" opacity="0.5" />
          <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'bodygraph':
      return (
        <svg viewBox="0 0 24 24" className={cn('w-5 h-5', className)} fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="5" r="2.5" />
          <circle cx="8" cy="12" r="2" />
          <circle cx="16" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
          <path d="M12 7.5v9M10 12h4" />
        </svg>
      )
    case 'zodiac':
      return (
        <svg viewBox="0 0 24 24" className={cn('w-5 h-5', className)} fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4l1.4-1.4M17 7l1.4-1.4" />
        </svg>
      )
    case 'aleph':
      return (
        <svg viewBox="0 0 24 24" className={cn('w-5 h-5', className)} fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="5" y="5" width="14" height="14" rx="2" />
          <text x="12" y="16" textAnchor="middle" fontSize="10" fill="currentColor" fontFamily="serif">א</text>
        </svg>
      )
    case 'calendar':
      return (
        <svg viewBox="0 0 24 24" className={cn('w-5 h-5', className)} fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="4" y="5" width="16" height="14" rx="2" />
          <path d="M4 10h16M8 3v4M16 3v4" />
          <circle cx="12" cy="14" r="1.5" fill="currentColor" />
        </svg>
      )
    case 'merge':
      return (
        <svg viewBox="0 0 24 24" className={cn('w-5 h-5', className)} fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M6 6l6 6-6 6M18 6l-6 6 6 6" />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 24 24" className={cn('w-5 h-5', className)} fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="8" />
        </svg>
      )
  }
}

export function DocSidebar({ sections, currentSection, onTopicClick }: DocSidebarProps) {
  const pathname = usePathname()
  const [expandedSections, setExpandedSections] = useState<string[]>([currentSection || sections[0]?.id])

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const isActiveSection = (sectionId: string) => {
    return pathname.includes(`/learn/${sectionId}`) || currentSection === sectionId
  }

  return (
    <nav className="w-full">
      {/* Mobile: Horizontal scroll */}
      <div className="lg:hidden flex overflow-x-auto gap-2 pb-4 -mx-2 px-2 scrollbar-hide">
        {sections.map((section) => (
          <Link
            key={section.id}
            href={`/learn/${section.id}`}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-colors',
              isActiveSection(section.id)
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            )}
          >
            <SectionIcon icon={section.icon} className="w-4 h-4" />
            {section.title}
          </Link>
        ))}
      </div>

      {/* Desktop: Vertical sidebar */}
      <div className="hidden lg:block space-y-1">
        {sections.map((section) => {
          const isExpanded = expandedSections.includes(section.id)
          const isActive = isActiveSection(section.id)

          return (
            <div key={section.id} className="space-y-1">
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted text-foreground'
                )}
              >
                <SectionIcon
                  icon={section.icon}
                  className={cn(isActive ? 'text-primary' : 'text-muted-foreground')}
                />
                <span className="flex-1 font-medium text-sm">{section.title}</span>
                <svg
                  viewBox="0 0 24 24"
                  className={cn(
                    'w-4 h-4 text-muted-foreground transition-transform',
                    isExpanded && 'rotate-90'
                  )}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>

              {/* Section Topics */}
              {isExpanded && (
                <div className="ml-4 pl-4 border-l border-border space-y-0.5">
                  {section.topics.map((topic) => (
                    <Link
                      key={topic.id}
                      href={`/learn/${section.id}#${topic.anchor}`}
                      onClick={() => onTopicClick?.(topic.anchor)}
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
      </div>
    </nav>
  )
}

export function DocMobileNav({ sections }: { sections: Section[] }) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const currentSection = sections.find(s => pathname.includes(`/learn/${s.id}`))

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full px-4 py-3 bg-card rounded-lg border border-border"
      >
        {currentSection && (
          <>
            <SectionIcon icon={currentSection.icon} className="w-5 h-5 text-primary" />
            <span className="flex-1 text-left font-medium">{currentSection.title}</span>
          </>
        )}
        {!currentSection && (
          <span className="flex-1 text-left text-muted-foreground">Select a topic</span>
        )}
        <svg
          viewBox="0 0 24 24"
          className={cn('w-5 h-5 text-muted-foreground transition-transform', isOpen && 'rotate-180')}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div className="mt-2 p-2 bg-card rounded-lg border border-border shadow-earth-lg">
          {sections.map((section) => (
            <Link
              key={section.id}
              href={`/learn/${section.id}`}
              onClick={() => setIsOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                pathname.includes(`/learn/${section.id}`)
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-muted text-foreground'
              )}
            >
              <SectionIcon icon={section.icon} />
              <div>
                <div className="font-medium text-sm">{section.title}</div>
                <div className="text-xs text-muted-foreground">{section.description}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
