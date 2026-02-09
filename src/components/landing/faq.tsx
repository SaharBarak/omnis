'use client'

import { useState } from 'react'

const faqs = [
  {
    question: "What can I do with the free plan?",
    answer: "Free lets you save 1 profile (yourself) with Dreamspell calculations and daily kin. It's designed to try Omnis before upgrading. To save family/friends, access all 6 systems, get AI interpretations, or export PDFs, you'll need Complete ($9/mo) or Practitioner ($29/mo).",
  },
  {
    question: "I don't know my exact birth time. Can I still use Omnis?",
    answer: "Yes. Your birth date alone gives you Dreamspell, Tzolkin, Long Count, and Kabbalah - four of the six systems. Human Design authority and astrology Moon/Rising require exact time. You can add it later if you find it (birth certificates often have it).",
  },
  {
    question: "How accurate are the calculations?",
    answer: "Dreamspell follows Arguelles' system with correct leap-day handling. Human Design uses the standard mandala. Tzolkin uses the GMT correlation (584283). We've cross-referenced against established sources. If you find an error, contact us - we take accuracy seriously.",
  },
  {
    question: "What's the difference between Dreamspell and Tzolkin?",
    answer: "Dreamspell is Jose Arguelles' modern system (1987), synchronized to July 26 with leap-day skipping. Tzolkin is the traditional Mayan count using the GMT correlation - an unbroken count spanning millennia. They give different kin numbers for the same date. We calculate both.",
  },
  {
    question: "Can I use this with clients?",
    answer: "The Complete plan ($9/mo) lets you save up to 10 profiles with all 6 systems, 30 AI interpretations, and PDF exports - great for personal use. The Practitioner plan ($29/mo) unlocks unlimited profiles, unlimited AI, group analysis, and advanced relationship tools - designed for working with clients professionally.",
  },
  {
    question: "How is my data stored?",
    answer: "We use Supabase with Row Level Security. Your data is encrypted. You can export everything or delete your account at any time. We don't track, advertise, or sell data.",
  },
]

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
                Everything you need to know about Omnis. Can&apos;t find what you&apos;re looking for?
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
