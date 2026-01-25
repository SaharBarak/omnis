'use client'

import { useState } from 'react'

const faqs = [
  {
    question: "What if I don't know my birth time?",
    answer: "No problem! Dreamspell, Tzolkin, and Gematria only need your birth date. Human Design and precise Astrology (Moon sign, Rising) need time—you can add it later when you find out. We'll show you which calculations are affected.",
  },
  {
    question: "Is this based on real Dreamspell/Human Design?",
    answer: "Yes! We use authentic calculations from original source materials. Dreamspell follows the José Argüelles system with leap-day correction. Human Design uses the official mandala with correct gate positions. Our calculations have been verified against established references.",
  },
  {
    question: "Can I use this for clients/workshops?",
    answer: "Absolutely! Our Pro plan lets you save unlimited people, create groups, and export beautiful PDFs. The Canvas editor is perfect for creating visual maps during workshops. Many practitioners and facilitators use Omnis daily.",
  },
  {
    question: "What's the difference between Dreamspell & Tzolkin?",
    answer: "Great question! Dreamspell is José Argüelles' modern interpretation (1987), using a count from July 26, 1987 with leap-day skipping. Traditional Tzolkin is the ancient Mayan count using the GMT correlation (584283). We show you both!",
  },
  {
    question: "Is my data private?",
    answer: "100%. Your data is encrypted and never shared. We don't sell data or show ads. You're in full control—export or delete your data anytime. We use Supabase with Row Level Security, meaning only you can access your data.",
  },
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="py-20 px-4" id="faq">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Frequently Asked <span className="text-gold-gradient">Questions</span>
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="glass rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-white/5 transition-colors"
              >
                <span className="font-medium">{faq.question}</span>
                <svg
                  className={`w-5 h-5 flex-shrink-0 transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <div className="px-6 pb-4 text-muted-foreground">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
