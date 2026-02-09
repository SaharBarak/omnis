'use client'

import { useState, useEffect, useCallback } from 'react'

const testimonials = [
  {
    quote: "I was bouncing between Law of Time, Jovian Archive, and three astrology sites. Having everything in one place changes how you work. I actually use these systems daily now instead of whenever I could spare the effort.",
    author: "Sarah K.",
    title: "Coach, Los Angeles",
    avatar: "S",
  },
  {
    quote: "I cross-checked the Dreamspell calculations against my own spreadsheets. The leap-day handling is correct. The wavespell placements are correct. Finally, a tool I can trust.",
    author: "Michael R.",
    title: "Human Design Analyst",
    avatar: "M",
  },
  {
    quote: "Used the group analysis for a team of 6. Seeing all their types and kins side by side - and who shares which oracle positions - was genuinely useful for understanding dynamics.",
    author: "Elena T.",
    title: "Organizational Development",
    avatar: "E",
  },
  {
    quote: "I track galactic returns for everyone in my family. The timeline feature shows exactly when they fall. My mother's 52nd birthday coincided with her galactic return - we finally understood why that year was so significant.",
    author: "David L.",
    title: "Student of Dreamspell",
    avatar: "D",
  },
]

export function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const next = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length)
  }, [])

  const prev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }, [])

  useEffect(() => {
    if (isPaused) return
    const interval = setInterval(next, 6000)
    return () => clearInterval(interval)
  }, [isPaused, next])

  return (
    <section
      className="py-28 lg:py-36 px-6 bg-muted/20"
      id="testimonials"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="max-w-content mx-auto">
        {/* Header row — title left, controls right */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground mb-3">
              From practitioners and students
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading text-foreground">
              How people actually use it
            </h2>
          </div>

          <div className="hidden sm:flex items-center gap-4">
            {/* Counter */}
            <span className="text-sm text-muted-foreground font-mono">
              {activeIndex + 1}/{testimonials.length}
            </span>

            {/* Prev/Next arrows */}
            <div className="flex gap-2">
              <button
                onClick={prev}
                className="w-10 h-10 flex items-center justify-center border border-border hover:border-foreground/30 text-muted-foreground hover:text-foreground transition-all duration-200"
                aria-label="Previous testimonial"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={next}
                className="w-10 h-10 flex items-center justify-center border border-border hover:border-foreground/30 text-muted-foreground hover:text-foreground transition-all duration-200"
                aria-label="Next testimonial"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-px bg-border mb-10 relative overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-foreground transition-all duration-500 ease-in-out"
            style={{ width: `${((activeIndex + 1) / testimonials.length) * 100}%` }}
          />
        </div>

        {/* Testimonial cards — horizontal slider */}
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="w-full flex-shrink-0 px-0 sm:pr-8"
              >
                <div className="grid lg:grid-cols-12 gap-8 lg:gap-16 items-start">
                  {/* Quote */}
                  <div className="lg:col-span-8">
                    <blockquote className="text-2xl sm:text-3xl lg:text-4xl font-heading text-foreground leading-snug tracking-tight">
                      &ldquo;{testimonial.quote}&rdquo;
                    </blockquote>
                  </div>

                  {/* Author */}
                  <div className="lg:col-span-4 flex items-start gap-4">
                    <div className="w-12 h-12 bg-foreground/5 border border-border flex items-center justify-center text-foreground font-heading text-lg flex-shrink-0">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{testimonial.author}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.title}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile controls */}
        <div className="flex sm:hidden items-center justify-between mt-8">
          <span className="text-sm text-muted-foreground font-mono">
            {activeIndex + 1}/{testimonials.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={prev}
              className="w-10 h-10 flex items-center justify-center border border-border text-muted-foreground"
              aria-label="Previous testimonial"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={next}
              className="w-10 h-10 flex items-center justify-center border border-border text-muted-foreground"
              aria-label="Next testimonial"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
