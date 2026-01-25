import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function CTA() {
  return (
    <section className="py-20 px-4 relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-accent/5 to-transparent" />

      <div className="relative max-w-3xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">
          Ready to <span className="text-gold-gradient">Explore?</span>
        </h2>

        <p className="text-lg text-muted-foreground mb-8">
          Your cosmic blueprint is waiting. Start your journey today.
        </p>

        <Button
          size="lg"
          className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-8"
          asChild
        >
          <Link href="/login">
            Get Started Free
            <span className="ml-2">-&gt;</span>
          </Link>
        </Button>

        <p className="text-sm text-muted-foreground mt-4">
          No credit card required
        </p>
      </div>
    </section>
  )
}
