'use client'

import { landingImages, stepGradients } from '@/lib/landing-images'

const steps = [
  {
    number: '01',
    title: 'Enter birth date',
    description: 'Date alone works for Dreamspell, Tzolkin, Long Count, and Gematria. Add time and location for Human Design and full astrology.',
  },
  {
    number: '02',
    title: 'All systems calculated',
    description: 'Kin, seal, tone, wavespell, castle, oracle map, bodygraph, natal chart, gematria values - computed in under 2 seconds.',
  },
  {
    number: '03',
    title: 'Save and track',
    description: 'Store unlimited profiles, see relationship dynamics, track personal milestones like galactic returns and tun birthdays.',
  },
]

export function HowItWorks() {
  return (
    <section className="py-28 lg:py-36 px-6 bg-background" id="how-it-works">
      <div className="max-w-content mx-auto">
        {/* Section header */}
        <div className="mb-16">
          <div className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground mb-4">
            Simple and direct
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading text-foreground mb-4 tracking-tight">
            How it works
          </h2>
          <p className="text-lg text-muted-foreground max-w-lg">
            Enter your data. Get your calculations. Save for later.
          </p>
        </div>

        {/* Steps — horizontal with connecting line */}
        <div className="relative">
          {/* Connecting line (desktop) */}
          <div className="hidden lg:block absolute top-8 left-0 right-0 h-px bg-border" />

          <div className="grid lg:grid-cols-3 gap-0">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className="relative border-l lg:border-l-0 lg:border-t border-border pl-8 lg:pl-0 lg:pt-12 lg:pr-12 py-8 lg:py-0"
              >
                {/* Number */}
                <div className="absolute -left-px lg:left-0 top-8 lg:-top-4 w-px lg:w-auto h-4 lg:h-px">
                  <span className="absolute -left-4 lg:left-0 -top-2 lg:-top-4 text-[11px] font-mono text-muted-foreground bg-background px-1">
                    {step.number}
                  </span>
                </div>

                {/* Step image / gradient placeholder */}
                <div className="relative h-32 mb-5 overflow-hidden border border-border">
                  <div
                    className="absolute inset-0"
                    style={{ background: stepGradients[step.number] }}
                  />
                  <img
                    src={landingImages.steps[step.number as keyof typeof landingImages.steps]}
                    alt={step.title}
                    className="absolute inset-0 w-full h-full object-cover z-10"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                </div>

                {/* Content */}
                <h3 className="text-xl font-heading text-foreground mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
