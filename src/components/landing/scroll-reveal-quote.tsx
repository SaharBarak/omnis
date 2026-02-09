'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface ScrollRevealQuoteProps {
  text: string
  /** Words to highlight with accent color when revealed */
  accentWords?: string[]
  className?: string
}

export function ScrollRevealQuote({ text, accentWords = [], className = '' }: ScrollRevealQuoteProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [revealedCount, setRevealedCount] = useState(0)
  const words = text.split(' ')

  const accentSet = new Set(accentWords.map(w => w.toLowerCase()))

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const windowHeight = window.innerHeight

    // Calculate how far through the viewport the element has scrolled
    // Start revealing when element enters bottom quarter, finish when it reaches top quarter
    const startThreshold = windowHeight * 0.85
    const endThreshold = windowHeight * 0.25

    const elementCenter = rect.top + rect.height / 2
    const progress = Math.max(0, Math.min(1,
      (startThreshold - elementCenter) / (startThreshold - endThreshold)
    ))

    const count = Math.floor(progress * words.length)
    setRevealedCount(count)
  }, [words.length])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // initial check
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  return (
    <section className={`py-24 lg:py-32 px-6 bg-background ${className}`}>
      <div className="max-w-[900px] mx-auto">
        <div ref={containerRef} className="scroll-reveal-text">
          <p className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading leading-tight tracking-tight">
            {words.map((word, i) => {
              const isAccent = accentSet.has(word.toLowerCase().replace(/[.,!?;:]/g, ''))
              const isRevealed = i < revealedCount
              return (
                <span
                  key={i}
                  className={`word ${isRevealed ? 'revealed' : ''} ${isAccent ? 'accent' : ''}`}
                >
                  {word}
                </span>
              )
            })}
          </p>
        </div>
      </div>
    </section>
  )
}
