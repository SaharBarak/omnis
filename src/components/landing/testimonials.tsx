'use client'

import { useState, useEffect } from 'react'

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

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="py-28 lg:py-36 px-6 bg-muted/30" id="testimonials">
      <div className="max-w-3xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-12">
          <div className="earth-badge inline-flex mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span>From practitioners and students</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-heading text-foreground">
            How people <span className="text-earth-gradient">actually use it</span>
          </h2>
        </div>

        {/* Testimonial card */}
        <div className="relative min-h-[320px]">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-all duration-500 ${
                index === activeIndex
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-4 pointer-events-none'
              }`}
            >
              <div className="earth-card bg-card p-8 lg:p-10 text-center h-full flex flex-col justify-center">
                {/* Quote mark */}
                <div className="mb-6">
                  <span className="text-5xl font-heading text-primary/30">&ldquo;</span>
                </div>

                {/* Quote */}
                <blockquote className="text-lg lg:text-xl font-heading text-foreground leading-relaxed mb-8">
                  {testimonial.quote}
                </blockquote>

                {/* Author */}
                <div className="flex items-center justify-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center text-primary font-medium">
                    {testimonial.avatar}
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-foreground">{testimonial.author}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.title}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation dots */}
        <div className="flex justify-center gap-2 mt-8">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`transition-all duration-300 rounded-full ${
                index === activeIndex
                  ? 'w-8 h-2 bg-primary'
                  : 'w-2 h-2 bg-border hover:bg-primary/50'
              }`}
              aria-label={`View testimonial ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
