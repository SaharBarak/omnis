'use client'

import { useState } from 'react'
import { faqs } from '@/lib/data/faqs'

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="py-28 lg:py-36 px-6 bg-muted/20" id="faq">
      <div className="max-w-content mx-auto">
        {/* 2-column layout: heading left, accordion right */}
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-20">
          {/* Left — heading */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-24">
              <div className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground mb-3">
                Common questions
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading text-foreground mb-4">
                Frequently asked
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Everything you need to know about OmnisX. Can&apos;t find what you&apos;re looking for?
              </p>
              <a
                href="/contact"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors duration-200"
              >
                Contact us
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>
          </div>

          {/* Right — accordion */}
          <div className="lg:col-span-8">
            <div className="space-y-0 border-t border-border">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="border-b border-border"
                >
                  <button
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                    className="w-full py-5 text-left flex items-start justify-between gap-4 group"
                  >
                    <span className={`text-base font-medium transition-colors duration-200 ${
                      openIndex === index ? 'text-foreground' : 'text-foreground/80 group-hover:text-foreground'
                    }`}>
                      {faq.question}
                    </span>
                    <div className={`flex-shrink-0 mt-1 transition-transform duration-200 ease-in-out ${
                      openIndex === index ? 'rotate-45' : ''
                    }`}>
                      <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-200 ease-in-out ${
                      openIndex === index ? 'max-h-96 opacity-100 pb-5' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <p className="text-muted-foreground leading-relaxed pr-12">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
