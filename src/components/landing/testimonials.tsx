'use client'

import { useState, useEffect } from 'react'

const testimonials = [
  {
    quote: "Finally, one app that combines everything. I used to check 4 different sites daily. Now I have it all in one place.",
    author: "Sarah K.",
    title: "Holistic Coach",
    rating: 5,
  },
  {
    quote: "The Human Design calculations are spot-on. I've verified them against multiple sources. This is the real deal.",
    author: "Michael R.",
    title: "HD Analyst",
    rating: 5,
  },
  {
    quote: "I use this for all my clients now. The group analysis feature is invaluable for understanding team dynamics.",
    author: "Elena T.",
    title: "Team Facilitator",
    rating: 5,
  },
  {
    quote: "Beautiful interface, accurate calculations, and the Canvas editor lets me create stunning visual maps for workshops.",
    author: "David L.",
    title: "Workshop Leader",
    rating: 5,
  },
]

export function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="py-20 px-4" id="testimonials">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            What Our <span className="text-gold-gradient">Community</span> Says
          </h2>
        </div>

        <div className="relative overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="w-full flex-shrink-0 px-4"
              >
                <div className="glass rounded-2xl p-8 text-center max-w-2xl mx-auto">
                  <div className="flex justify-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>

                  <blockquote className="text-lg sm:text-xl mb-6">
                    &ldquo;{testimonial.quote}&rdquo;
                  </blockquote>

                  <div className="text-muted-foreground">
                    <div className="font-medium text-foreground">{testimonial.author}</div>
                    <div className="text-sm">{testimonial.title}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dots navigation */}
        <div className="flex justify-center gap-2 mt-8">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === activeIndex
                  ? 'w-6 bg-accent'
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
              aria-label={`View testimonial ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
