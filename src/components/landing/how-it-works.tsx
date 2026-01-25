const steps = [
  {
    number: '1',
    icon: '📅',
    title: 'Enter Birth Data',
    description: 'Date, time (optional), and location. Takes 30 seconds.',
  },
  {
    number: '2',
    icon: '✨',
    title: 'We Calculate',
    description: '6 systems computed instantly. All calculations verified.',
  },
  {
    number: '3',
    icon: '🔮',
    title: 'Explore Insights',
    description: 'Save people, track relationships, create visual boards.',
  },
]

export function HowItWorks() {
  return (
    <section className="py-20 px-4" id="how-it-works">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            How It <span className="text-gold-gradient">Works</span>
          </h2>
          <p className="text-muted-foreground">
            In 3 simple steps
          </p>
        </div>

        <div className="relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-16 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={step.number} className="relative text-center">
                {/* Step number */}
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <span className="font-bold text-primary">{step.number}</span>
                </div>

                {/* Icon */}
                <div className="text-4xl mb-4">{step.icon}</div>

                {/* Content */}
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
