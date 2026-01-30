'use client'

const steps = [
  {
    number: '01',
    title: 'Enter birth date',
    description: 'Date alone works for Dreamspell, Tzolkin, Long Count, and Gematria. Add time and location for Human Design and full astrology.',
    icon: (
      <svg viewBox="0 0 48 48" className="w-8 h-8">
        <rect x="8" y="6" width="32" height="36" rx="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M16 6V2M32 6V2M8 14h32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="24" cy="28" r="6" fill="currentColor" opacity="0.3" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'All systems calculated',
    description: 'Kin, seal, tone, wavespell, castle, oracle map, bodygraph, natal chart, gematria values - computed in under 2 seconds.',
    icon: (
      <svg viewBox="0 0 48 48" className="w-8 h-8">
        <circle cx="24" cy="24" r="16" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M24 14v10l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="24" cy="24" r="3" fill="currentColor" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Save and track',
    description: 'Store unlimited profiles, see relationship dynamics, track personal milestones like galactic returns and tun birthdays.',
    icon: (
      <svg viewBox="0 0 48 48" className="w-8 h-8">
        <path d="M8 12h32v28a4 4 0 01-4 4H12a4 4 0 01-4-4V12z" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M16 4v8M32 4v8M16 24h16M16 32h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="36" cy="36" r="8" fill="currentColor" opacity="0.3" />
        <path d="M34 36l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
]

export function HowItWorks() {
  return (
    <section className="py-20 lg:py-28 px-6 bg-background" id="how-it-works">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-14">
          <div className="earth-badge inline-flex mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
            <span>Simple and direct</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-heading text-foreground mb-4">
            How it <span className="text-earth-gradient">works</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Enter your data. Get your calculations. Save for later.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line (desktop) */}
          <div className="hidden lg:block absolute top-16 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px bg-border" />

          <div className="grid lg:grid-cols-3 gap-10 lg:gap-12">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className="relative text-center"
              >
                {/* Icon container */}
                <div className="relative inline-flex items-center justify-center mb-6">
                  {/* Circle */}
                  <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center border border-border text-primary">
                    {step.icon}
                  </div>

                  {/* Number badge */}
                  <div className="absolute -top-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                    {index + 1}
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-xl font-heading text-foreground mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed max-w-xs mx-auto">
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
