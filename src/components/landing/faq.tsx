'use client'

import { useState } from 'react'

const faqs = [
  {
    question: "What can I do with the free plan?",
    answer: "Free lets you save 1 profile (yourself) with Dreamspell calculations and daily kin. It's designed to try Omnis before upgrading. To save family/friends, access all 6 systems, get AI interpretations, or export PDFs, you'll need Complete ($9/mo) or Practitioner ($29/mo).",
  },
  {
    question: "I don't know my exact birth time. Can I still use Omnis?",
    answer: "Yes. Your birth date alone gives you Dreamspell, Tzolkin, Long Count, and Gematria - four of the six systems. Human Design authority and astrology Moon/Rising require exact time. You can add it later if you find it (birth certificates often have it).",
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
    <section className="py-20 lg:py-28 px-6 bg-muted/20" id="faq">
      <div className="max-w-3xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-12">
          <div className="earth-badge inline-flex mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span>Common questions</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-heading text-foreground">
            Frequently <span className="text-muted-foreground">asked</span>
          </h2>
        </div>

        {/* FAQ items */}
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="group"
            >
              <div className={`earth-card bg-card transition-all duration-300 overflow-hidden ${
                openIndex === index
                  ? 'border-primary/30'
                  : ''
              }`}>
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4"
                >
                  <span className={`font-medium transition-colors ${
                    openIndex === index ? 'text-primary' : 'text-foreground'
                  }`}>
                    {faq.question}
                  </span>
                  <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                    openIndex === index ? 'bg-primary text-primary-foreground rotate-180' : 'bg-muted text-muted-foreground'
                  }`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-5 pb-4 text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact link */}
        <div className="text-center mt-10">
          <p className="text-muted-foreground">
            Have another question?{' '}
            <a href="/contact" className="text-primary hover:text-primary/80 font-medium transition-colors">
              Contact us
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}
