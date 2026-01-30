'use client'

export function SocialProof() {
  const stats = [
    { value: '10,847+', label: 'Profiles saved' },
    { value: '6', label: 'Systems calculated' },
    { value: 'Verified', label: 'Algorithms' },
    { value: '<2s', label: 'Full calculation' },
  ]

  return (
    <section className="py-8 border-y border-border bg-muted/30">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <span className="text-xl font-heading text-primary">{stat.value}</span>
              <span className="block text-xs text-muted-foreground mt-0.5">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
